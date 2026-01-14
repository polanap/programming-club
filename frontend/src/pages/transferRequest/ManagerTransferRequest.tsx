import React, { useState, useEffect } from 'react';
import { transferRequestAPI, groupAPI } from '../../services/api';
import { TransferRequest, TransferRequestStatus, Group, AddAvailableGroupsDTO } from '../../types';
import Header from '../../components/header/Header';
import styles from './TransferRequest.module.scss';

const ManagerTransferRequest: React.FC = () => {
  const [unassignedRequests, setUnassignedRequests] = useState<TransferRequest[]>([]);
  const [myRequests, setMyRequests] = useState<TransferRequest[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(false);
  const [groupsError, setGroupsError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'unassigned' | 'my'>('unassigned');
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  const [showAddGroupsForm, setShowAddGroupsForm] = useState<boolean>(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [showCuratorSelection, setShowCuratorSelection] = useState<boolean>(false);
  const [curators, setCurators] = useState<any[]>([]);
  const [selectedCuratorId, setSelectedCuratorId] = useState<number | null>(null);
  const [requestIdForClarification, setRequestIdForClarification] = useState<number | null>(null);
  const [loadingCurators, setLoadingCurators] = useState<boolean>(false);
  const [curatorError, setCuratorError] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [unassignedRes, myRes, groupsRes] = await Promise.all([
        transferRequestAPI.getUnassigned(),
        transferRequestAPI.getMyManagerRequests(),
        groupAPI.getAll()
      ]);
      setUnassignedRequests(Array.isArray(unassignedRes.data) ? unassignedRes.data : []);
      setMyRequests(Array.isArray(myRes.data) ? myRes.data : []);
      setAllGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleTakeRequest = async (requestId: number) => {
    try {
      setError('');
      await transferRequestAPI.takeRequest(requestId);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка взятия заявки в работу');
    }
  };

  const handleRequestClarification = async (requestId: number) => {
    // Сначала открываем модальное окно
    setRequestIdForClarification(requestId);
    setSelectedCuratorId(null);
    setCurators([]);
    setCuratorError('');
    setShowCuratorSelection(true);
    setLoadingCurators(true);

    // Потом загружаем кураторов
    try {
      const curatorsRes = await transferRequestAPI.getGroupCurators(requestId);
      const curatorsList = Array.isArray(curatorsRes.data) ? curatorsRes.data : [];
      
      if (curatorsList.length === 0) {
        setCuratorError('В группе нет кураторов');
      } else {
        setCurators(curatorsList);
        setCuratorError('');
      }
    } catch (err: any) {
      setCuratorError(err.response?.data?.message || 'Ошибка загрузки кураторов');
      setCurators([]);
    } finally {
      setLoadingCurators(false);
    }
  };

  const handleSubmitClarificationRequest = async () => {
    if (!requestIdForClarification || !selectedCuratorId) {
      setCuratorError('Выберите куратора');
      return;
    }

    try {
      setCuratorError('');
      await transferRequestAPI.requestClarification(requestIdForClarification, selectedCuratorId);
      setShowCuratorSelection(false);
      setSelectedCuratorId(null);
      setRequestIdForClarification(null);
      setCurators([]);
      setCuratorError('');
      setLoadingCurators(false);
      await loadData();
    } catch (err: any) {
      setCuratorError(err.response?.data?.message || 'Ошибка запроса разъяснений');
    }
  };

  const handleAddGroups = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || selectedGroupIds.length === 0) {
      setError('Выберите хотя бы одну группу');
      return;
    }

    try {
      setError('');
      const dto: AddAvailableGroupsDTO = {
        requestId: selectedRequest.id,
        groupIds: selectedGroupIds
      };
      await transferRequestAPI.addAvailableGroups(dto);
      setShowAddGroupsForm(false);
      setSelectedGroupIds([]);
      setSelectedRequest(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка добавления групп');
    }
  };

  const handleChangeStatus = async (requestId: number, newStatus: TransferRequestStatus) => {
    try {
      setError('');
      await transferRequestAPI.changeStatus(newStatus, requestId);
      await loadData();
    } catch (err: any) {
      const errorMessage = err.response?.data?.errorMessage || err.response?.data?.message || 'Ошибка изменения статуса';
      setError(errorMessage);
    }
  };

  const getStatusLabel = (status: TransferRequestStatus): string => {
    const labels: Record<TransferRequestStatus, string> = {
      [TransferRequestStatus.NEW]: 'Новая',
      [TransferRequestStatus.UNDER_CONSIDERATION]: 'На рассмотрении',
      [TransferRequestStatus.WAITING_REASONS]: 'Ожидание разъяснений',
      [TransferRequestStatus.REASON_RECEIVED]: 'Разъяснения получены',
      [TransferRequestStatus.GROUP_SEARCH]: 'Поиск группы',
      [TransferRequestStatus.GROUP_FOUND]: 'Группы найдены',
      [TransferRequestStatus.TRANSFERRED]: 'Переведен',
      [TransferRequestStatus.REJECTED]: 'Отклонена'
    };
    return labels[status] || status;
  };

  const canAddGroups = (status: TransferRequestStatus): boolean => {
    return status === TransferRequestStatus.GROUP_SEARCH;
  };

  const canReject = (status: TransferRequestStatus): boolean => {
    return status === TransferRequestStatus.UNDER_CONSIDERATION ||
           status === TransferRequestStatus.WAITING_REASONS ||
           status === TransferRequestStatus.REASON_RECEIVED ||
           status === TransferRequestStatus.GROUP_SEARCH;
  };

  const handleRejectRequest = async (requestId: number) => {
    if (!window.confirm('Вы уверены, что хотите отклонить эту заявку?')) {
      return;
    }

    try {
      setError('');
      await transferRequestAPI.changeStatus(TransferRequestStatus.REJECTED, requestId);
      await loadData();
    } catch (err: any) {
      const errorMessage = err.response?.data?.errorMessage || err.response?.data?.message || 'Ошибка отклонения заявки';
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  const requests = Array.isArray(activeTab === 'unassigned' ? unassignedRequests : myRequests) 
    ? (activeTab === 'unassigned' ? unassignedRequests : myRequests)
    : [];

  return (
    <div>
      <Header />
      <div className={styles.container}>
        <h2>Заявки на перевод учеников</h2>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'unassigned' ? styles.active : ''}`}
            onClick={() => setActiveTab('unassigned')}
          >
            Неприсвоенные ({Array.isArray(unassignedRequests) ? unassignedRequests.length : 0})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'my' ? styles.active : ''}`}
            onClick={() => setActiveTab('my')}
          >
            Мои заявки ({Array.isArray(myRequests) ? myRequests.length : 0})
          </button>
        </div>

        <div className={styles.requestsList}>
          {!Array.isArray(requests) || requests.length === 0 ? (
            <p>Нет заявок</p>
          ) : (
            requests.map(request => (
              <div key={request.id} className={styles.requestCard}>
                <div className={styles.requestHeader}>
                  <h4>Заявка #{request.id}</h4>
                  <span className={`${styles.status} ${styles[`status${request.status}`]}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </div>

                <div className={styles.requestDetails}>
                  <p><strong>Ученик:</strong> {request.student.user.fullName}</p>
                  <p><strong>Группа:</strong> Группа #{request.sourceGroup.id}</p>
                  <p><strong>Причина:</strong> {request.reason}</p>
                  <p><strong>Дата создания:</strong> {new Date(request.creationTime).toLocaleString('ru-RU')}</p>
                  {request.manager && (
                    <p><strong>Менеджер:</strong> {request.manager.user.fullName}</p>
                  )}
                  {request.curator && (
                    <p><strong>Куратор:</strong> {request.curator.user.fullName}</p>
                  )}
                  {request.curatorsComment && (
                    <p><strong>Комментарий куратора:</strong> {request.curatorsComment}</p>
                  )}
                </div>

                <div className={styles.requestActions}>
                  {activeTab === 'unassigned' && request.status === TransferRequestStatus.NEW && (
                    <button
                      className={styles.button}
                      onClick={() => handleTakeRequest(request.id)}
                    >
                      Взять в работу
                    </button>
                  )}

                  {activeTab === 'my' && request.status === TransferRequestStatus.UNDER_CONSIDERATION && (
                    <button
                      className={styles.button}
                      onClick={() => handleRequestClarification(request.id)}
                    >
                      Запросить разъяснения у куратора
                    </button>
                  )}

                  {activeTab === 'my' && request.status === TransferRequestStatus.GROUP_SEARCH && (
                    <button
                      className={styles.button}
                      onClick={async () => {
                        setSelectedRequest(request);
                        setSelectedGroupIds([]);
                        setGroupsError('');
                        setShowAddGroupsForm(true);
                        // Load groups where student is not a member
                        try {
                          setLoadingGroups(true);
                          const groupsRes = await groupAPI.getGroupsWhereStudentNotMember(request.student.id);
                          const groups = Array.isArray(groupsRes.data) ? groupsRes.data : [];
                          setAvailableGroups(groups);
                          if (groups.length === 0) {
                            setGroupsError('Нет доступных групп для перевода');
                          } else {
                            setGroupsError('');
                          }
                        } catch (err: any) {
                          const errorMessage = err.response?.data?.errorMessage || err.response?.data?.message || 'Ошибка загрузки групп';
                          setGroupsError(errorMessage);
                          setAvailableGroups([]);
                        } finally {
                          setLoadingGroups(false);
                        }
                      }}
                    >
                      Добавить доступные группы
                    </button>
                  )}

                  {activeTab === 'my' && (request.status === TransferRequestStatus.REASON_RECEIVED || request.status === TransferRequestStatus.WAITING_REASONS) && (
                    <button
                      className={styles.button}
                      onClick={() => handleChangeStatus(request.id, TransferRequestStatus.GROUP_SEARCH)}
                    >
                      Начать поиск группы
                    </button>
                  )}

                  {activeTab === 'my' && request.status === TransferRequestStatus.GROUP_FOUND && (
                    <p className={styles.info}>Ожидание выбора группы учеником</p>
                  )}

                  {activeTab === 'my' && canReject(request.status) && (
                    <button
                      className={styles.buttonDanger}
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      Отклонить заявку
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {showAddGroupsForm && selectedRequest && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h3>Добавить доступные группы для заявки #{selectedRequest.id}</h3>
              {groupsError && <div className={styles.error}>{groupsError}</div>}
              <form onSubmit={handleAddGroups}>
                <div className={styles.formGroup}>
                  <label>Выберите группы:</label>
                  {loadingGroups ? (
                    <div className={styles.loading}>Загрузка групп...</div>
                  ) : !groupsError && availableGroups.length === 0 ? (
                    <p>Нет доступных групп</p>
                  ) : !groupsError ? (
                    <div className={styles.checkboxList}>
                      {availableGroups
                        .filter(g => g.id !== selectedRequest.sourceGroup.id)
                        .map(group => (
                        <label key={group.id} className={styles.checkboxItem}>
                          <input
                            type="checkbox"
                            value={group.id}
                            checked={selectedGroupIds.includes(group.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGroupIds([...selectedGroupIds, group.id]);
                              } else {
                                setSelectedGroupIds(selectedGroupIds.filter(id => id !== group.id));
                              }
                            }}
                          />
                          Группа #{group.id}
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className={styles.modalActions}>
                  <button type="submit" className={styles.button}>Добавить</button>
                  <button
                    type="button"
                    className={styles.buttonSecondary}
                    onClick={() => {
                      setShowAddGroupsForm(false);
                      setSelectedGroupIds([]);
                      setSelectedRequest(null);
                      setAvailableGroups([]);
                      setLoadingGroups(false);
                      setGroupsError('');
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCuratorSelection && requestIdForClarification && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h3>Выберите куратора для запроса разъяснений</h3>
              {loadingCurators ? (
                <div className={styles.loading}>Загрузка кураторов...</div>
              ) : (
                <>
                  {curatorError && (
                    <div className={styles.error}>{curatorError}</div>
                  )}
                  <div className={styles.formGroup}>
                    <label>Кураторы группы:</label>
                    {curators.length === 0 && !curatorError ? (
                      <p>Нет кураторов в группе</p>
                    ) : curators.length > 0 ? (
                      <div className={styles.radioList}>
                        {curators.map(curator => (
                          <label key={curator.id} className={styles.radioItem}>
                            <input
                              type="radio"
                              name="curator"
                              value={curator.id}
                              checked={selectedCuratorId === curator.id}
                              onChange={() => setSelectedCuratorId(curator.id)}
                            />
                            {curator.user?.fullName || `Куратор #${curator.id}`}
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.button}
                      onClick={handleSubmitClarificationRequest}
                      disabled={!selectedCuratorId || curators.length === 0 || !!curatorError}
                    >
                      Отправить запрос
                    </button>
                    <button
                      type="button"
                      className={styles.buttonSecondary}
                      onClick={() => {
                        setShowCuratorSelection(false);
                        setSelectedCuratorId(null);
                        setRequestIdForClarification(null);
                        setCurators([]);
                        setCuratorError('');
                        setLoadingCurators(false);
                      }}
                    >
                      Отмена
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerTransferRequest;

import React, { useState, useEffect } from 'react';
import { transferRequestAPI, groupAPI } from '../../services/api';
import { TransferRequest, TransferRequestStatus, Group, CreateTransferRequestDTO } from '../../types';
import Header from '../../components/header/Header';
import styles from './TransferRequest.module.scss';

const StudentTransferRequest: React.FC = () => {
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newRequest, setNewRequest] = useState<CreateTransferRequestDTO>({
    reason: '',
    sourceGroupId: 0
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsRes, groupsRes] = await Promise.all([
        transferRequestAPI.getMyRequests(),
        groupAPI.getMyStudentGroups()
      ]);
      setRequests(requestsRes.data);
      setGroups(groupsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.reason.trim() || !newRequest.sourceGroupId) {
      setError('Заполните все поля');
      return;
    }

    try {
      setError('');
      await transferRequestAPI.create(newRequest);
      setShowCreateForm(false);
      setNewRequest({ reason: '', sourceGroupId: 0 });
      await loadData();
    } catch (err: any) {
      const errorMessage = err.response?.data?.errorMessage || err.response?.data?.message || 'Ошибка создания заявки';
      setError(errorMessage);
    }
  };

  const handleWithdraw = async (requestId: number) => {
    if (!window.confirm('Вы уверены, что хотите отозвать заявку?')) {
      return;
    }

    try {
      setError('');
      await transferRequestAPI.withdraw(requestId);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка отзыва заявки');
    }
  };

  const handleSelectGroup = async (requestId: number, groupId: number) => {
    if (!window.confirm('Вы уверены, что хотите выбрать эту группу?')) {
      return;
    }

    try {
      setError('');
      await transferRequestAPI.selectGroup(requestId, { groupId });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка выбора группы');
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

  const canWithdraw = (status: TransferRequestStatus): boolean => {
    return status !== TransferRequestStatus.TRANSFERRED && 
           status !== TransferRequestStatus.REJECTED;
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className={styles.container}>
        <h2>Заявки на перевод в другую группу</h2>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button 
            className={styles.button}
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              if (showCreateForm) {
                setError('');
                setNewRequest({ reason: '', sourceGroupId: 0 });
              }
            }}
          >
            {showCreateForm ? 'Отмена' : 'Создать заявку'}
          </button>
        </div>

        {showCreateForm && (
          <div className={styles.form}>
            <h3>Создать заявку на перевод</h3>
            <form onSubmit={handleCreateRequest}>
              <div className={styles.formGroup}>
                <label>Группа, из которой хотите перевестись:</label>
                <select
                  value={newRequest.sourceGroupId}
                  onChange={(e) => setNewRequest({ ...newRequest, sourceGroupId: parseInt(e.target.value) })}
                  required
                >
                  <option value={0}>Выберите группу</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      Группа #{group.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Причина перевода:</label>
                <textarea
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  required
                  rows={4}
                  placeholder="Опишите причину перевода..."
                />
              </div>
              <button type="submit" className={styles.button}>Отправить заявку</button>
            </form>
          </div>
        )}

        <div className={styles.requestsList}>
          <h3>Мои заявки</h3>
          {requests.length === 0 ? (
            <p>У вас нет заявок на перевод</p>
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
                  <p><strong>Группа:</strong> Группа #{request.sourceGroup.id}</p>
                  <p><strong>Причина:</strong> {request.reason}</p>
                  <p><strong>Дата создания:</strong> {new Date(request.creationTime).toLocaleString('ru-RU')}</p>
                  {request.closingTime && (
                    <p><strong>Дата закрытия:</strong> {new Date(request.closingTime).toLocaleString('ru-RU')}</p>
                  )}
                </div>

                {request.status === TransferRequestStatus.GROUP_FOUND && request.availableGroups && (
                  <div className={styles.availableGroups}>
                    <h5>Доступные группы:</h5>
                    <div className={styles.groupsList}>
                      {request.availableGroups.map(ag => (
                        <div key={ag.id} className={styles.groupItem}>
                          <span>Группа #{ag.group.id}</span>
                          <button
                            className={styles.buttonSmall}
                            onClick={() => handleSelectGroup(request.id, ag.group.id)}
                          >
                            Выбрать
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {canWithdraw(request.status) && (
                  <div className={styles.requestActions}>
                    <button
                      className={styles.buttonDanger}
                      onClick={() => handleWithdraw(request.id)}
                    >
                      Отозвать заявку
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentTransferRequest;

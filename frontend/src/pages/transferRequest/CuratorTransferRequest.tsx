import React, { useState, useEffect } from 'react';
import { transferRequestAPI } from '../../services/api';
import { TransferRequest, TransferRequestStatus, CuratorCommentDTO } from '../../types';
import Header from '../../components/header/Header';
import styles from './TransferRequest.module.scss';

const CuratorTransferRequest: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<TransferRequest[]>([]);
  const [allRequests, setAllRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  const [comment, setComment] = useState<string>('');
  const [showCommentForm, setShowCommentForm] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pendingRes, allRes] = await Promise.all([
        transferRequestAPI.getCuratorPendingRequests(),
        transferRequestAPI.getMyCuratorRequests()
      ]);
      setPendingRequests(pendingRes.data);
      setAllRequests(allRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !comment.trim()) {
      setError('Введите комментарий');
      return;
    }

    try {
      setError('');
      const dto: CuratorCommentDTO = { comment };
      await transferRequestAPI.addCuratorComment(selectedRequest.id, dto);
      setShowCommentForm(false);
      setComment('');
      setSelectedRequest(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка добавления комментария');
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

  if (loading) {
    return (
      <div>
        <Header />
        <div className={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  const requests = activeTab === 'pending' ? pendingRequests : allRequests;

  return (
    <div>
      <Header />
      <div className={styles.container}>
        <h2>Заявки на разъяснение причин перевода</h2>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'pending' ? styles.active : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Требуют разъяснений ({pendingRequests.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Все заявки ({allRequests.length})
          </button>
        </div>

        <div className={styles.requestsList}>
          {requests.length === 0 ? (
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
                  <p><strong>Причина перевода:</strong> {request.reason}</p>
                  <p><strong>Дата создания:</strong> {new Date(request.creationTime).toLocaleString('ru-RU')}</p>
                  {request.manager && (
                    <p><strong>Менеджер:</strong> {request.manager.user.fullName}</p>
                  )}
                  {request.curatorsComment ? (
                    <div className={styles.commentSection}>
                      <p><strong>Мой комментарий:</strong></p>
                      <p className={styles.comment}>{request.curatorsComment}</p>
                    </div>
                  ) : (
                    <p className={styles.warning}>Комментарий не добавлен</p>
                  )}
                </div>

                {request.status === TransferRequestStatus.WAITING_REASONS && !request.curatorsComment && (
                  <div className={styles.requestActions}>
                    <button
                      className={styles.button}
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowCommentForm(true);
                      }}
                    >
                      Добавить разъяснение
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {showCommentForm && selectedRequest && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h3>Добавить разъяснение для заявки #{selectedRequest.id}</h3>
              <form onSubmit={handleAddComment}>
                <div className={styles.formGroup}>
                  <label>Разъяснение причин перевода:</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    rows={6}
                    placeholder="Опишите причины перевода ученика..."
                  />
                </div>
                <div className={styles.modalActions}>
                  <button type="submit" className={styles.button}>Отправить</button>
                  <button
                    type="button"
                    className={styles.buttonSecondary}
                    onClick={() => {
                      setShowCommentForm(false);
                      setComment('');
                      setSelectedRequest(null);
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CuratorTransferRequest;

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/header/Header';
import UsersTable from '../../components/userTable/UsersTable';
import { groupAPI, userAPI } from '../../services/api';
import { Group, GroupResponse, User, UserType, GroupUsers, UsersByType } from '../../types';
import styles from './GroupManagement.module.scss';
import '../App.css';

const getUserTypeName = (type: UserType | null): string => {
  const names: Record<string, string> = {
    STUDENT: 'ученика',
    CURATOR: 'куратора',
    MANAGER: 'менеджера',
  };
  return names[type || ''] || type || '';
};

const GroupManagement: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupDetails, setGroupDetails] = useState<GroupResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [scheduleStartTime, setScheduleStartTime] = useState<string>('');
  const [scheduleEndTime, setScheduleEndTime] = useState<string>('');
  const [groupUsers, setGroupUsers] = useState<GroupUsers>({ students: [], curators: [], managers: [] });
  const [users, setUsers] = useState<UsersByType>({ students: [], curators: [], managers: [] });
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [groupsRes, studentsRes, curatorsRes, managersRes] = await Promise.all([
        groupAPI.getMyGroups(),
        userAPI.getAllStudents().catch(() => ({ data: [] })),
        userAPI.getAllCurators().catch(() => ({ data: [] })),
        userAPI.getAllManagers().catch(() => ({ data: [] })),
      ]);
      setGroups(groupsRes.data);
      // Store users by type for modal dropdown (all users, not just from group)
      const allStudents = Array.isArray(studentsRes.data) ? studentsRes.data : [];
      const allCurators = Array.isArray(curatorsRes.data) ? curatorsRes.data : [];
      const allManagers = Array.isArray(managersRes.data) ? managersRes.data : [];
      setUsers({ students: allStudents, curators: allCurators, managers: allManagers });
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || 'Ошибка загрузки данных');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadGroupDetails = useCallback(async (groupId: number) => {
    try {
      const response = await groupAPI.getGroupDetails(groupId);
      setGroupDetails(response.data);
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || 'Ошибка загрузки деталей группы');
      console.error('Error loading group details:', err);
    }
  }, []);

  const loadGroupUsers = useCallback(async (groupId: number) => {
    try {
      const [studentsRes, curatorsRes, managersRes] = await Promise.all([
        groupAPI.getGroupUsersByRole(groupId, 'STUDENT').catch(() => ({ data: [] })),
        groupAPI.getGroupUsersByRole(groupId, 'CURATOR').catch(() => ({ data: [] })),
        groupAPI.getGroupUsersByRole(groupId, 'MANAGER').catch(() => ({ data: [] })),
      ]);
      setGroupUsers({
        students: Array.isArray(studentsRes.data) ? studentsRes.data : [],
        curators: Array.isArray(curatorsRes.data) ? curatorsRes.data : [],
        managers: Array.isArray(managersRes.data) ? managersRes.data : [],
      });
    } catch (err: any) {
      console.error('Error loading group users:', err);
      setGroupUsers({ students: [], curators: [], managers: [] });
    }
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupDetails(selectedGroup.id);
      loadGroupUsers(selectedGroup.id);
    }
  }, [selectedGroup, loadGroupDetails, loadGroupUsers]);

  const handleCreateGroup = useCallback(async () => {
    try {
      const response = await groupAPI.createGroup();
      await loadData();
      setSelectedGroup(response.data);
      alert('Группа успешно создана');
    } catch (err: any) {
      alert(err.response?.data?.errorMessage || 'Ошибка создания группы');
      console.error('Error creating group:', err);
    }
  }, [loadData]);

  const handleAddUser = useCallback(async () => {
    if (!selectedUserId || !selectedUserType || !selectedGroup) return;

    try {
      if (selectedUserType === 'STUDENT') {
        await groupAPI.addStudent(selectedGroup.id, parseInt(selectedUserId));
      } else if (selectedUserType === 'CURATOR') {
        await groupAPI.addCurator(selectedGroup.id, parseInt(selectedUserId));
      } else if (selectedUserType === 'MANAGER') {
        await groupAPI.addManager(selectedGroup.id, parseInt(selectedUserId));
      }
      await loadGroupDetails(selectedGroup.id);
      await loadGroupUsers(selectedGroup.id);
      setShowAddUserModal(false);
      setSelectedUserId('');
      setSelectedUserType(null);
      alert('Пользователь успешно добавлен');
    } catch (err: any) {
      alert(err.response?.data?.errorMessage || 'Ошибка добавления пользователя');
      console.error('Error adding user:', err);
    }
  }, [selectedUserId, selectedUserType, selectedGroup, loadGroupDetails, loadGroupUsers]);

  const handleRemoveUser = useCallback(async (userId: string, userType: UserType) => {
    if (!window.confirm(`Вы уверены, что хотите удалить этого ${getUserTypeName(userType)} из группы?`)) {
      return;
    }

    if (!selectedGroup) return;

    try {
      if (userType === 'STUDENT') {
        await groupAPI.removeStudent(selectedGroup.id, parseInt(userId));
      } else if (userType === 'CURATOR') {
        await groupAPI.removeCurator(selectedGroup.id, parseInt(userId));
      } else if (userType === 'MANAGER') {
        await groupAPI.removeManager(selectedGroup.id, parseInt(userId));
      }
      await loadGroupDetails(selectedGroup.id);
      await loadGroupUsers(selectedGroup.id);
      alert('Пользователь успешно удален');
    } catch (err: any) {
      alert(err.response?.data?.errorMessage || 'Ошибка удаления пользователя');
      console.error('Error removing user:', err);
    }
  }, [selectedGroup, loadGroupDetails, loadGroupUsers]);

  const handleCreateSchedule = useCallback(async () => {
    if (!scheduleStartTime || !scheduleEndTime || !selectedGroup) return;

    try {
      // Convert local datetime to ISO string for OffsetDateTime
      const startDateTime = new Date(scheduleStartTime).toISOString();
      const endDateTime = new Date(scheduleEndTime).toISOString();
      
      const scheduleData = {
        classStartTime: startDateTime,
        classEndTime: endDateTime,
      };
      await groupAPI.createSchedule(selectedGroup.id, scheduleData);
      await loadGroupDetails(selectedGroup.id);
      setShowScheduleModal(false);
      setScheduleStartTime('');
      setScheduleEndTime('');
      alert('Расписание успешно создано');
    } catch (err: any) {
      alert(err.response?.data?.errorMessage || 'Ошибка создания расписания');
      console.error('Error creating schedule:', err);
    }
  }, [scheduleStartTime, scheduleEndTime, selectedGroup, loadGroupDetails]);

  const handleStartGroup = useCallback(async () => {
    if (!window.confirm('Вы уверены, что хотите запустить эту группу?')) {
      return;
    }

    if (!selectedGroup) return;

    try {
      await groupAPI.startGroup(selectedGroup.id);
      await loadGroupDetails(selectedGroup.id);
      await loadData();
      alert('Группа успешно запущена');
    } catch (err: any) {
      alert(err.response?.data?.errorMessage || 'Ошибка запуска группы');
      console.error('Error starting group:', err);
    }
  }, [selectedGroup, loadGroupDetails, loadData]);


  const getUsersByType = useCallback((type: UserType | null): User[] => {
    if (!type) return [];
    switch (type) {
      case 'STUDENT':
        return users.students || [];
      case 'CURATOR':
        return users.curators || [];
      case 'MANAGER':
        return users.managers || [];
      default:
        return [];
    }
  }, [users]);

  const formatDate = useCallback((dateString: string | undefined): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const handleGroupSelect = useCallback((group: Group) => {
    setSelectedGroup(group);
  }, []);

  const handleOpenAddUserModal = useCallback((type: UserType) => {
    setSelectedUserType(type);
    setShowAddUserModal(true);
  }, []);

  const handleCloseAddUserModal = useCallback(() => {
    setShowAddUserModal(false);
    setSelectedUserId('');
    setSelectedUserType(null);
  }, []);

  const handleCloseScheduleModal = useCallback(() => {
    setShowScheduleModal(false);
    setScheduleStartTime('');
    setScheduleEndTime('');
  }, []);

  if (loading && groups.length === 0) {
    return (
      <div>
        <Header />
        <div className={`container ${styles.container}`}>
          <div>Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <h2>Управление группами</h2>
          <div>
            <button onClick={() => navigate('/manager')} className="btn" style={{ marginRight: '10px' }}>
              Назад
            </button>
            <button onClick={handleCreateGroup} className="btn btn-primary">
              Создать новую группу
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <div className={styles.contentGrid}>
          {/* Groups List */}
          <div className={styles.groupsList}>
            <h3 className={styles.sectionTitle}>Группы</h3>
            {groups.length === 0 ? (
              <p>Нет групп</p>
            ) : (
              <div>
                {groups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => handleGroupSelect(group)}
                    className={`${styles.groupItem} ${selectedGroup?.id === group.id ? styles.selected : ''}`}
                  >
                    <div><strong>Группа #{group.id}</strong></div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                      {group.startTime && new Date(group.startTime).getFullYear() < 2100 ? 'Запущена' : 'Не запущена'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group Details */}
          <div className={styles.groupDetails}>
            {selectedGroup ? (
              <>
                <h3 className={styles.sectionTitle}>Группа #{selectedGroup.id}</h3>
                {groupDetails && (
                  <>
                    <div className={`${styles.section} ${styles.groupInfo}`}>
                      <p><strong>Статус:</strong> {groupDetails.isStarted ? 'Запущена' : 'Не запущена'}</p>
                      {groupDetails.startTime && (
                        <p><strong>Время запуска:</strong> {formatDate(groupDetails.startTime)}</p>
                      )}
                      {!groupDetails.isStarted && (
                        <p><strong>Можно запустить:</strong> {groupDetails.canStart ? 'Да' : 'Нет'}</p>
                      )}
                    </div>

                    {/* Students */}
                    <div className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <h4>Ученики</h4>
                        {!groupDetails.isStarted && (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleOpenAddUserModal('STUDENT')}
                          >
                            Добавить ученика
                          </button>
                        )}
                      </div>
                      <UsersTable
                        users={groupUsers.students}
                        onRemove={(userId) => handleRemoveUser(userId.toString(), 'STUDENT')}
                        canRemove={!groupDetails.isStarted}
                        emptyMessage="Нет учеников. Используйте кнопку 'Добавить ученика' для добавления."
                      />
                    </div>

                    {/* Curators */}
                    <div className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <h4>Кураторы</h4>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleOpenAddUserModal('CURATOR')}
                        >
                          Добавить куратора
                        </button>
                      </div>
                      <UsersTable
                        users={groupUsers.curators}
                        onRemove={(userId) => handleRemoveUser(userId.toString(), 'CURATOR')}
                        canRemove={true}
                        emptyMessage="Нет кураторов. Используйте кнопку 'Добавить куратора' для добавления."
                      />
                    </div>

                    {/* Managers */}
                    <div className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <h4>Менеджеры</h4>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleOpenAddUserModal('MANAGER')}
                        >
                          Добавить менеджера
                        </button>
                      </div>
                      <UsersTable
                        users={groupUsers.managers}
                        onRemove={(userId) => handleRemoveUser(userId.toString(), 'MANAGER')}
                        canRemove={true}
                        emptyMessage="Нет менеджеров. Используйте кнопку 'Добавить менеджера' для добавления."
                      />
                    </div>

                    {/* Schedule */}
                    <div className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <h4>Расписание</h4>
                        {!groupDetails.isStarted && (
                          <button
                            className="btn btn-primary"
                            onClick={() => setShowScheduleModal(true)}
                          >
                            Создать расписание
                          </button>
                        )}
                      </div>
                      <div className={styles.schedulePlaceholder}>
                        <p className={styles.schedulePlaceholderText}>Информация о расписании будет отображаться здесь</p>
                      </div>
                    </div>

                    {/* Start Group Button */}
                    {!groupDetails.isStarted && groupDetails.canStart && (
                      <div>
                        <button
                          className={`btn btn-primary ${styles.startButton}`}
                          onClick={handleStartGroup}
                        >
                          Запустить группу
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <p className={styles.selectGroupMessage}>Выберите группу для просмотра деталей</p>
            )}
          </div>
        </div>

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h3>Добавить {getUserTypeName(selectedUserType)}</h3>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>
                  Выберите пользователя:
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className={styles.modalSelect}
                >
                  <option value="">-- Выберите пользователя --</option>
                  {getUsersByType(selectedUserType).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName || user.username} ({user.username})
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.modalActions}>
                <button
                  className="btn"
                  onClick={handleCloseAddUserModal}
                >
                  Отмена
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddUser}
                  disabled={!selectedUserId}
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h3>Создать расписание</h3>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>
                  Время начала:
                </label>
                <input
                  type="datetime-local"
                  value={scheduleStartTime}
                  onChange={(e) => setScheduleStartTime(e.target.value)}
                  className={styles.modalInput}
                />
              </div>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>
                  Время окончания:
                </label>
                <input
                  type="datetime-local"
                  value={scheduleEndTime}
                  onChange={(e) => setScheduleEndTime(e.target.value)}
                  className={styles.modalInput}
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  className="btn"
                  onClick={handleCloseScheduleModal}
                >
                  Отмена
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateSchedule}
                  disabled={!scheduleStartTime || !scheduleEndTime}
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupManagement;


import React, { useState, useEffect } from 'react';
import Header from '../../components/header/Header';
import EventLog from '../../components/eventLog/EventLog';
import { classAPI, taskAPI } from '../../services/api';
import { Class, Task } from '../../types';
import styles from './ClassManagement.module.scss';

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [showEventLog, setShowEventLog] = useState<boolean>(false);
  const [eventLogClassId, setEventLogClassId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (showEditModal && selectedClass) {
      loadAvailableTasks();
      loadClassDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEditModal, selectedClass?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await classAPI.getMyClasses();
      setClasses(res.data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClassDetails = async () => {
    if (!selectedClass) return;
    try {
      const res = await classAPI.getById(selectedClass.id);
      setSelectedClass(res.data);
    } catch (error) {
      console.error('Error loading class details:', error);
    }
  };

  const loadAvailableTasks = async () => {
    try {
      const res = await taskAPI.getAvailableForCurator();
      setAvailableTasks(res.data || []);
    } catch (error) {
      console.error('Error loading available tasks:', error);
    }
  };

  const handleOpenEditModal = (cls: Class) => {
    setSelectedClass(cls);
    setShowEditModal(true);
  };

  const handleAssignTask = async () => {
    if (!selectedClass || !selectedTaskId) {
      alert('Выберите задание');
      return;
    }
    try {
      await classAPI.assignTask(selectedClass.id, selectedTaskId);
      setSelectedTaskId(null);
      await loadClassDetails();
      alert('Задание успешно привязано к классу');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка при привязке задания');
    }
  };

  const handleRemoveTask = async (taskId: number) => {
    if (!selectedClass) return;
    if (!window.confirm('Вы уверены, что хотите отвязать это задание от класса?')) return;
    try {
      await classAPI.removeTask(selectedClass.id, taskId);
      await loadClassDetails();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка при отвязке задания');
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

  return (
    <div>
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Мои классы</h2>
        </div>

        {classes.length === 0 ? (
          <div className={styles.emptyState}>
            <p>У вас пока нет классов</p>
          </div>
        ) : (
          <div className={styles.classesList}>
            {classes.map((cls) => (
              <div key={cls.id} className={styles.classCard}>
                <div className={styles.classContent}>
                  <h3>Класс #{cls.id}</h3>
                  <div className={styles.classMeta}>
                    <p>
                      <strong>Дата:</strong>{' '}
                      {cls.classDate
                        ? new Date(cls.classDate).toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Не указана'}
                    </p>
                    <p>
                      <strong>Заданий привязано:</strong> {cls.tasks?.length || 0}
                    </p>
                  </div>
                  {cls.tasks && cls.tasks.length > 0 && (
                    <div className={styles.tasksPreview}>
                      <strong>Задания:</strong>
                      <ul>
                        {cls.tasks.slice(0, 3).map((task) => (
                          <li key={task.id}>
                            Задание #{task.id}: {task.condition.substring(0, 50)}
                            {task.condition.length > 50 ? '...' : ''}
                          </li>
                        ))}
                        {cls.tasks.length > 3 && (
                          <li>... и еще {cls.tasks.length - 3}</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                <div className={styles.classActions}>
                  <button
                    className={styles.editButton}
                    onClick={() => handleOpenEditModal(cls)}
                  >
                    Редактировать
                  </button>
                  <button
                    className={styles.viewLogButton}
                    onClick={() => {
                      setEventLogClassId(cls.id);
                      setShowEventLog(true);
                    }}
                  >
                    Посмотреть лог событий
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Class Modal */}
        {showEditModal && selectedClass && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h3>Редактирование класса #{selectedClass.id}</h3>
              <div className={styles.classInfo}>
                <p>
                  <strong>Дата:</strong>{' '}
                  {selectedClass.classDate
                    ? new Date(selectedClass.classDate).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Не указана'}
                </p>
              </div>

              <div className={styles.tasksSection}>
                <h4>Привязанные задания ({selectedClass.tasks?.length || 0}):</h4>
                {selectedClass.tasks && selectedClass.tasks.length > 0 ? (
                  <div className={styles.tasksList}>
                    {selectedClass.tasks.map((task) => (
                      <div key={task.id} className={styles.taskItem}>
                        <div className={styles.taskContent}>
                          <strong>Задание #{task.id}</strong>
                          <p>{task.condition}</p>
                        </div>
                        <button
                          className={styles.removeButton}
                          onClick={() => handleRemoveTask(task.id)}
                        >
                          Отвязать
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noTasks}>Нет привязанных заданий</p>
                )}

                <div className={styles.addTaskSection}>
                  <h4>Добавить задание:</h4>
                  <div className={styles.formGroup}>
                    <label>Выберите задание:</label>
                    <select
                      value={selectedTaskId || ''}
                      onChange={(e) => setSelectedTaskId(Number(e.target.value))}
                    >
                      <option value="">Выберите задание</option>
                      {availableTasks
                        .filter(
                          (task) =>
                            !selectedClass.tasks?.some((t) => t.id === task.id)
                        )
                        .map((task) => (
                          <option key={task.id} value={task.id}>
                            Задание #{task.id}: {task.condition.substring(0, 60)}
                            {task.condition.length > 60 ? '...' : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                  {selectedTaskId && (
                    <button
                      className={styles.assignButton}
                      onClick={handleAssignTask}
                    >
                      Привязать задание
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button onClick={() => {
                  setShowEditModal(false);
                  setSelectedClass(null);
                  setSelectedTaskId(null);
                }}>Закрыть</button>
              </div>
            </div>
          </div>
        )}

        {showEventLog && eventLogClassId && (
          <EventLog
            classId={eventLogClassId}
            onClose={() => {
              setShowEventLog(false);
              setEventLogClassId(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ClassManagement;


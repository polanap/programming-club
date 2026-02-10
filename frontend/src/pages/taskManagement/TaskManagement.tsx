import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/header/Header';
import { taskAPI, classAPI, groupAPI, testAPI } from '../../services/api';
import { Task, Class, Group, Test } from '../../types';
import { useAlert } from '../../hooks/useAlert';
import styles from './TaskManagement.module.scss';

const TaskManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my' | 'available'>('my');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [showTestsModal, setShowTestsModal] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTests, setTaskTests] = useState<Test[]>([]);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [showTestEditModal, setShowTestEditModal] = useState<boolean>(false);
  const [newTask, setNewTask] = useState({ condition: '', isOpen: true });
  const [newTest, setNewTest] = useState({ input: '', output: '' });
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadClasses(selectedGroup);
    }
  }, [selectedGroup]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [myTasksRes, availableTasksRes, groupsRes] = await Promise.all([
        taskAPI.getMyTasks(),
        taskAPI.getAvailableForCurator(),
        groupAPI.getMyCuratorGroups(),
      ]);
      const myTasksData = myTasksRes.data || [];
      const availableTasksData = availableTasksRes.data || [];
      setMyTasks(myTasksData);
      setAvailableTasks(availableTasksData);
      setGroups(groupsRes.data || []);
      setTasks(activeTab === 'my' ? myTasksData : availableTasksData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async (groupId: number) => {
    try {
      const res = await classAPI.getByGroup(groupId);
      setClasses(res.data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleCreateTask = async () => {
    try {
      await taskAPI.create(newTask);
      setShowCreateModal(false);
      setNewTask({ condition: '', isOpen: true });
      loadData();
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Ошибка при создании задания', 'error');
    }
  };

  const handleEditTask = async () => {
    if (!editingTask) return;
    try {
      await taskAPI.update(editingTask.id, {
        condition: editingTask.condition,
        isOpen: editingTask.isOpen,
      });
      setShowEditModal(false);
      setEditingTask(null);
      loadData();
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Ошибка при обновлении задания', 'error');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить это задание?')) return;
    try {
      await taskAPI.delete(taskId);
      loadData();
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Ошибка при удалении задания', 'error');
    }
  };

  const handleAssignTask = async (taskId: number) => {
    if (!selectedClass) {
      showAlert('Выберите класс', 'warning');
      return;
    }
    try {
      await classAPI.assignTask(selectedClass, taskId);
      setShowAssignModal(false);
      showAlert('Задание успешно привязано к классу', 'success');
      if (selectedGroup) {
        loadClasses(selectedGroup);
      }
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Ошибка при привязке задания', 'error');
    }
  };

  const handleRemoveTask = async (classId: number, taskId: number) => {
    if (!window.confirm('Вы уверены, что хотите отвязать это задание от класса?')) return;
    try {
      await classAPI.removeTask(classId, taskId);
      if (selectedGroup) {
        loadClasses(selectedGroup);
      }
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Ошибка при отвязке задания', 'error');
    }
  };

  const loadTests = async (taskId: number) => {
    try {
      const res = await testAPI.getByTask(taskId);
      setTaskTests(res.data || []);
    } catch (error) {
      console.error('Error loading tests:', error);
      setTaskTests([]);
    }
  };

  const handleOpenTestsModal = async (task: Task) => {
    setEditingTask(task);
    setShowTestsModal(true);
    await loadTests(task.id);
  };

  const handleCreateTest = async () => {
    if (!editingTask) return;
    try {
      await testAPI.create(editingTask.id, newTest);
      setNewTest({ input: '', output: '' });
      await loadTests(editingTask.id);
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Ошибка при создании теста', 'error');
    }
  };

  const handleEditTest = async () => {
    if (!editingTest || !editingTask) return;
    try {
      await testAPI.update(editingTest.id, {
        input: editingTest.input,
        output: editingTest.output,
      });
      setShowTestEditModal(false);
      setEditingTest(null);
      await loadTests(editingTask.id);
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Ошибка при обновлении теста', 'error');
    }
  };

  const handleDeleteTest = async (testId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот тест?')) return;
    if (!editingTask) return;
    try {
      await testAPI.delete(testId);
      await loadTests(editingTask.id);
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Ошибка при удалении теста', 'error');
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
      {AlertComponent}
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Управление заданиями</h2>
          <button className={styles.createButton} onClick={() => setShowCreateModal(true)}>
            + Создать задание
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'my' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('my');
              setTasks(myTasks);
            }}
          >
            Мои задания ({myTasks.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'available' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('available');
              setTasks(availableTasks);
            }}
          >
            Доступные задания ({availableTasks.length})
          </button>
        </div>

        <div className={styles.tasksList}>
          {tasks.map((task) => (
            <div key={task.id} className={styles.taskCard}>
              <div className={styles.taskContent}>
                <h3>Задание #{task.id}</h3>
                <p className={styles.taskCondition}>{task.condition}</p>
                <div className={styles.taskMeta}>
                  <span className={task.isOpen ? styles.open : styles.closed}>
                    {task.isOpen ? 'Открытое' : 'Закрытое'}
                  </span>
                  {task.author && (
                    <span>Автор: {task.author.fullName || task.author.username}</span>
                  )}
                </div>
              </div>
              <div className={styles.taskActions}>
                {myTasks.some(t => t.id === task.id) && (
                  <>
                    <button
                      className={styles.editButton}
                      onClick={() => {
                        setEditingTask(task);
                        setShowEditModal(true);
                      }}
                    >
                      Редактировать
                    </button>
                    <button
                      className={styles.testsButton}
                      onClick={() => handleOpenTestsModal(task)}
                    >
                      Тесты
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      Удалить
                    </button>
                  </>
                )}
                <button
                  className={styles.assignButton}
                  onClick={() => {
                    setShowAssignModal(true);
                    setEditingTask(task);
                  }}
                >
                  Привязать к классу
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Create Task Modal */}
        {showCreateModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h3>Создать задание</h3>
              <textarea
                className={styles.textarea}
                placeholder="Условие задания"
                value={newTask.condition}
                onChange={(e) => setNewTask({ ...newTask, condition: e.target.value })}
              />
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={newTask.isOpen}
                  onChange={(e) => setNewTask({ ...newTask, isOpen: e.target.checked })}
                />
                Открытое задание
              </label>
              <div className={styles.modalActions}>
                <button onClick={handleCreateTask}>Создать</button>
                <button onClick={() => setShowCreateModal(false)}>Отмена</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {showEditModal && editingTask && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h3>Редактировать задание</h3>
              <textarea
                className={styles.textarea}
                placeholder="Условие задания"
                value={editingTask.condition}
                onChange={(e) => setEditingTask({ ...editingTask, condition: e.target.value })}
              />
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={editingTask.isOpen}
                  onChange={(e) => setEditingTask({ ...editingTask, isOpen: e.target.checked })}
                />
                Открытое задание
              </label>
              <div className={styles.modalActions}>
                <button onClick={handleEditTask}>Сохранить</button>
                <button onClick={() => setShowEditModal(false)}>Отмена</button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Task Modal */}
        {showAssignModal && editingTask && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h3>Привязать задание к классу</h3>
              <div className={styles.formGroup}>
                <label>Группа:</label>
                <select
                  value={selectedGroup || ''}
                  onChange={(e) => {
                    setSelectedGroup(Number(e.target.value));
                    setSelectedClass(null);
                  }}
                >
                  <option value="">Выберите группу</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      Группа #{group.id}
                    </option>
                  ))}
                </select>
              </div>
              {selectedGroup && (
                <div className={styles.formGroup}>
                  <label>Класс:</label>
                  <select
                    value={selectedClass || ''}
                    onChange={(e) => setSelectedClass(Number(e.target.value))}
                  >
                    <option value="">Выберите класс</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        Класс #{cls.id} {cls.classDate && `(${new Date(cls.classDate).toLocaleDateString()})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {selectedClass && (
                <div className={styles.classTasks}>
                  <h4>Задания класса:</h4>
                  {classes.find(c => c.id === selectedClass)?.tasks?.map((task) => (
                    <div key={task.id} className={styles.classTaskItem}>
                      <span>Задание #{task.id}: {task.condition.substring(0, 50)}...</span>
                      <button
                        className={styles.removeButton}
                        onClick={() => handleRemoveTask(selectedClass, task.id)}
                      >
                        Отвязать
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.modalActions}>
                <button onClick={() => handleAssignTask(editingTask.id)}>Привязать</button>
                <button onClick={() => setShowAssignModal(false)}>Отмена</button>
              </div>
            </div>
          </div>
        )}

        {/* Tests Management Modal */}
        {showTestsModal && editingTask && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h3>Управление тестами для задания #{editingTask.id}</h3>
              <p className={styles.taskCondition}>{editingTask.condition}</p>
              
              <div className={styles.testsList}>
                <h4>Тесты ({taskTests.length}):</h4>
                {taskTests.length === 0 ? (
                  <p className={styles.noTests}>Нет тестов. Добавьте первый тест.</p>
                ) : (
                  taskTests.map((test) => (
                    <div key={test.id} className={styles.testItem}>
                      <div className={styles.testContent}>
                        <div className={styles.testRow}>
                          <strong>Вход:</strong>
                          <pre className={styles.testData}>{test.input}</pre>
                        </div>
                        <div className={styles.testRow}>
                          <strong>Выход:</strong>
                          <pre className={styles.testData}>{test.output}</pre>
                        </div>
                      </div>
                      <div className={styles.testActions}>
                        <button
                          className={styles.editButton}
                          onClick={() => {
                            setEditingTest(test);
                            setShowTestEditModal(true);
                          }}
                        >
                          Редактировать
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDeleteTest(test.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.addTestSection}>
                <h4>Добавить новый тест:</h4>
                <div className={styles.formGroup}>
                  <label>Входные данные:</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Входные данные теста"
                    value={newTest.input}
                    onChange={(e) => setNewTest({ ...newTest, input: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Ожидаемый результат:</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Ожидаемый результат"
                    value={newTest.output}
                    onChange={(e) => setNewTest({ ...newTest, output: e.target.value })}
                    rows={3}
                  />
                </div>
                <button className={styles.createButton} onClick={handleCreateTest}>
                  Добавить тест
                </button>
              </div>

              <div className={styles.modalActions}>
                <button onClick={() => {
                  setShowTestsModal(false);
                  setEditingTask(null);
                  setTaskTests([]);
                  setNewTest({ input: '', output: '' });
                }}>Закрыть</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Test Modal */}
        {showTestEditModal && editingTest && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h3>Редактировать тест</h3>
              <div className={styles.formGroup}>
                <label>Входные данные:</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Входные данные теста"
                  value={editingTest.input}
                  onChange={(e) => setEditingTest({ ...editingTest, input: e.target.value })}
                  rows={3}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Ожидаемый результат:</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Ожидаемый результат"
                  value={editingTest.output}
                  onChange={(e) => setEditingTest({ ...editingTest, output: e.target.value })}
                  rows={3}
                />
              </div>
              <div className={styles.modalActions}>
                <button onClick={handleEditTest}>Сохранить</button>
                <button onClick={() => {
                  setShowTestEditModal(false);
                  setEditingTest(null);
                }}>Отмена</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManagement;


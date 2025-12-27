import React from 'react';
import { User } from '../types';
import styles from './UsersTable.module.scss';

interface UsersTableProps {
  users: User[];
  onRemove: (userId: number) => void;
  canRemove: boolean;
  emptyMessage?: string;
}

const UsersTable: React.FC<UsersTableProps> = ({ 
  users, 
  onRemove, 
  canRemove, 
  emptyMessage = 'Нет пользователей' 
}) => {
  if (!users || users.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHead}>
            <th className={styles.tableHeader}>Имя</th>
            <th className={styles.tableHeader}>Логин</th>
            <th className={styles.tableHeader}>Email</th>
            {canRemove && (
              <th className={`${styles.tableHeader} ${styles.rightAlign}`}>Действия</th>
            )}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className={styles.tableRow}>
              <td className={styles.tableCell}>{user.fullName || '-'}</td>
              <td className={styles.tableCell}>{user.username || '-'}</td>
              <td className={styles.tableCell}>{user.email || '-'}</td>
              {canRemove && (
                <td className={`${styles.tableCell} ${styles.rightAlign}`}>
                  <button
                    className={`btn ${styles.removeButton}`}
                    onClick={() => onRemove(user.id)}
                  >
                    Удалить
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;


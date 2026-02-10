import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styles from './Breadcrumbs.module.scss';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname;
    const items: BreadcrumbItem[] = [];

    // Маппинг путей к читаемым названиям
    const pathMap: Record<string, string> = {
      '/login': 'Вход',
      '/register': 'Регистрация',
      '/manager': 'Панель менеджера',
      '/manager/activation': 'Активация менеджера',
      '/manager/groups': 'Управление группами',
      '/manager/transfer-requests': 'Запросы на перевод',
      '/curator': 'Панель куратора',
      '/curator/tasks': 'Управление заданиями',
      '/curator/classes': 'Мои классы',
      '/curator/transfer-requests': 'Запросы на перевод',
      '/curator/team-change-requests': 'Запросы на смену старосты',
      '/curator/groups': 'Группы',
      '/student': 'Панель студента',
      '/student/transfer-request': 'Запрос на перевод',
      '/student/groups': 'Мои группы',
      '/classroom': 'Занятие',
    };

    // Разбиваем путь на части
    const pathParts = path.split('/').filter(Boolean);
    
    // Всегда добавляем "Главная" (или можно пропустить для login/register)
    if (path !== '/login' && path !== '/register') {
      items.push({ label: 'Главная', path: getHomePath(pathParts[0]) });
    }

    // Обрабатываем каждый сегмент пути
    let currentPath = '';
    pathParts.forEach((part, index) => {
      currentPath += `/${part}`;
      
      // Если это динамический параметр (например, :classId, :groupId)
      if (part.match(/^\d+$/)) {
        const label = getDynamicLabel(pathParts[index - 1], part, params);
        items.push({ label, path: currentPath });
      } else {
        // Проверяем, есть ли название для этого пути
        const label = pathMap[currentPath] || formatPathPart(part);
        items.push({ label, path: currentPath });
      }
    });

    return items;
  };

  const getHomePath = (firstPart: string): string => {
    if (firstPart === 'manager') return '/manager';
    if (firstPart === 'curator') return '/curator';
    if (firstPart === 'student') return '/student';
    return '/';
  };

  const getDynamicLabel = (parent: string, param: string, params: any): string => {
    if (parent === 'groups' && param) {
      return `Группа #${param}`;
    }
    if (parent === 'classroom' && params.classId) {
      return `Занятие #${params.classId}`;
    }
    return `#${param}`;
  };

  const formatPathPart = (part: string): string => {
    // Преобразуем kebab-case в читаемый текст
    return part
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const breadcrumbs = getBreadcrumbs();

  // Не показываем breadcrumbs на страницах логина и регистрации
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      <ol className={styles.breadcrumbList}>
        {breadcrumbs.map((item, index) => (
          <li key={index} className={styles.breadcrumbItem}>
            {index < breadcrumbs.length - 1 ? (
              <>
                <button
                  className={styles.breadcrumbLink}
                  onClick={() => item.path && navigate(item.path)}
                >
                  {item.label}
                </button>
                <span className={styles.separator}>/</span>
              </>
            ) : (
              <span className={styles.breadcrumbCurrent}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;

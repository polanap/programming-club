# Programming Club Management System

Система управления секцией олимпиадной информатики.
Описание системы: https://docs.google.com/document/d/19NC9pJb6ndtpU9M08IyzR7YDqeNcxA_X0Ulh2pmBbKc/edit?usp=sharing

## Технологии

- **Backend**: Java 17, Spring Boot, PostgreSQL, Liquibase, Spring Security, WebSocket
- **Frontend**: React 18, React Router, Axios, STOMP.js

## Предварительные требования

1. **Java 17** или выше
2. **Node.js 16+** и npm
3. **PostgreSQL** (версия 12+)
4. **Gradle** (опционально, используется wrapper)

## Настройка базы данных

1. Создайте базу данных PostgreSQL:
```sql
CREATE DATABASE studs;
```

2. Создайте файл `.env` в корне проекта с настройками базы данных:
```properties
PG_USERNAME=your_username
PG_PASSWORD=your_password
JWT_SECRET=your-secret-key-should-be-at-least-256-bits-long-for-HS512-algorithm
```

Или установите переменные окружения:
```bash
export PG_USERNAME=your_username
export PG_PASSWORD=your_password
export JWT_SECRET=your-secret-key-should-be-at-least-256-bits-long-for-HS512-algorithm
```

3. Проверьте настройки подключения в `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:54321/studs
spring.datasource.username=${PG_USERNAME}
spring.datasource.password=${PG_PASSWORD}
```

Измените порт `54321` на порт вашего PostgreSQL (по умолчанию `5432`).

## Запуск Backend

### Вариант 1: Используя Gradle Wrapper

1. Откройте терминал в корне проекта

2. Убедитесь, что база данных запущена и доступна

3. Запустите приложение:
```bash
./gradlew bootRun
```

На Windows:
```bash
gradlew.bat bootRun
```

### Вариант 2: Используя IDE

1. Откройте проект в IntelliJ IDEA или Eclipse
2. Убедитесь, что Java 17 настроена в проекте
3. Найдите класс `ProgrammingClubApplication.java`
4. Запустите его как Spring Boot приложение

### Проверка работы Backend

После запуска backend будет доступен по адресу: `http://localhost:8181`

Проверить можно через:
- API документация: `http://localhost:8181/api/auth/register` (POST запрос)
- Или в браузере: `http://localhost:8181/api/roles` (должен вернуть список ролей)

## Запуск Frontend

1. Откройте терминал и перейдите в папку frontend:
```bash
cd frontend
```

2. Установите зависимости (первый раз):
```bash
npm install
```

3. Запустите frontend:
```bash
npm start
```

Frontend будет доступен по адресу: `http://localhost:3000`

Приложение автоматически откроется в браузере.

## Первый запуск системы

1. **Запустите Backend** (должен быть доступен на `http://localhost:8181`)

2. **Запустите Frontend** (должен быть доступен на `http://localhost:3000`)

3. **Зарегистрируйте первого менеджера**:
   - Откройте `http://localhost:3000/register`
   - Заполните форму регистрации с ролью "Менеджер"
   - Важно: аккаунт менеджера будет неактивен до подтверждения другим менеджером
   
4. **Для активации менеджера** (если нет других менеджеров):
   - Временно измените `is_active` на `true` в таблице `user` в БД для первого менеджера
   - Или используйте SQL:
   ```sql
   UPDATE "user" SET is_active = true WHERE username = 'your_manager_username';
   ```

5. **Войдите в систему**:
   - Откройте `http://localhost:3000/login`
   - Введите данные пользователя

## Структура проекта

```
programming-club/
├── src/main/java/com/itmo/programmingclub/
│   ├── config/          # Конфигурации (Security, WebSocket)
│   ├── controller/      # REST контроллеры
│   ├── entity/          # JPA сущности
│   ├── repository/      # JPA репозитории
│   ├── service/         # Бизнес-логика
│   ├── security/        # Spring Security компоненты
│   └── dto/             # Data Transfer Objects
├── src/main/resources/
│   ├── application.properties
│   └── db/changelog/    # Liquibase миграции
├── frontend/            # React приложение
│   ├── src/
│   │   ├── components/  # React компоненты
│   │   ├── pages/       # Страницы приложения
│   │   ├── services/    # API клиенты
│   │   └── context/     # React контексты
└── build.gradle.kts     # Gradle конфигурация
```

## API Endpoints

### Публичные endpoints:
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход в систему

### Защищенные endpoints (требуют JWT токен):
- `/api/users/**` - Управление пользователями
- `/api/groups/**` - Управление группами
- `/api/tasks/**` - Управление заданиями
- `/api/teams/**` - Управление командами
- `/api/classes/**` - Управление занятиями
- И другие...

### WebSocket:
- `ws://localhost:8181/ws` - WebSocket endpoint для совместного редактирования кода

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `PG_USERNAME` | Имя пользователя PostgreSQL | - |
| `PG_PASSWORD` | Пароль PostgreSQL | - |
| `JWT_SECRET` | Секретный ключ для JWT | (встроенный ключ) |
| `JWT_EXPIRATION` | Время жизни JWT токена (мс) | 86400000 (24 часа) |

## Разработка

### Запуск в режиме разработки

Backend автоматически перезагружается при изменениях (Spring Boot DevTools).

Frontend автоматически перезагружается при изменениях (React Hot Reload).

### Сборка для продакшена

**Backend:**
```bash
./gradlew build
```
JAR файл будет в `build/libs/`

**Frontend:**
```bash
cd frontend
npm run build
```
Оптимизированная сборка будет в `frontend/build/`

## Решение проблем

### Backend не запускается

1. Проверьте, что PostgreSQL запущен и доступен
2. Проверьте настройки подключения к БД
3. Проверьте, что порт 8181 свободен
4. Проверьте логи в консоли

### Frontend не подключается к Backend

1. Убедитесь, что Backend запущен на `http://localhost:8181`
2. Проверьте настройку proxy в `frontend/package.json`
3. Проверьте CORS настройки в `SecurityConfig.java`

### Проблемы с WebSocket

1. Убедитесь, что используете правильный URL: `ws://localhost:8181/ws`
2. Проверьте, что токен передается в заголовках WebSocket соединения
3. Проверьте логи backend для ошибок WebSocket

## Дополнительная информация

- API документация будет доступна после запуска приложения
- Для разработки рекомендуется использовать Postman для тестирования API
- Все миграции БД выполняются автоматически при запуске через Liquibase

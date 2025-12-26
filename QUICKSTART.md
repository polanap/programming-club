# Быстрый старт

## 1. Настройка базы данных

```bash
# Создайте базу данных
createdb studs

# Или через psql
psql -U postgres
CREATE DATABASE studs;
\q
```

## 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
PG_USERNAME=postgres
PG_PASSWORD=your_password
JWT_SECRET=my-secret-key-for-jwt-token-generation-at-least-256-bits
```

Или экспортируйте переменные:

```bash
export PG_USERNAME=postgres
export PG_PASSWORD=your_password
export JWT_SECRET=my-secret-key-for-jwt-token-generation-at-least-256-bits
```

## 3. Запуск Backend

В первом терминале:

```bash
./gradlew bootRun
```

Backend запустится на `http://localhost:8181`

## 4. Запуск Frontend

Во втором терминале:

```bash
cd frontend
npm install  # только первый раз
npm start
```

Frontend откроется на `http://localhost:3000`

## 5. Первый вход

1. Откройте `http://localhost:3000/register`
2. Зарегистрируйте пользователя с ролью "Менеджер"
3. Если это первый менеджер, активируйте его в БД:
   ```sql
   UPDATE "user" SET is_active = true WHERE username = 'your_username';
   ```
4. Войдите через `http://localhost:3000/login`

Готово! 🎉


-------------------- ФУНКЦИИ -----------------------

--- функция, определяющая event по class_id

CREATE OR REPLACE FUNCTION get_events_by_class(
    p_class_id INTEGER
) RETURNS TABLE (
    event_id INT,
    event_time TIMESTAMPTZ,
    event_type VARCHAR(50),
    team_id INT,
    user_role_id INT,
    submission_id INT,
    class_id INT,
    task_id INT
) AS $$
BEGIN
RETURN QUERY
SELECT
    e.id,
    e.time,
    e.type,
    e.team_id,
    e.user_role_id,
    e.submission_id,
    e.class_id,
    e.task_id
FROM app_event e
WHERE e.class_id = p_class_id;
END;
$$ LANGUAGE plpgsql;

--- функция, определяющая event по time

CREATE OR REPLACE FUNCTION get_events_in_time_range(
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
) RETURNS TABLE (
    event_id INT,
    event_time TIMESTAMPTZ,
    event_type VARCHAR(50),
    team_id INT,
    user_role_id INT,
    submission_id INT,
    class_id INT,
    task_id INT
) AS $$
BEGIN
RETURN QUERY
SELECT
    e.id,
    e.time,
    e.type,
    e.team_id,
    e.user_role_id,
    e.submission_id,
    e.class_id,
    e.task_id
FROM event e
WHERE e.time BETWEEN p_start_time AND p_end_time;
END;
$$ LANGUAGE plpgsql;



--- функция, определяющая event по class_id и time

CREATE OR REPLACE FUNCTION get_events_by_class_and_time(
    p_class_id INTEGER,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
) RETURNS TABLE (
    event_id INT,
    event_time TIMESTAMPTZ,
    event_type VARCHAR(50),
    team_id INT,
    user_role_id INT,
    submission_id INT,
    class_id INT,
    task_id INT
) AS $$
BEGIN
RETURN QUERY
SELECT
    e.id,
    e.time,
    e.type,
    e.team_id,
    e.user_role_id,
    e.submission_id,
    e.class_id,
    e.task_id
FROM event e
WHERE e.class_id = p_class_id
  AND e.time BETWEEN p_start_time AND p_end_time;
END;
$$ LANGUAGE plpgsql;


--- функция, определяющая, идет ли занятие

CREATE OR REPLACE FUNCTION is_class_in_session(class_id INT)
RETURNS BOOLEAN AS $$
DECLARE
inSession BOOLEAN DEFAULT FALSE;
BEGIN
SELECT
    CASE
        WHEN NOW() BETWEEN s.class_start_time AND s.class_end_time THEN TRUE
        ELSE FALSE
        END INTO inSession
FROM schedule s
         JOIN app_class c ON c.schedule_id = s.id
WHERE c.id = class_id;

RETURN inSession;
END;
$$ LANGUAGE plpgsql;

--- вспомогательная функция для проверки корректности расписания

CREATE OR REPLACE FUNCTION check_class_times()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.class_start_time >= NEW.class_end_time THEN
        RAISE EXCEPTION 'class_start_time должен быть меньше class_end_time';
END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;


--- регистраия пользователя

CREATE OR REPLACE FUNCTION register_user(
    p_username VARCHAR,
    p_full_name VARCHAR,
    p_email VARCHAR,
    p_password VARCHAR,
    p_role VARCHAR
) RETURNS VOID AS $$
DECLARE
v_role_id INT;
BEGIN
    -- Получаем ID роли
SELECT id INTO v_role_id FROM app_role WHERE role = p_role;

-- Вставляем нового пользователя
INSERT INTO app_user (username, full_name, email, password, is_active)
VALUES (p_username, p_full_name, p_email, p_password,
        CASE
            WHEN p_role IN ('STUDENT', 'CURATOR') THEN TRUE
            ELSE FALSE
            END);

-- Привязываем пользователя к роли
INSERT INTO user_role (role_id, user_id)
VALUES (v_role_id, currval(pg_get_serial_sequence('app_user', 'id')));
END;
$$ LANGUAGE plpgsql;


---------------------- ТРИГГЕРЫ --------------------------

--- проверка корректности расписания

CREATE OR REPLACE TRIGGER validate_class_times
BEFORE INSERT OR UPDATE ON Schedule
                               FOR EACH ROW
                               EXECUTE FUNCTION check_class_times();

--- проверка корректности события

CREATE OR REPLACE FUNCTION check_event_constraints()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'TEAM_RAISED_HAND' THEN
        IF NEW.team_id IS NULL OR NEW.class_id IS NULL THEN
            RAISE EXCEPTION 'team_id и class_id обязательны для TEAM_RAISED_HAND';
END IF;

    ELSIF NEW.type = 'TEAM_LOWERED_HAND' THEN
        IF NEW.team_id IS NULL OR NEW.class_id IS NULL THEN
            RAISE EXCEPTION 'team_id и class_id обязательны для TEAM_LOWERED_HAND';
END IF;

    ELSIF NEW.type = 'CURATOR_JOINED_TEAM' THEN
        IF NEW.team_id IS NULL OR NEW.user_role_id IS NULL OR NEW.class_id IS NULL THEN
            RAISE EXCEPTION 'team_id, user_role_id и class_id обязательны для CURATOR_JOINED_TEAM';
END IF;

    ELSIF NEW.type = 'CURATOR_LEFT_TEAM' THEN
        IF NEW.team_id IS NULL OR NEW.user_role_id IS NULL OR NEW.class_id IS NULL THEN
            RAISE EXCEPTION 'team_id, user_role_id и class_id обязательны для CURATOR_LEFT_TEAM';
END IF;

    ELSIF NEW.type = 'CURATOR_JOINED_CLASS' THEN
        IF NEW.user_role_id IS NULL OR NEW.class_id IS NULL THEN
            RAISE EXCEPTION 'user_role_id и class_id обязательны для CURATOR_JOINED_CLASS';
END IF;

    ELSIF NEW.type = 'CURATOR_LEFT_CLASS' THEN
        IF NEW.user_role_id IS NULL OR NEW.class_id IS NULL THEN
            RAISE EXCEPTION 'user_role_id и class_id обязательны для CURATOR_LEFT_CLASS';
END IF;

    ELSIF NEW.type = 'STUDENT_JOINED_CLASS' THEN
        IF NEW.user_role_id IS NULL OR NEW.class_id IS NULL THEN
            RAISE EXCEPTION 'user_role_id и class_id обязательны для STUDENT_JOINED_CLASS';
END IF;

    ELSIF NEW.type = 'STUDENT_LEFT_CLASS' THEN
        IF NEW.user_role_id IS NULL OR NEW.class_id IS NULL THEN
            RAISE EXCEPTION 'user_role_id и class_id обязательны для STUDENT_LEFT_CLASS';
END IF;

    ELSIF NEW.type = 'TEAM_SENT_SOLUTION' THEN
        IF NEW.team_id IS NULL OR NEW.submission_id IS NULL OR NEW.class_id IS NULL THEN
            RAISE EXCEPTION 'team_id, submission_id и class_id обязательны для TEAM_SENT_SOLUTION';
END IF;

    ELSIF NEW.type = 'RESULT_OF_SOLUTION' THEN
        IF NEW.team_id IS NULL OR NEW.submission_id IS NULL OR NEW.class_id IS NULL THEN
            RAISE EXCEPTION 'team_id, submission_id и class_id обязательны для RESULT_OF_SOLUTION';
END IF;

    ELSIF NEW.type = 'TEAM_BEGAN_TO_COMPLETE_TASK' THEN
        IF NEW.team_id IS NULL OR NEW.task_id IS NULL OR NEW.class_id IS NULL THEN
            RAISE EXCEPTION 'team_id, task_id и class_id обязательны для TEAM_BEGAN_TO_COMPLETE_TASK';
END IF;
END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER check_event_constraints
BEFORE INSERT OR UPDATE ON app_event
                               FOR EACH ROW EXECUTE FUNCTION check_event_constraints();



--- триггеры, запрещающие удалять сущности, связанные с идущим занятием

CREATE OR REPLACE FUNCTION prevent_delete_running_class()
RETURNS TRIGGER AS $$
BEGIN
    IF is_class_in_session(OLD.id) THEN
        RAISE EXCEPTION 'Невозможно удалить текущий класс, так как занятие идет!';
END IF;

RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER prevent_delete_running_class
BEFORE DELETE ON app_class
FOR EACH ROW EXECUTE FUNCTION prevent_delete_running_class();

CREATE OR REPLACE FUNCTION prevent_delete_running_group()
RETURNS TRIGGER AS $$
DECLARE
running_count INT;
BEGIN
SELECT COUNT(*) INTO running_count
FROM app_class
WHERE group_id = OLD.id AND is_class_in_session(id);

IF running_count > 0 THEN
        RAISE EXCEPTION 'Невозможно удалить группу, так как занятие группы идет!';
END IF;

RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER prevent_delete_running_group
BEFORE DELETE ON app_group
FOR EACH ROW EXECUTE FUNCTION prevent_delete_running_group();

CREATE OR REPLACE FUNCTION prevent_delete_running_team()
RETURNS TRIGGER AS $$
BEGIN
    IF is_class_in_session(OLD.class_id) THEN
        RAISE EXCEPTION 'Невозможно удалить команду, так как занятие идет!';
END IF;

RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER prevent_delete_running_team
BEFORE DELETE ON Team
FOR EACH ROW EXECUTE FUNCTION prevent_delete_running_team();

CREATE OR REPLACE FUNCTION prevent_delete_running_schedule()
RETURNS TRIGGER AS $$
DECLARE
running_count INT;
BEGIN
SELECT COUNT(*) INTO running_count
FROM app_class
WHERE schedule_id = OLD.id AND is_class_in_session(id);

IF running_count > 0 THEN
        RAISE EXCEPTION 'Невозможно удалить расписание, связанное с запущенным классом';
END IF;

RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER prevent_delete_running_schedule
BEFORE DELETE ON Schedule
FOR EACH ROW EXECUTE FUNCTION prevent_delete_running_schedule();


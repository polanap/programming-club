CREATE TABLE role
(
    id   SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL CHECK (role in ('STUDENT', 'CURATOR', 'MANAGER'))
);

CREATE TABLE "user"
(
    id                SERIAL PRIMARY KEY,
    registration_date TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active         BOOLEAN      NOT NULL,
    username          VARCHAR(50)  NOT NULL UNIQUE CHECK (LENGTH(username) > 0),
    full_name         VARCHAR(100) NOT NULL CHECK (LENGTH(full_name) > 0),
    password          VARCHAR(255) NOT NULL CHECK (LENGTH(password) > 0),
    email             VARCHAR(255) NOT NULL UNIQUE CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
)
    );

CREATE TABLE user_role
(
    id      SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES role (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES "user" (id) ON DELETE CASCADE
);

CREATE TABLE "group"
(
    id         SERIAL PRIMARY KEY,
    start_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_role_group
(
    user_role_id INTEGER NOT NULL REFERENCES user_role (id) ON DELETE CASCADE,
    group_id     INTEGER NOT NULL REFERENCES "group" (id) ON DELETE CASCADE,
    PRIMARY KEY (user_role_id, group_id)
);

CREATE TABLE schedule
(
    id               SERIAL PRIMARY KEY,
    class_start_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    class_end_time   TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '2 hour'),
    is_relevant      BOOLEAN     NOT NULL DEFAULT true,
    group_id         INTEGER     NOT NULL REFERENCES "group" (id) ON DELETE CASCADE
);

CREATE TABLE class
(
    id          SERIAL PRIMARY KEY,
    schedule_id INTEGER NOT NULL REFERENCES schedule (id) ON DELETE CASCADE
);


CREATE TABLE team
(
    id       SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES class (id) ON DELETE CASCADE,
    elder_id INTEGER NOT NULL REFERENCES "user" (id)
);

CREATE TABLE task
(
    id        SERIAL PRIMARY KEY,
    condition TEXT    NOT NULL CHECK (LENGTH(condition) > 0),
    author_id INTEGER NOT NULL REFERENCES "user" (id),
    is_open   BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE test
(
    id      SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES task (id),
    input   TEXT    NOT NULL,
    output  TEXT    NOT NULL
);

CREATE TABLE submission
(
    id      SERIAL PRIMARY KEY,
    complition_time INTERVAL NOT NULL,
    task_id INTEGER     NOT NULL REFERENCES task (id) ON DELETE CASCADE,
    status  VARCHAR(50) NOT NULL CHECK (status in ('OK', 'FAILED', 'IN_PROCESS')),
    team_id INTEGER     NOT NULL REFERENCES team (id) ON DELETE CASCADE
);

CREATE TABLE event
(
    id            SERIAL PRIMARY KEY,
    time          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type          VARCHAR(50) NOT NULL CHECK (type in ('TEAM_RAISED_HAND', 'TEAM_LOWERED_HAND', 'CURATOR_JOINED_TEAM',
                                                       'CURATOR_LEFT_TEAM', 'CURATOR_JOINED_CLASS',
                                                       'CURATOR_LEFT_CLASS', 'STUDENT_JOINED_CLASS',
                                                       'STUDENT_LEFT_CLASS', 'TEAM_SENT_SOLUTION', 'RESULT_OF_SOLUTION',
                                                       'TEAM_BEGAN_TO_COMPLETE_TASK')),
    team_id       INTEGER REFERENCES team (id) ON DELETE CASCADE,
    user_role_id  INTEGER REFERENCES user_role (id) ON DELETE CASCADE,
    submission_id INTEGER REFERENCES submission (id) ON DELETE CASCADE,
    class_id      INTEGER REFERENCES class (id) ON DELETE CASCADE,
    task_id       INTEGER REFERENCES task (id) ON DELETE CASCADE
);

CREATE TABLE user_team
(
    user_role_id INTEGER NOT NULL REFERENCES user_role (id) ON DELETE CASCADE,
    team_id      INTEGER NOT NULL REFERENCES team (id) ON DELETE CASCADE,
    PRIMARY KEY (user_role_id, team_id)
);

CREATE TABLE elder_change_request
(
    id            SERIAL PRIMARY KEY,
    student_id    INTEGER     NOT NULL REFERENCES user_role (id) ON DELETE CASCADE,
    new_elder_id  INTEGER     NOT NULL REFERENCES user_role (id) ON DELETE CASCADE,
    comment       TEXT,
    status        VARCHAR(50) NOT NULL CHECK (status in ('APPROVED', 'REJECTED', 'NEW')),
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closing_time  TIMESTAMPTZ

);

CREATE TABLE team_change_request
(
    id            SERIAL PRIMARY KEY,
    student_id    INTEGER     NOT NULL REFERENCES user_role (id) ON DELETE CASCADE,
    comment       TEXT,
    status        VARCHAR(50) NOT NULL CHECK (status in ('APPROVED', 'REJECTED', 'NEW')),
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closing_time  TIMESTAMPTZ

);

CREATE TABLE transfer_request
(
    id               SERIAL PRIMARY KEY,
    student_id       INTEGER     NOT NULL REFERENCES user_role (id) ON DELETE CASCADE,
    manager_id       INTEGER REFERENCES user_role (id),
    curator_id       INTEGER REFERENCES user_role (id),
    curators_comment TEXT,
    reason           TEXT        NOT NULL,
    status           VARCHAR(50) NOT NULL CHECK (status in ('APPROVED', 'REJECTED', 'NEW', 'UNDER_CONSIDERATION')),
    creation_time    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closing_time     TIMESTAMPTZ

);

CREATE TABLE avaliable_group
(
    id         SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES transfer_request (id) ON DELETE CASCADE,
    group_id   INTEGER NOT NULL REFERENCES "group" (id) ON DELETE CASCADE,
    approved   BOOL DEFAULT FALSE

);

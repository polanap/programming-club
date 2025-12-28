CREATE TABLE class_task (
    class_id INTEGER NOT NULL REFERENCES app_class(id) ON DELETE CASCADE,
    task_id INTEGER NOT NULL REFERENCES task(id) ON DELETE CASCADE,

    PRIMARY KEY (class_id, task_id)
);
ALTER TABLE team_change_request
    ADD COLUMN curator_id INTEGER REFERENCES user_role(id);
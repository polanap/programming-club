ALTER TABLE team_change_request
    ADD COLUMN from_team_id INTEGER REFERENCES team(id);

ALTER TABLE team_change_request
    ADD COLUMN to_team_id INTEGER REFERENCES team(id);
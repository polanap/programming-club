-- Add day_of_week column to schedule table
ALTER TABLE schedule
ADD COLUMN day_of_week VARCHAR(20) NOT NULL DEFAULT 'MONDAY'
CHECK (day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'));

-- Remove default after adding column
ALTER TABLE schedule
ALTER COLUMN day_of_week DROP DEFAULT;

-- Change class_start_time from TIMESTAMPTZ to TIME
ALTER TABLE schedule
ALTER COLUMN class_start_time TYPE TIME USING class_start_time::TIME;

-- Change class_end_time from TIMESTAMPTZ to TIME
ALTER TABLE schedule
ALTER COLUMN class_end_time TYPE TIME USING class_end_time::TIME;

-- Remove old default values (they are no longer valid for TIME type)
ALTER TABLE schedule
ALTER COLUMN class_start_time DROP DEFAULT;

ALTER TABLE schedule
ALTER COLUMN class_end_time DROP DEFAULT;


-- Add class_date column to app_class table to track specific date of class occurrence
ALTER TABLE app_class
ADD COLUMN class_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Remove default after adding column
ALTER TABLE app_class
ALTER COLUMN class_date DROP DEFAULT;

-- Add unique constraint to prevent duplicate classes for same schedule and date
ALTER TABLE app_class
ADD CONSTRAINT unique_schedule_date UNIQUE (schedule_id, class_date);


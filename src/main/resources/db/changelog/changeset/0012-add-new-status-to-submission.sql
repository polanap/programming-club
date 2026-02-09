-- Add 'NEW' status to submission table CHECK constraint
-- Drop the existing inline CHECK constraint (PostgreSQL auto-generates constraint names)
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find the constraint name for the status check
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'submission'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%in%';
    
    -- Drop the constraint if found
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE submission DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

-- Add new constraint with 'NEW' status included
ALTER TABLE submission
ADD CONSTRAINT submission_status_check 
CHECK (status IN ('NEW', 'OK', 'FAILED', 'IN_PROCESS'));

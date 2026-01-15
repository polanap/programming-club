-- Add source_group_id column to transfer_request table
-- Note: If there are existing records, they will need to be handled separately
-- For new feature, this field is required
ALTER TABLE transfer_request
ADD COLUMN source_group_id INTEGER REFERENCES app_group (id) ON DELETE CASCADE;

-- Update status check constraint to include all statuses from enum
ALTER TABLE transfer_request
DROP CONSTRAINT IF EXISTS transfer_request_status_check;

ALTER TABLE transfer_request
ADD CONSTRAINT transfer_request_status_check 
CHECK (status IN ('NEW', 'UNDER_CONSIDERATION', 'WAITING_REASONS', 'REASON_RECEIVED', 'GROUP_SEARCH', 'GROUP_FOUND', 'TRANSFERRED', 'REJECTED'));

-- Fix attendance status check constraint to include 'double'
ALTER TABLE personnel_attendance 
DROP CONSTRAINT IF EXISTS personnel_attendance_status_check;

ALTER TABLE personnel_attendance 
ADD CONSTRAINT personnel_attendance_status_check 
CHECK (status IN ('present', 'absent', 'leave', 'half-day', 'double'));

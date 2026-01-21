
-- Seed System Modules
INSERT INTO modules (key, name, description) VALUES
    ('website', 'Website Builder', 'Core CMS features for building pages and blogs.'),
    ('crm', 'CRM & People', 'Customer relationship management and user base.'),
    ('shop', 'Commerce Store', 'Sell physical and digital goods.'),
    ('booking', 'Booking System', 'Schedule appointments and reservations.')
ON CONFLICT (key) DO NOTHING;

-- Note: In a real production seed, we usually use ON CONFLICT DO NOTHING to avoid errors on re-runs.
-- But standard SQL insert is fine for initial setup.

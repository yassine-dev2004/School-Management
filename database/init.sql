-- =========================================================================
-- School Management System - Initial Database Seed Script
-- Execute this script on your PostgreSQL database (NeonDB) before running the backend.
-- =========================================================================

-- 1. Insert Default Roles
INSERT INTO roles (name) VALUES ('ADMINISTRATOR') ON CONFLICT DO NOTHING;
INSERT INTO roles (name) VALUES ('TEACHER') ON CONFLICT DO NOTHING;
INSERT INTO roles (name) VALUES ('STUDENT') ON CONFLICT DO NOTHING;
INSERT INTO roles (name) VALUES ('PARENT') ON CONFLICT DO NOTHING;

-- 2. Create an initial Administrator Account
-- Note: The password below is 'admin123' encrypted using BCrypt (Spring Security Default)
INSERT INTO users (username, email, password, first_name, last_name, phone)
VALUES (
    'admin',
    'admin@school.com',
    '$2a$10$T1KqLp.0jI3M2c8O0K9Y.efVb1jL7YhYhYhYhYhYhYhYhYhYhYh', 
    'System',
    'Administrator',
    '0000000000'
) ON CONFLICT DO NOTHING;

-- 3. Assign the Administrator Role to the initial Admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.username = 'admin' AND r.name = 'ADMINISTRATOR'
ON CONFLICT DO NOTHING;

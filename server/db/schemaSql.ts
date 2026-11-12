export const SCHEMA_SQL = `
-- CampusConnect PostgreSQL Schema
-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'super_admin')),
    is_verified BOOLEAN NOT NULL DEFAULT true,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(100) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    student_id VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(50),
    university VARCHAR(255) NOT NULL,
    college VARCHAR(255) NOT NULL,
    course VARCHAR(100) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    year INT NOT NULL DEFAULT 1,
    semester INT NOT NULL DEFAULT 1,
    skills TEXT[] DEFAULT '{}',
    bio TEXT,
    avatar_url TEXT,
    completion_pct INT DEFAULT 85,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    organization VARCHAR(255) NOT NULL DEFAULT 'CampusConnect Program',
    date DATE NOT NULL,
    time VARCHAR(50) NOT NULL,
    duration INT NOT NULL DEFAULT 45,
    type VARCHAR(50) NOT NULL DEFAULT 'Online',
    location VARCHAR(255) DEFAULT 'Online Video Room',
    meeting_link TEXT,
    interviewer VARCHAR(255) NOT NULL,
    instructions TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(50) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    meeting_link TEXT,
    max_participants INT NOT NULL DEFAULT 100,
    banner_url TEXT,
    organizer VARCHAR(255) NOT NULL,
    registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event Registrations Table
CREATE TABLE IF NOT EXISTS event_registrations (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id VARCHAR(100) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    student_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'Registered',
    UNIQUE(event_id, student_id)
);

-- Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    certificate_id VARCHAR(100) UNIQUE NOT NULL,
    student_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    certificate_name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL DEFAULT 'Participation',
    program VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    description TEXT,
    file_key VARCHAR(255),
    file_url TEXT NOT NULL,
    qr_code TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Valid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline DATE NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'General',
    priority VARCHAR(50) NOT NULL DEFAULT 'Normal',
    attachment_url TEXT,
    is_important BOOLEAN NOT NULL DEFAULT false,
    publish_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'system',
    is_read BOOLEAN NOT NULL DEFAULT false,
    link VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resources Table
CREATE TABLE IF NOT EXISTS resources (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size VARCHAR(50),
    is_downloadable BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    metadata JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Tokens Table (for verification & OTPs)
CREATE TABLE IF NOT EXISTS email_tokens (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'verification', 'password_reset', 'login_otp'
    used BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Safe migrations for newly added columns if table already exists
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS type VARCHAR(100) DEFAULT 'Participation';
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS description TEXT;
`

-- PostgreSQL initialization script for Student Planner
-- This script runs when the database is first created

-- Ensure the database exists (it should already be created by POSTGRES_DB)
\c student_planner;

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- You can add any additional initialization here
-- For example, creating schemas, setting permissions, etc.

-- Grant all privileges to the user (they should already have them, but just in case)
GRANT ALL PRIVILEGES ON DATABASE student_planner TO backlog_user; 
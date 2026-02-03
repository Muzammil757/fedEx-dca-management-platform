-- ============================================
-- DCA CASE MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (Admin & DCA Agent)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'dca')),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- 2. AUTH SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);

-- ============================================
-- 3. CUSTOMERS TABLE (Debtors)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    alternate_phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    credit_score INTEGER,
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- ============================================
-- 4. DCA AGENCIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dca_agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    agency_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'flagged', 'terminated')),
    specialization VARCHAR(50) CHECK (specialization IN ('commercial', 'consumer', 'both')),
    performance_target DECIMAL(5,2) DEFAULT 75.00,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    notes TEXT,
    joined_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dca_agencies_user ON dca_agencies(user_id);
CREATE INDEX IF NOT EXISTS idx_dca_agencies_status ON dca_agencies(status);

-- ============================================
-- 5. CASES TABLE (Core Business Entity)
-- ============================================
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    dca_agency_id UUID REFERENCES dca_agencies(id),
    
    -- Assignment tracking
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Financial details
    original_amount DECIMAL(15,2) NOT NULL,
    overdue_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    interest_rate DECIMAL(5,2),
    penalty_amount DECIMAL(15,2),
    
    -- Status & Priority
    status VARCHAR(30) NOT NULL DEFAULT 'unassigned' 
        CHECK (status IN ('unassigned', 'active', 'contacted', 'negotiating', 'payment_plan', 'escalated', 'legal', 'resolved', 'closed', 'written_off')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' 
        CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    
    -- Timing & SLA
    aging_days INTEGER DEFAULT 0,
    due_date DATE,
    sla_deadline TIMESTAMP WITH TIME ZONE,
    time_remaining INTEGER,
    sla_status VARCHAR(20) DEFAULT 'on-track' 
        CHECK (sla_status IN ('on-track', 'at-risk', 'breached')),
    
    -- Workflow
    stage VARCHAR(30) DEFAULT 'initial-contact'
        CHECK (stage IN ('initial-contact', 'follow-up', 'negotiation', 'payment-plan', 'legal-review', 'escalated')),
    is_escalated BOOLEAN DEFAULT FALSE,
    is_paused BOOLEAN DEFAULT FALSE,
    pause_reason TEXT,
    
    -- AI Insights (for future)
    ai_probability INTEGER CHECK (ai_probability >= 0 AND ai_probability <= 100),
    ai_next_action TEXT,
    ai_est_resolution VARCHAR(50),
    
    -- Contact tracking
    last_contact TIMESTAMP WITH TIME ZONE,
    next_follow_up TIMESTAMP WITH TIME ZONE,
    contact_attempts INTEGER DEFAULT 0,
    
    -- Meta
    notes TEXT,
    tags JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_dca ON cases(dca_agency_id);
CREATE INDEX IF NOT EXISTS idx_cases_customer ON cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_cases_sla ON cases(sla_status);
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);

-- ============================================
-- 6. DCA PERFORMANCE METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dca_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dca_agency_id UUID NOT NULL REFERENCES dca_agencies(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_cases INTEGER DEFAULT 0,
    active_cases INTEGER DEFAULT 0,
    recovered_cases INTEGER DEFAULT 0,
    recovery_rate DECIMAL(5,2) DEFAULT 0,
    sla_compliance DECIMAL(5,2) DEFAULT 0,
    avg_resolution_days INTEGER DEFAULT 0,
    total_recovered DECIMAL(15,2) DEFAULT 0,
    rank INTEGER,
    trend VARCHAR(10) CHECK (trend IN ('up', 'down', 'stable')),
    weekly_trend JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dca_metrics_agency ON dca_performance_metrics(dca_agency_id);
CREATE INDEX IF NOT EXISTS idx_dca_metrics_period ON dca_performance_metrics(period_start, period_end);

-- ============================================
-- 7. CASE NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS case_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    note_type VARCHAR(30) DEFAULT 'general' 
        CHECK (note_type IN ('general', 'contact', 'payment', 'escalation', 'legal', 'system')),
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_notes_case ON case_notes(case_id);
CREATE INDEX IF NOT EXISTS idx_case_notes_author ON case_notes(author_id);

-- ============================================
-- 8. ACTIVITY LOGS TABLE (Audit Trail)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    user_role VARCHAR(20),
    action VARCHAR(50) NOT NULL 
        CHECK (action IN ('create', 'update', 'delete', 'assign', 'unassign', 'login', 'logout', 'view', 'export', 'payment', 'status_change', 'escalate', 'pause', 'resume')),
    entity_type VARCHAR(50) NOT NULL 
        CHECK (entity_type IN ('customer', 'case', 'dca_agency', 'user', 'payment', 'note')),
    entity_id UUID,
    entity_name VARCHAR(255),
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- ============================================
-- 9. SLA ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sla_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('warning', 'breach', 'critical')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_by UUID REFERENCES users(id),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sla_alerts_case ON sla_alerts(case_id);
CREATE INDEX IF NOT EXISTS idx_sla_alerts_unread ON sla_alerts(is_read);

-- ============================================
-- 10. PAYMENT RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'bank_transfer', 'upi', 'cheque', 'card', 'other')),
    reference_number VARCHAR(100),
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_records_case ON payment_records(case_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_date ON payment_records(payment_date);

-- ============================================
-- 11. COMPLETED CASES ARCHIVE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS completed_cases_archive (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_case_id UUID,
    case_number VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    dca_agency_id UUID REFERENCES dca_agencies(id),
    dca_agency_name VARCHAR(255),
    resolution_type VARCHAR(30) CHECK (resolution_type IN ('full_payment', 'partial_settlement', 'written_off', 'disputed')),
    original_amount DECIMAL(15,2),
    recovered_amount DECIMAL(15,2),
    recovery_percentage DECIMAL(5,2),
    total_days INTEGER,
    closed_by UUID REFERENCES users(id),
    closed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SEED DATA: Create Initial Users
-- ============================================
-- Password: Admin@123 (hashed with bcrypt, rounds=12)
-- You should generate proper hashes in your application

-- Note: Run the seed script (npm run db:seed) after creating tables
-- Or manually insert with properly hashed passwords

-- ============================================
-- HELPFUL VIEWS
-- ============================================

-- Active Cases View
CREATE OR REPLACE VIEW v_active_cases AS
SELECT 
    c.id,
    c.case_number,
    c.status,
    c.priority,
    c.sla_status,
    c.overdue_amount,
    c.aging_days,
    cu.name AS customer_name,
    cu.phone AS customer_phone,
    cu.email AS customer_email,
    da.agency_name AS dca_name,
    da.status AS dca_status,
    c.created_at,
    c.updated_at
FROM cases c
LEFT JOIN customers cu ON c.customer_id = cu.id
LEFT JOIN dca_agencies da ON c.dca_agency_id = da.id
WHERE c.status NOT IN ('resolved', 'closed', 'written_off');

-- DCA Performance View
CREATE OR REPLACE VIEW v_dca_performance AS
SELECT 
    da.id,
    da.agency_name,
    da.status,
    da.specialization,
    COUNT(c.id) AS total_cases,
    COUNT(CASE WHEN c.status = 'active' THEN 1 END) AS active_cases,
    COUNT(CASE WHEN c.status = 'resolved' THEN 1 END) AS resolved_cases,
    COALESCE(SUM(c.paid_amount), 0) AS total_recovered,
    COALESCE(SUM(c.overdue_amount), 0) AS total_overdue
FROM dca_agencies da
LEFT JOIN cases c ON da.id = c.dca_agency_id
GROUP BY da.id, da.agency_name, da.status, da.specialization;

-- ============================================
-- ROW LEVEL SECURITY (Optional)
-- ============================================
-- Enable RLS on sensitive tables
-- ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies as needed based on your auth setup

COMMENT ON TABLE users IS 'Application users - Admin and DCA agents';
COMMENT ON TABLE customers IS 'Debtor/Customer information';
COMMENT ON TABLE cases IS 'Core debt collection cases';
COMMENT ON TABLE dca_agencies IS 'Debt Collection Agency profiles';
COMMENT ON TABLE activity_logs IS 'Audit trail for all system actions';

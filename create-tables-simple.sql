CREATE TABLE IF NOT EXISTS income (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), amount DECIMAL(10, 2) NOT NULL, description TEXT, category VARCHAR(100), date DATE NOT NULL, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS expenses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), amount DECIMAL(10, 2) NOT NULL, description TEXT, category VARCHAR(100) NOT NULL, date DATE NOT NULL, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS budget (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), category VARCHAR(100) NOT NULL UNIQUE, amount DECIMAL(10, 2) NOT NULL, period VARCHAR(20) DEFAULT 'monthly', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS projects (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(255) NOT NULL, description TEXT, status VARCHAR(50) DEFAULT 'ongoing', budget DECIMAL(10, 2), start_date DATE, end_date DATE, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS goals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(255) NOT NULL, description TEXT, target DECIMAL(10, 2) NOT NULL, current DECIMAL(10, 2) DEFAULT 0, deadline DATE, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date);
CREATE INDEX IF NOT EXISTS idx_income_category ON income(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);


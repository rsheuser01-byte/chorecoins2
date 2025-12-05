-- Neon Database Schema for ChoreCoins App
-- This file contains all the database tables and relationships

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    avatar TEXT,
    bio TEXT,
    favorite_color VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User stats table
CREATE TABLE user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    xp_to_next_level INTEGER NOT NULL DEFAULT 100,
    total_xp INTEGER NOT NULL DEFAULT 0,
    chore_streak INTEGER NOT NULL DEFAULT 0,
    learning_streak INTEGER NOT NULL DEFAULT 0,
    total_chores_completed INTEGER NOT NULL DEFAULT 0,
    total_lessons_completed INTEGER NOT NULL DEFAULT 0,
    total_money_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    last_active_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Achievements table
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL,
    category VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) NOT NULL DEFAULT 'bronze',
    reward_xp INTEGER NOT NULL DEFAULT 0,
    reward_coins INTEGER NOT NULL DEFAULT 0,
    reward_special VARCHAR(100),
    celebration_message TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Chores table
CREATE TABLE chores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reward DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    due_date DATE NOT NULL,
    recurring VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (recurring IN ('none', 'daily', 'weekly', 'monthly')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    emoji VARCHAR(10),
    difficulty VARCHAR(10) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investments table
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    shares DECIMAL(15,8) NOT NULL DEFAULT 0.00000000,
    purchase_price DECIMAL(15,8) NOT NULL DEFAULT 0.00000000,
    current_price DECIMAL(15,8) NOT NULL DEFAULT 0.00000000,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lesson progress table
CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id VARCHAR(100) NOT NULL,
    module_id VARCHAR(100) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('achievement', 'level', 'xp', 'streak', 'chore', 'investment')),
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coinbase connections table (encrypted storage)
CREATE TABLE coinbase_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_encrypted TEXT NOT NULL,
    api_secret_encrypted TEXT NOT NULL,
    passphrase_encrypted TEXT NOT NULL,
    sandbox BOOLEAN NOT NULL DEFAULT TRUE,
    connected BOOLEAN NOT NULL DEFAULT FALSE,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Market data cache table (for performance)
CREATE TABLE market_data_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    price DECIMAL(15,8) NOT NULL,
    volume DECIMAL(20,2),
    change_24h DECIMAL(10,4),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(symbol)
);

-- User sessions table (for authentication)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_active ON users(last_active);
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_chores_user_id ON chores(user_id);
CREATE INDEX idx_chores_due_date ON chores(due_date);
CREATE INDEX idx_chores_completed ON chores(completed);
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_symbol ON investments(symbol);
CREATE INDEX idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_coinbase_connections_user_id ON coinbase_connections(user_id);
CREATE INDEX idx_market_data_symbol ON market_data_cache(symbol);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chores_updated_at BEFORE UPDATE ON chores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON lesson_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coinbase_connections_updated_at BEFORE UPDATE ON coinbase_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW user_dashboard AS
SELECT 
    u.id,
    u.name,
    u.avatar,
    u.last_active,
    us.level,
    us.xp,
    us.total_money_earned,
    us.chore_streak,
    us.learning_streak,
    COUNT(DISTINCT a.id) as achievements_unlocked,
    COUNT(DISTINCT c.id) as total_chores,
    COUNT(DISTINCT CASE WHEN c.completed THEN c.id END) as completed_chores,
    COUNT(DISTINCT i.id) as total_investments,
    COUNT(DISTINCT lp.id) as lessons_completed
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
LEFT JOIN achievements a ON u.id = a.user_id
LEFT JOIN chores c ON u.id = c.user_id
LEFT JOIN investments i ON u.id = i.user_id
LEFT JOIN lesson_progress lp ON u.id = lp.user_id AND lp.completed = TRUE
GROUP BY u.id, u.name, u.avatar, u.last_active, us.level, us.xp, us.total_money_earned, us.chore_streak, us.learning_streak;

-- Sample data for development
INSERT INTO users (id, name, email) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Demo User', 'demo@chorecoins.com');

INSERT INTO user_stats (user_id, level, xp, total_xp, chore_streak, learning_streak, total_chores_completed, total_lessons_completed, total_money_earned) VALUES 
    ('00000000-0000-0000-0000-000000000001', 1, 0, 0, 0, 0, 0, 0, 0.00);

-- Sample chores
INSERT INTO chores (user_id, title, description, reward, due_date, category, emoji, difficulty) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Make Bed', 'Start your day right!', 3.00, CURRENT_DATE, '🏠 Home', '🛏️', 'easy'),
    ('00000000-0000-0000-0000-000000000001', 'Take Out Trash', 'Keep it clean!', 5.00, CURRENT_DATE, '🚗 Outside', '🗑️', 'easy'),
    ('00000000-0000-0000-0000-000000000001', 'Clean Room', 'Make it sparkle!', 8.00, CURRENT_DATE, '🏠 Home', '🧹', 'medium');

-- Sample achievements
INSERT INTO achievements (user_id, achievement_id, title, description, icon, category, rarity, reward_xp, reward_coins, celebration_message) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'first_chore', '🌟 First Steps', 'Complete your very first chore!', '🌟', 'chores', 'bronze', 25, 5, 'Welcome to the world of responsibility! 🌟'),
    ('00000000-0000-0000-0000-000000000001', 'chore_streak_3', '🔥 On Fire!', 'Complete chores for 3 days straight!', '🔥', 'chores', 'silver', 50, 15, 'You''re on fire! Keep it up! 🔥');

-- Bank accounts table (Plaid integration)
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plaid_account_id VARCHAR(255) NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('checking', 'savings')),
    bank_name VARCHAR(255) NOT NULL,
    last_four_digits VARCHAR(4) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, plaid_account_id)
);

-- Deposit schedules table
CREATE TABLE deposit_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_deposit_date DATE,
    next_deposit_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deposit transactions table
CREATE TABLE deposit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    plaid_transaction_id VARCHAR(255),
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for Plaid tables
CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX idx_deposit_schedules_user_id ON deposit_schedules(user_id);
CREATE INDEX idx_deposit_schedules_next_date ON deposit_schedules(next_deposit_date);
CREATE INDEX idx_deposit_transactions_user_id ON deposit_transactions(user_id);
CREATE INDEX idx_deposit_transactions_status ON deposit_transactions(status);

-- Triggers for Plaid tables
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deposit_schedules_updated_at BEFORE UPDATE ON deposit_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample market data
INSERT INTO market_data_cache (symbol, price, volume, change_24h) VALUES 
    ('BTC-USD', 45000.00, 1000000000.00, 2.5),
    ('ETH-USD', 3000.00, 500000000.00, 1.8),
    ('ADA-USD', 0.50, 100000000.00, -0.5);

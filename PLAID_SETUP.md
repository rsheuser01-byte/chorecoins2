# Plaid Bank Account Integration Setup Guide

This guide will help you set up Plaid bank account integration for ChoreCoins, allowing parents to connect their bank accounts and set up automatic weekly deposits for their children's completed chores.

## Prerequisites

1. **Plaid Account**: Sign up at [Plaid Dashboard](https://dashboard.plaid.com)
2. **Database**: Ensure your Neon database is set up and running
3. **Backend Server**: Make sure your Express.js backend is running

## Step 1: Get Plaid Credentials

1. Go to [Plaid Dashboard](https://dashboard.plaid.com)
2. Create a new application
3. Note down your:
   - **Client ID**
   - **Secret Key**
   - **Environment** (start with `sandbox` for testing)

## Step 2: Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Plaid Configuration
PLAID_CLIENT_ID=your_plaid_client_id_here
PLAID_SECRET=your_plaid_secret_here
PLAID_ENV=sandbox
ENCRYPTION_KEY=your-32-character-secret-key-here

# Database Configuration
DATABASE_URL=your_neon_database_url_here

# React App Configuration
REACT_APP_PLAID_API_URL=http://localhost:3001/api/plaid
REACT_APP_PLAID_API_KEY=your_api_key_here
```

**Important**: 
- Replace `your-32-character-secret-key-here` with a secure 32-character encryption key
- Use your actual Neon database URL
- The API key can be any secure string for basic authentication

## Step 3: Database Setup

Run the updated database schema to create the new tables:

```sql
-- The schema has been updated in database/schema.sql
-- Run these commands in your Neon database console:

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
```

## Step 4: Install Dependencies

The required dependencies have already been installed:

```bash
# Frontend dependencies
npm install plaid react-plaid-link --legacy-peer-deps

# Backend dependencies
cd backend
npm install plaid
cd ..
```

## Step 5: Start the Application

1. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend**:
   ```bash
   npm run dev
   ```

## Step 6: Test the Integration

1. **Navigate to Profile**: Go to the Profile page in your app
2. **Open Banking Tab**: Click on the "Banking" tab
3. **Connect Bank Account**: Click "Connect Bank Account"
4. **Use Plaid Sandbox**: In sandbox mode, you can use test credentials:
   - **Username**: `user_good`
   - **Password**: `pass_good`
   - **Bank**: Any available test bank

## Features Implemented

### ✅ Bank Account Connection
- Secure bank account linking via Plaid Link
- Encrypted storage of access tokens
- Support for multiple bank accounts
- Account type detection (checking/savings)

### ✅ Deposit Scheduling
- Weekly, bi-weekly, and monthly deposit schedules
- Customizable deposit amounts
- Automatic next deposit date calculation
- Schedule management (create, update, delete)

### ✅ Transaction Management
- Manual deposit processing
- Transaction history tracking
- Status monitoring (pending, completed, failed)
- Deposit descriptions and timestamps

### ✅ User Interface
- Clean, intuitive banking interface
- Responsive design for mobile and desktop
- Real-time status updates
- Error handling and user feedback

## Security Features

- **Encrypted Storage**: All sensitive data (access tokens) is encrypted
- **Secure API**: All endpoints require authentication
- **Data Validation**: Input validation on all forms
- **Error Handling**: Comprehensive error handling and logging

## Production Considerations

### Environment Setup
1. **Switch to Production**: Change `PLAID_ENV` from `sandbox` to `production`
2. **Update Credentials**: Use production Plaid credentials
3. **SSL Certificate**: Ensure HTTPS is enabled
4. **Database Security**: Use production database with proper security

### Compliance
1. **PCI DSS**: Ensure compliance with payment card industry standards
2. **Data Privacy**: Implement proper data privacy measures
3. **Audit Logging**: Enable comprehensive audit logging
4. **Backup Strategy**: Implement regular database backups

### Monitoring
1. **Error Tracking**: Set up error tracking (Sentry, etc.)
2. **Performance Monitoring**: Monitor API response times
3. **Transaction Monitoring**: Track failed transactions
4. **Security Monitoring**: Monitor for suspicious activity

## Troubleshooting

### Common Issues

1. **"Failed to create link token"**
   - Check Plaid credentials in environment variables
   - Verify Plaid environment (sandbox vs production)
   - Ensure backend server is running

2. **"Failed to exchange public token"**
   - Check database connection
   - Verify encryption key is set
   - Check Plaid account permissions

3. **"Bank account not found"**
   - Ensure user is properly authenticated
   - Check database for existing bank accounts
   - Verify user ID matches

### Debug Mode

Enable debug logging by adding to your `.env`:
```env
DEBUG=plaid:*
```

## Support

For issues related to:
- **Plaid Integration**: Check [Plaid Documentation](https://plaid.com/docs/)
- **Database Issues**: Check Neon database logs
- **Frontend Issues**: Check browser console for errors
- **Backend Issues**: Check server logs

## Next Steps

1. **Test thoroughly** in sandbox environment
2. **Set up production environment** when ready
3. **Implement additional features** like:
   - Automated deposit processing
   - Email notifications
   - Parent dashboard
   - Transaction analytics
   - Multi-currency support

## API Endpoints

The following endpoints have been added:

- `POST /api/plaid/link/token/create` - Create Plaid Link token
- `POST /api/plaid/item/public_token/exchange` - Exchange public token
- `GET /api/plaid/accounts/:userId` - Get user's bank accounts
- `POST /api/plaid/deposit-schedule` - Create deposit schedule
- `GET /api/plaid/deposit-schedule/:userId` - Get deposit schedules
- `POST /api/plaid/deposit` - Process manual deposit
- `GET /api/plaid/deposits/:userId` - Get deposit history

## File Structure

```
src/
├── components/
│   ├── PlaidLink.tsx          # Plaid Link component
│   └── DepositScheduleDialog.tsx # Deposit schedule dialog
├── hooks/
│   └── usePlaid.ts            # Plaid state management hook
├── services/
│   └── plaidService.ts        # Plaid API service
└── pages/
    └── Profile.tsx            # Updated with banking tab

backend/
└── server.js                  # Updated with Plaid endpoints

database/
└── schema.sql                 # Updated with Plaid tables
```

This integration provides a complete solution for connecting bank accounts and managing automatic deposits for chore rewards. The implementation follows security best practices and provides a user-friendly interface for both parents and children.

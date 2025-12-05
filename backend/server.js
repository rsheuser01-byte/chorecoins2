// Simple Express.js backend for Neon database integration
// This is a basic example - you can expand this based on your needs

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Plaid configuration
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

// Encryption key for sensitive data
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here';

function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText) {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// User endpoints
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, avatar, bio, favorite_color } = req.body;
    const result = await pool.query(
      'INSERT INTO users (name, email, avatar, bio, favorite_color) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, avatar, bio, favorite_color]
    );
    
    // Create user stats
    await pool.query(
      'INSERT INTO user_stats (user_id) VALUES ($1)',
      [result.rows[0].id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];
    
    const result = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User stats endpoints
app.get('/api/users/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM user_stats WHERE user_id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User stats not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/users/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];
    
    const result = await pool.query(
      `UPDATE user_stats SET ${setClause} WHERE user_id = $1 RETURNING *`,
      values
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chores endpoints
app.get('/api/users/:id/chores', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM chores WHERE user_id = $1 ORDER BY created_at DESC', [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/:id/chores', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, reward, due_date, recurring, priority, category, emoji, difficulty } = req.body;
    
    const result = await pool.query(
      'INSERT INTO chores (user_id, title, description, reward, due_date, recurring, priority, category, emoji, difficulty) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [id, title, description, reward, due_date, recurring, priority, category, emoji, difficulty]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/users/:id/chores/:choreId', async (req, res) => {
  try {
    const { id, choreId } = req.params;
    const updates = req.body;
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 3}`).join(', ');
    const values = [id, choreId, ...Object.values(updates)];
    
    const result = await pool.query(
      `UPDATE chores SET ${setClause} WHERE user_id = $1 AND id = $2 RETURNING *`,
      values
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id/chores/:choreId', async (req, res) => {
  try {
    const { id, choreId } = req.params;
    await pool.query('DELETE FROM chores WHERE user_id = $1 AND id = $2', [id, choreId]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Achievements endpoints
app.get('/api/users/:id/achievements', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM achievements WHERE user_id = $1 ORDER BY unlocked_at DESC', [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/:id/achievements', async (req, res) => {
  try {
    const { id } = req.params;
    const { achievement_id, title, description, icon, category, rarity, reward_xp, reward_coins, reward_special, celebration_message } = req.body;
    
    const result = await pool.query(
      'INSERT INTO achievements (user_id, achievement_id, title, description, icon, category, rarity, reward_xp, reward_coins, reward_special, celebration_message) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [id, achievement_id, title, description, icon, category, rarity, reward_xp, reward_coins, reward_special, celebration_message]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Investments endpoints
app.get('/api/users/:id/investments', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM investments WHERE user_id = $1 ORDER BY created_at DESC', [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/:id/investments', async (req, res) => {
  try {
    const { id } = req.params;
    const { symbol, name, shares, purchase_price, current_price, purchase_date } = req.body;
    
    const result = await pool.query(
      'INSERT INTO investments (user_id, symbol, name, shares, purchase_price, current_price, purchase_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, symbol, name, shares, purchase_price, current_price, purchase_date]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notifications endpoints
app.get('/api/users/:id/notifications', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit || 10;
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [id, limit]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/:id/notifications', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, message, read } = req.body;
    
    const result = await pool.query(
      'INSERT INTO notifications (user_id, type, message, read) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, type, message, read || false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Plaid endpoints
// Create Link Token
app.post('/api/plaid/link/token/create', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const request = {
      user: {
        client_user_id: userId,
      },
      client_name: 'ChoreCoins',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    };

    const response = await plaidClient.linkTokenCreate(request);
    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error('Error creating link token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Exchange Public Token
app.post('/api/plaid/item/public_token/exchange', async (req, res) => {
  try {
    const { public_token, userId } = req.body;
    
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: public_token,
    });

    const accessToken = response.data.access_token;
    
    // Get account information
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const account = accountsResponse.data.accounts[0];
    
    // Save bank account to database
    const result = await pool.query(
      `INSERT INTO bank_accounts (user_id, plaid_account_id, access_token_encrypted, account_name, account_type, bank_name, last_four_digits)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        userId,
        account.account_id,
        encrypt(accessToken),
        account.name,
        account.type,
        account.official_name || 'Unknown Bank',
        account.mask
      ]
    );

    res.json({ bankAccount: result.rows[0] });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's bank accounts
app.get('/api/plaid/accounts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM bank_accounts WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    res.json({ accounts: result.rows });
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create deposit schedule
app.post('/api/plaid/deposit-schedule', async (req, res) => {
  try {
    const { userId, bankAccountId, amount, frequency, dayOfWeek, dayOfMonth } = req.body;
    
    // Calculate next deposit date
    const nextDepositDate = calculateNextDepositDate(frequency, dayOfWeek, dayOfMonth);
    
    const result = await pool.query(
      `INSERT INTO deposit_schedules (user_id, bank_account_id, amount, frequency, day_of_week, day_of_month, next_deposit_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, bankAccountId, amount, frequency, dayOfWeek, dayOfMonth, nextDepositDate]
    );

    res.json({ schedule: result.rows[0] });
  } catch (error) {
    console.error('Error creating deposit schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get deposit schedules
app.get('/api/plaid/deposit-schedule/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM deposit_schedules WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({ schedules: result.rows });
  } catch (error) {
    console.error('Error fetching deposit schedules:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process manual deposit
app.post('/api/plaid/deposit', async (req, res) => {
  try {
    const { userId, bankAccountId, amount, description } = req.body;
    
    // Get bank account details
    const accountResult = await pool.query(
      'SELECT * FROM bank_accounts WHERE id = $1 AND user_id = $2',
      [bankAccountId, userId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    // Create transaction record
    const transactionResult = await pool.query(
      `INSERT INTO deposit_transactions (user_id, bank_account_id, amount, status, description)
       VALUES ($1, $2, $3, 'pending', $4) RETURNING *`,
      [userId, bankAccountId, amount, description]
    );

    // In a real implementation, you would use Plaid's payment initiation
    // For demo purposes, we'll simulate a successful deposit
    setTimeout(async () => {
      await pool.query(
        'UPDATE deposit_transactions SET status = $1, completed_at = NOW() WHERE id = $2',
        ['completed', transactionResult.rows[0].id]
      );
    }, 2000);

    res.json({ transaction: transactionResult.rows[0] });
  } catch (error) {
    console.error('Error processing deposit:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get deposit history
app.get('/api/plaid/deposits/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM deposit_transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({ deposits: result.rows });
  } catch (error) {
    console.error('Error fetching deposit history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate next deposit date
function calculateNextDepositDate(frequency, dayOfWeek, dayOfMonth) {
  const today = new Date();
  const nextDate = new Date(today);

  switch (frequency) {
    case 'weekly':
      const daysUntilNext = (dayOfWeek - today.getDay() + 7) % 7;
      nextDate.setDate(today.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext));
      break;
    case 'biweekly':
      nextDate.setDate(today.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(today.getMonth() + 1);
      nextDate.setDate(dayOfMonth);
      break;
  }

  return nextDate.toISOString().split('T')[0];
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;

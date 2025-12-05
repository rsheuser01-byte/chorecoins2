# Neon Database Integration for ChoreCoins

This directory contains the database schema and setup instructions for integrating Neon PostgreSQL with your ChoreCoins app.

## 🚀 Quick Start

### 1. Create a Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project
4. Copy your connection string

### 2. Set Up the Database
1. Run the schema.sql file in your Neon SQL editor
2. This will create all necessary tables and sample data

### 3. Configure Your App
1. Add your Neon connection string to your environment variables
2. Update the database service configuration
3. Start using cloud storage!

## 📊 Database Schema

### Core Tables

#### `users`
- Stores user profile information
- Includes name, email, avatar, bio, favorite color
- Tracks last active time

#### `user_stats`
- Stores gamification data
- Level, XP, streaks, completion counts
- Money earned tracking

#### `achievements`
- User achievement unlocks
- Rarity system (bronze, silver, gold, platinum, legendary)
- Reward tracking (XP, coins, special rewards)

#### `chores`
- Individual chore items
- Categories, difficulty levels, rewards
- Due dates and recurring patterns

#### `investments`
- Investment portfolio tracking
- Stock/crypto holdings
- Purchase prices and current values

#### `lesson_progress`
- Learning module completion
- Scores and progress tracking
- Module and lesson associations

#### `notifications`
- User notifications and alerts
- Achievement unlocks, level ups, etc.
- Read/unread status

#### `coinbase_connections`
- Encrypted Coinbase API credentials
- Connection status and sync tracking
- Sandbox vs live trading mode

### Additional Tables

#### `market_data_cache`
- Cached market prices for performance
- Real-time price updates
- Volume and change tracking

#### `user_sessions`
- Authentication session management
- Token-based authentication
- Session expiration tracking

## 🔧 Features

### Data Persistence
- ✅ User profiles and settings
- ✅ Gamification progress (XP, levels, streaks)
- ✅ Achievement unlocks and rewards
- ✅ Chore lists and completion status
- ✅ Investment portfolio tracking
- ✅ Lesson progress and scores
- ✅ Notification history
- ✅ Coinbase connection settings

### Sync Capabilities
- ✅ Cross-device synchronization
- ✅ Offline support with sync when online
- ✅ Real-time updates
- ✅ Conflict resolution
- ✅ Data backup and recovery

### Security
- ✅ Encrypted credential storage
- ✅ API key authentication
- ✅ Rate limiting
- ✅ SQL injection prevention
- ✅ CORS protection

## 🛠️ Setup Instructions

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file:
   ```env
   DATABASE_URL=your_neon_connection_string
   NODE_ENV=development
   PORT=3001
   ```

3. **Run the Server**
   ```bash
   npm run dev
   ```

### Frontend Integration

1. **Install Database Hook**
   ```typescript
   import { useDatabase } from '@/hooks/useDatabase';
   ```

2. **Initialize Database**
   ```typescript
   const { initialize, isConnected } = useDatabase();
   
   useEffect(() => {
     initialize({
       connectionString: 'your_neon_connection_string',
       apiKey: 'optional_api_key'
     });
   }, []);
   ```

3. **Use Database Operations**
   ```typescript
   const { 
     createUser, 
     updateUserStats, 
     createChore, 
     unlockAchievement 
   } = useDatabase();
   ```

## 📱 Usage Examples

### Creating a User
```typescript
const user = await createUser({
  name: 'John Doe',
  email: 'john@example.com',
  favorite_color: 'blue'
});
```

### Adding a Chore
```typescript
const chore = await createChore({
  title: 'Make Bed',
  description: 'Start your day right!',
  reward: 3.00,
  due_date: '2024-01-15',
  category: '🏠 Home',
  emoji: '🛏️',
  difficulty: 'easy'
});
```

### Unlocking an Achievement
```typescript
const achievement = await unlockAchievement({
  achievement_id: 'first_chore',
  title: '🌟 First Steps',
  description: 'Complete your very first chore!',
  icon: '🌟',
  category: 'chores',
  rarity: 'bronze',
  reward_xp: 25,
  reward_coins: 5,
  celebration_message: 'Welcome to the world of responsibility! 🌟'
});
```

## 🔒 Security Considerations

### Data Encryption
- All sensitive data is encrypted before storage
- API credentials are encrypted with AES-256
- Database connections use SSL/TLS

### Access Control
- User-based data isolation
- API key authentication
- Rate limiting to prevent abuse
- CORS protection

### Privacy
- No personal data collection
- Local credential storage
- User controls data sharing
- GDPR compliant

## 🚀 Deployment

### Neon Production Setup
1. Create a production branch in Neon
2. Update connection string for production
3. Set up monitoring and alerts
4. Configure backup schedules

### Backend Deployment
1. Deploy to Vercel, Netlify, or your preferred platform
2. Set environment variables
3. Configure domain and SSL
4. Set up monitoring

### Frontend Deployment
1. Update API endpoints for production
2. Configure environment variables
3. Deploy to your hosting platform
4. Test database connectivity

## 📈 Performance Optimization

### Database Indexing
- All foreign keys are indexed
- Common query patterns are optimized
- Composite indexes for complex queries

### Caching
- Market data caching for performance
- User session caching
- Query result caching

### Connection Pooling
- PostgreSQL connection pooling
- Automatic connection management
- Connection health monitoring

## 🔧 Troubleshooting

### Common Issues

#### Connection Failed
- Check your Neon connection string
- Verify database is running
- Check network connectivity

#### Sync Issues
- Check internet connection
- Verify API endpoints
- Check for pending changes

#### Performance Issues
- Monitor database performance
- Check query execution times
- Optimize slow queries

### Support
- Check Neon documentation
- Review error logs
- Contact support if needed

## 📚 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [React Hooks Documentation](https://reactjs.org/docs/hooks-intro.html)

## 🎯 Next Steps

1. **Set up your Neon database**
2. **Run the schema.sql file**
3. **Configure your backend**
4. **Integrate with your frontend**
5. **Test all functionality**
6. **Deploy to production**

Your ChoreCoins app now has enterprise-grade cloud storage and synchronization! 🎉

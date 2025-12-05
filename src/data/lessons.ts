export interface Lesson {
  id: number;
  title: string;
  content: string;
  visual?: {
    icon?: string;
    image?: string;
    emoji?: string;
    color?: string;
  };
  video?: string;
  interactive?: {
    type: 'visual-story' | 'money-types-showcase' | 'job-simulator' | 'treasure-map' | 'budget-builder' | 'growth-simulator' | 'bitcoin-explorer';
    elements: any[];
  };
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
  game?: {
    type: 'money-detective' | 'treasure-budget' | 'money-tree' | 'quiz' | 'interactive';
    component?: string;
  };
}

export interface Module {
  id: number;
  title: string;
  description: string;
  lessons: Lesson[];
  difficulty: string;
}

export const learningModules: Module[] = [
  {
    id: 1,
    title: 'Money Basics',
    description: 'Learn what money is and how it works',
    difficulty: 'Beginner',
    lessons: [
      {
        id: 1,
        title: 'Money Basics – The Money Detective Game',
        content: `🕵️‍♀️ **Welcome, Money Detective!** 

**The Mystery of Money:** 
Long ago, people traded weird things! 🐄 Cows, 🐚 shells, even 🧂 salt! But imagine trying to buy ice cream with a cow... that's silly! 

**The Magic Solution:** 
Money was invented! It's like a special key that everyone agrees works! 🔑

**Money's Super Powers:**
🔄 **Trading Power** - Everyone accepts it
💎 **Value Keeper** - Stays valuable over time  
📊 **Measuring Tool** - Helps compare prices

**Your Detective Mission:** 
Play the Money Detective Game! Sort items into "Money" or "Not Money" by asking:
🤔 Do people trade with it?
🤔 Does it keep its value?
🤔 Can you count it easily?

**Ready to solve the mystery?** 🕵️‍♀️✨`,
        visual: {
          emoji: '🕵️‍♀️',
          color: 'money-green'
        },
        interactive: {
          type: 'visual-story',
          elements: [
            { type: 'character', emoji: '🕵️‍♀️', name: 'Detective', position: 'left' },
            { type: 'item', emoji: '🐄', name: 'Cow', position: 'center', animation: 'bounce' },
            { type: 'item', emoji: '🍦', name: 'Ice Cream', position: 'right', animation: 'shake' },
            { type: 'arrow', from: 'cow', to: 'ice-cream', color: 'red', text: 'Too hard!' },
            { type: 'item', emoji: '💰', name: 'Money', position: 'center', animation: 'sparkle' },
            { type: 'arrow', from: 'money', to: 'ice-cream', color: 'green', text: 'Easy!' }
          ]
        },
        game: {
          type: 'money-detective',
          component: 'MoneyDetectiveGame'
        },
        quiz: {
          question: 'What are the three super powers of money?',
          options: [
            'Buy, sell, trade',
            'Trading power, value keeper, measuring tool',
            'Coins, bills, digital',
            'Save, spend, invest'
          ],
          correctAnswer: 1
        }
      },
      {
        id: 2,
        title: 'Different Types of Money',
        content: `🌍 **Money Around the World Adventure!** 

**Physical Money (Touch & Feel!):**
🪙 **Coins & Bills** - Real money you can hold!
🇺🇸 Dollars • 🇪🇺 Euros • 🇯🇵 Yen
Each country has special designs! ✨

**Digital Money (Computer Magic!):**
📱 **Phone Money** - Tap to pay!
💳 **Credit Cards** - Swipe and go!
🏦 **Bank Numbers** - Your savings live here!

**Future Money (Super Cool!):**
₿ **Bitcoin** - Digital treasure!
🔐 **Cryptocurrency** - Secret code money!
🚀 **The Future** - Money that lives in computers!

**The Magic:** All money types help people trade! 🪄`,
        visual: {
          emoji: '🌍',
          color: 'blue-500'
        },
        interactive: {
          type: 'money-types-showcase',
          elements: [
            { type: 'money-type', emoji: '🪙', name: 'Physical', description: 'Touch & Feel', color: 'gold' },
            { type: 'money-type', emoji: '📱', name: 'Digital', description: 'Phone & Cards', color: 'blue' },
            { type: 'money-type', emoji: '₿', name: 'Bitcoin', description: 'Digital Treasure', color: 'orange' }
          ]
        },
        quiz: {
          question: 'Which is NOT a real type of money?',
          options: [
            'Coins and bills',
            'Digital money on phones',
            'Rocks and sticks',
            'Money in bank accounts'
          ],
          correctAnswer: 2
        }
      },
      {
        id: 3,
        title: 'Earning Money',
        content: `🦸‍♀️ **Become a Money-Earning Superhero!** 

**Adult Superheroes:**
👩‍🏫 **Teachers** - Help kids learn! 
👨‍⚕️ **Doctors** - Make people feel better!
🏪 **Store Workers** - Help customers find things!
🍪 **Business Owners** - Sell yummy treats!

**Kid Superpowers:**
🧹 **Room Cleaning** = 💰 Money!
📚 **Great Grades** = 💰 Money!
🌱 **Helping Neighbors** = 💰 Money!
🎨 **Selling Art** = 💰 Money!

**The Super Formula:**
🦸‍♀️ **Help People** + 💪 **Work Hard** = 💰 **More Money!**

**Super Tip:** The more you help others, the more you can earn! 
Be a problem-solving champion! 🏆✨`,
        visual: {
          emoji: '🦸‍♀️',
          color: 'purple-500'
        },
        interactive: {
          type: 'job-simulator',
          elements: [
            { type: 'job', emoji: '👩‍🏫', name: 'Teacher', reward: 50, description: 'Help kids learn' },
            { type: 'job', emoji: '👨‍⚕️', name: 'Doctor', reward: 100, description: 'Make people better' },
            { type: 'job', emoji: '🧹', name: 'Room Cleaner', reward: 10, description: 'Keep things tidy' },
            { type: 'job', emoji: '🎨', name: 'Artist', reward: 25, description: 'Create beautiful things' }
          ]
        },
        quiz: {
          question: 'How do most people earn money?',
          options: [
            'By finding it on the ground',
            'By working and helping others',
            'By asking their parents',
            'By trading toys'
          ],
          correctAnswer: 1
        }
      }
    ]
  },
  {
    id: 2,
    title: 'Saving & Budgeting',
    description: 'How to save money and create a budget',
    difficulty: 'Beginner',
    lessons: [
      {
        id: 4,
        title: 'Saving & Budgeting – Treasure Island Budget Game',
        content: `🏝️ **Ahoy, Captain! Welcome to Treasure Island!** 

**Your Treasure Adventure:**
💰 Your money = Treasure chests!
⛵ You = Captain of your treasure ship!
🏝️ Three islands = Three treasure destinations!

**The Captain's Challenge:**
If you only visit the Spending Island, you'll have fun now but no treasure for storms! ⛈️
If you balance your treasure wisely, you'll always be prepared! ⚓

**Your Treasure Map:**
🍞 **Needs Island** (50%) - Food, clothes, home - Must-haves to survive!
🎮 **Wants Island** (30%) - Toys, games, fun - Life's sweet treats!  
💎 **Savings Island** (20%) - Future dreams, emergencies - Treasure for later!

**Captain's Mission:** 
Divide 100 gold coins among three treasure chests!
Balance your treasure wisely and sail to success! ⛵✨`,
        visual: {
          emoji: '🏝️',
          color: 'blue-500'
        },
        interactive: {
          type: 'treasure-map',
          elements: [
            { type: 'island', emoji: '🍞', name: 'Needs Island', percentage: 50, color: 'green', description: 'Must-haves!' },
            { type: 'island', emoji: '🎮', name: 'Wants Island', percentage: 30, color: 'blue', description: 'Fun stuff!' },
            { type: 'island', emoji: '💎', name: 'Savings Island', percentage: 20, color: 'purple', description: 'Future treasure!' }
          ]
        },
        game: {
          type: 'treasure-budget',
          component: 'TreasureIslandBudgetGame'
        },
        quiz: {
          question: 'What is the captain\'s treasure rule?',
          options: [
            'Spend everything on wants',
            '50% needs, 30% wants, 20% savings',
            '100% savings, 0% everything else',
            'Give it all away'
          ],
          correctAnswer: 1
        }
      },
      {
        id: 5,
        title: 'Creating Your First Budget',
        content: `🗺️ **Build Your Money Map!** 

**The Money Pie Recipe:**
🥧 **Perfect Money Pie:**
🍽️ 50% NEEDS (lunch, supplies) - Must-haves!
🎮 30% WANTS (toys, games) - Fun stuff!  
💰 20% SAVINGS (future you!) - Treasure for later!

**Budget Building Steps:**
1. 💵 **Count** your money income
2. 📋 **List** your NEEDS  
3. 🎯 **List** your WANTS
4. 💰 **Pick** savings amount
5. ➕ **Check** it adds up!

**Example with $10:**
$5 = 🍽️ Needs (50%)
$3 = 🎮 Wants (30%)  
$2 = 💰 Savings (20%)

**Captain's Tips:**
✏️ Write it down
📅 Check weekly
🔄 Adjust when needed
🌟 Always save something!`,
        visual: {
          emoji: '🗺️',
          color: 'orange-500'
        },
        interactive: {
          type: 'budget-builder',
          elements: [
            { type: 'budget-category', emoji: '🍽️', name: 'Needs', percentage: 50, color: 'green', examples: ['Lunch', 'Supplies', 'Clothes'] },
            { type: 'budget-category', emoji: '🎮', name: 'Wants', percentage: 30, color: 'blue', examples: ['Toys', 'Games', 'Treats'] },
            { type: 'budget-category', emoji: '💰', name: 'Savings', percentage: 20, color: 'purple', examples: ['Future', 'Emergency', 'Bitcoin'] }
          ]
        },
        quiz: {
          question: 'How much should you save in your budget?',
          options: [
            '10% of your money',
            '20% of your money',
            '50% of your money',
            '0% - spend it all!'
          ],
          correctAnswer: 1
        }
      }
    ]
  },
  {
    id: 3,
    title: 'Introduction to Investing',
    description: 'Basic concepts of investing and compound interest',
    difficulty: 'Intermediate',
    lessons: [
      {
        id: 6,
        title: 'Investing – Money Tree Grower',
        content: `🌱 **Welcome, Money Gardener!** 

**The Garden of Money:**
💰 **Savings Jar** = Safe but slow (like a tiny plant)
🌳 **Investment Tree** = Faster growth (like a big tree!)
🍎 **Fruit** = Interest and profit!

**The Magic of Compound Interest:**
🌱 **Year 1:** Plant $10 → Get $1 fruit
🌿 **Year 2:** Plant $11 → Get $1.10 fruit  
🌳 **Year 3:** Plant $12.10 → Get $1.21 fruit
🌲 **Year 10:** Your tree is HUGE! 🎉

**Your Gardening Mission:** 
Plant your $10 money seed and watch it grow!

🏦 **Savings Account** - Safe but slow (2% per year)
📈 **Investment Tree** - Faster growth (~7% per year) with surprises!
🎲 **Market Events** - Sunny days, storms, and Bitcoin boosts!

**Gardener's Secret:** Time + Patience = Money Forest! 🌲✨`,
        visual: {
          emoji: '🌱',
          color: 'green-500'
        },
        interactive: {
          type: 'growth-simulator',
          elements: [
            { type: 'growth-type', emoji: '🏦', name: 'Savings', rate: 2, color: 'blue', description: 'Safe & Slow' },
            { type: 'growth-type', emoji: '📈', name: 'Investment', rate: 7, color: 'green', description: 'Fast & Risky' },
            { type: 'growth-type', emoji: '₿', name: 'Bitcoin', rate: 15, color: 'orange', description: 'Super Fast!' }
          ]
        },
        game: {
          type: 'money-tree',
          component: 'MoneyTreeGrowerGame'
        },
        quiz: {
          question: 'What is compound interest?',
          options: [
            'Money that stays the same forever',
            'When your money earns money, and that money earns more money',
            'Money you find on the ground',
            'Money you borrow from friends'
          ],
          correctAnswer: 1
        }
      },
    ]
  },
  {
    id: 4,
    title: 'Understanding Bitcoin',
    description: 'What is Bitcoin and how does cryptocurrency work?',
    difficulty: 'Intermediate',
    lessons: [
      {
        id: 7,
        title: 'What is Bitcoin?',
        content: `₿ **Bitcoin: Digital Treasure Adventure!** 

**The Digital Treasure:**
💻 **100% Digital** - No physical coins!
🌍 **Nobody Controls It** - Not even governments!
🔐 **Super Secure** - Secret computer codes!
⚡ **Instant Travel** - Send anywhere in seconds!

**The Magical Blockchain Notebook:**
📚 **Everyone Can Read** - It's like a public diary!
✏️ **Nobody Can Erase** - Once written, it's forever!
📝 **Records Everything** - Every Bitcoin transaction!

**Bitcoin vs Regular Money:**
🏛️ **Regular Money:** Banks control it
₿ **Bitcoin:** Math controls it!
🤲 **Regular Money:** Hold in hands  
💻 **Bitcoin:** Lives in computers!

**Why People Love Bitcoin:**
🥇 **Digital Gold** - Only 21 million ever!
🌍 **Worldwide** - Send anywhere instantly!
🛡️ **Safe** - No one can take it!
📈 **Growing** - Might be worth more later!

**Adventure Warning:** Bitcoin is new and exciting, but can be bumpy! 
It might be the future of money! 🚀✨`,
        video: '/videos/Bitcoin_for_Kids.mp4',
        visual: {
          emoji: '₿',
          color: 'amber-500'
        },
        interactive: {
          type: 'bitcoin-explorer',
          elements: [
            { type: 'bitcoin-feature', emoji: '💻', name: 'Digital', description: 'No physical coins!' },
            { type: 'bitcoin-feature', emoji: '🌍', name: 'Global', description: 'Send anywhere!' },
            { type: 'bitcoin-feature', emoji: '🔐', name: 'Secure', description: 'Secret codes!' },
            { type: 'bitcoin-feature', emoji: '📈', name: 'Growing', description: 'Might be worth more!' }
          ]
        },
        quiz: {
          question: 'What makes Bitcoin special?',
          options: [
            'It comes in different colors',
            'It only exists digitally and no government controls it',
            'It can only be used on weekends',
            'It expires after one year'
          ],
          correctAnswer: 1
        }
      }
    ]
  }
];
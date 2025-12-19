import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Sparkles, Star, Heart, Trophy, BookOpen, Target } from 'lucide-react';
import novaCartoon from '@/assets/nova-cartoon.png';
import { ParticleEffect } from './ParticleEffect';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useGamification } from '@/hooks/useGamification';

type MascotState = 'idle' | 'excited' | 'teaching' | 'celebrating' | 'encouraging' | 'thinking';
type PageContext = 'home' | 'learn' | 'chores' | 'invest';

interface AnimatedMascotProps {
  page: PageContext;
  message?: string;
  state?: MascotState;
  position?: 'fixed' | 'relative' | 'sticky';
  showParticles?: boolean;
  interactive?: boolean;
  autoRotateMessages?: boolean;
}

export const AnimatedMascot: React.FC<AnimatedMascotProps> = ({
  page,
  message: customMessage,
  state: customState,
  position = 'relative',
  showParticles = true,
  interactive = true,
  autoRotateMessages = true
}) => {
  const { playSuccess, playClick, playLevelUp } = useSoundEffects();
  const { userStats } = useGamification();
  
  const [mascotState, setMascotState] = useState<MascotState>(customState || 'idle');
  const [currentMessage, setCurrentMessage] = useState('');
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [particleTrigger, setParticleTrigger] = useState(false);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [clicks, setClicks] = useState(0);

  // Context-aware messages based on page and state
  const getContextMessages = useCallback((): string[] => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    
    const baseMessages: Record<PageContext, Record<MascotState, string[]>> = {
      home: {
        idle: [
          `${greeting}! Ready for your financial adventure? 🌟`,
          "Welcome back! I'm Nova, your money guide! 💫",
          "Let's learn about money together! 🎯"
        ],
        excited: [
          "Wow! You're here! Let's make today amazing! 🎉",
          "I'm so excited to help you learn! 🚀",
          "Ready to become a money master? Let's go! ⭐"
        ],
        teaching: [
          "Did you know? Compound interest is like a snowball rolling downhill! ❄️",
          "Fun fact: Starting to save early makes a HUGE difference! 💡",
          "Investing is like planting seeds that grow into money trees! 🌱"
        ],
        celebrating: [
          "You're doing AMAZING! Keep up the great work! 🏆",
          "Wow! Look at your progress! I'm so proud! 🎊",
          "You're becoming a financial superstar! ✨"
        ],
        encouraging: [
          "Remember: Every expert was once a beginner! 💪",
          "You've got this! I believe in you! ❤️",
          "Small steps lead to big achievements! 🌟"
        ],
        thinking: [
          "Hmm, what should we learn about today? 🤔",
          "Let me think... so many exciting topics! 💭",
          "I wonder what adventure awaits us today... 🎈"
        ]
      },
      learn: {
        idle: [
          "Pick a lesson and let's start learning! 📚",
          "So many cool things to discover! Which one interests you? 🎓",
          "Every lesson brings you closer to your goals! 🎯"
        ],
        excited: [
          "Learning time is the best time! Let's do this! 🚀",
          "I LOVE when you're ready to learn! Let's go! ⚡",
          "Your brain is about to get a super upgrade! 🧠✨"
        ],
        teaching: [
          "Listen carefully - this is really cool stuff! 👂",
          "Here's a secret about money that most people don't know... 🤫",
          "Let me break this down in a fun way! 🎨",
          `You've completed ${userStats.totalLessonsCompleted} lessons! Way to go! 📖`
        ],
        celebrating: [
          "YES! You completed another lesson! 🎉",
          `${userStats.learningStreak} day streak! You're on FIRE! 🔥`,
          "Knowledge unlocked! You're getting smarter! 🧠⭐"
        ],
        encouraging: [
          "Don't worry if it seems tricky - you'll get it! 💪",
          "Every lesson makes you stronger! Keep going! 🌟",
          "I'm here to help you every step of the way! 🤝"
        ],
        thinking: [
          "Which module should we explore first? 🤔",
          "So many interesting lessons... hmm... 💭",
          "Let's see what we can learn today! 🔍"
        ]
      },
      chores: {
        idle: [
          "Time to tackle those chores! You've got this! 🧹",
          "Let's make some money by completing chores! 💰",
          "Ready to earn? Let's check off that list! ✅"
        ],
        excited: [
          "Woohoo! Chore time! Let's make it fun! 🎉",
          "You're going to crush these chores! 💪",
          "Time to earn your allowance! Let's go! 🚀"
        ],
        teaching: [
          "Pro tip: Start with the easiest chores to build momentum! 💡",
          "Did you know? Finishing chores teaches responsibility! 🎯",
          "Chores = Money skills in action! 💰"
        ],
        celebrating: [
          `Amazing! ${userStats.choreStreak} day chore streak! 🎊`,
          "YES! Another chore done! You're unstoppable! 🏆",
          "Boom! That's how it's done! Keep going! ⚡"
        ],
        encouraging: [
          "I know chores aren't always fun, but you're doing great! 💪",
          "Almost there! Finish strong! 🌟",
          "Every chore completed is money earned! Keep it up! 💵"
        ],
        thinking: [
          "Which chore should you start with? 🤔",
          "Let's see what needs to be done today... 📋",
          "Hmm, how can we make this more fun? 🎮"
        ]
      },
      invest: {
        idle: [
          "Welcome to the investment zone! Ready to grow your money? 📈",
          "Let's explore the world of investing together! 💎",
          "Time to make your money work for you! 🌱"
        ],
        excited: [
          "Investing is SO cool! Let's learn together! 🚀",
          "You're about to become an investment pro! ⭐",
          "This is where the magic happens! Let's go! ✨"
        ],
        teaching: [
          "Remember: Diversification means don't put all eggs in one basket! 🥚",
          "Investing early gives you the power of time! ⏰",
          "The stock market goes up and down - that's normal! 📊"
        ],
        celebrating: [
          "Great investment choice! You're learning fast! 🎉",
          "Your portfolio is growing! Well done! 📈",
          "Smart move! You're thinking like an investor! 🧠"
        ],
        encouraging: [
          "Investing can seem scary, but you're doing great! 💪",
          "Take your time to learn - there's no rush! 🌟",
          "Every investor started exactly where you are! 🎯"
        ],
        thinking: [
          "Which investment should we explore? 🤔",
          "Let's think about this carefully... 💭",
          "Hmm, what's the best strategy here? 📊"
        ]
      }
    };

    return baseMessages[page]?.[mascotState] || baseMessages.home.idle;
  }, [page, mascotState, userStats]);

  // Get random message from context
  const getRandomMessage = useCallback(() => {
    const messages = getContextMessages();
    return messages[Math.floor(Math.random() * messages.length)];
  }, [getContextMessages]);

  // Typing animation effect
  useEffect(() => {
    const messageToShow = customMessage || currentMessage;
    
    if (messageToShow && messageToShow !== displayedMessage) {
      setIsTyping(true);
      setDisplayedMessage('');
      let index = 0;
      
      const typingInterval = setInterval(() => {
        if (index <= messageToShow.length) {
          setDisplayedMessage(messageToShow.slice(0, index));
          index++;
        } else {
          setIsTyping(false);
          clearInterval(typingInterval);
        }
      }, 30);

      return () => clearInterval(typingInterval);
    }
  }, [currentMessage, customMessage]);

  // Auto-rotate messages
  useEffect(() => {
    if (autoRotateMessages && !customMessage) {
      const interval = setInterval(() => {
        setCurrentMessage(getRandomMessage());
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [autoRotateMessages, customMessage, getRandomMessage]);

  // Initial message - set immediately on mount
  useEffect(() => {
    const initialMessage = customMessage || getRandomMessage();
    setCurrentMessage(initialMessage);
    setDisplayedMessage(''); // Reset to trigger typing animation
  }, []);

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // State-based animation
  const getStateAnimation = () => {
    switch (mascotState) {
      case 'excited':
        return { 
          y: [0, -15, 0, -10, 0],
          rotate: [0, -5, 5, -3, 0],
          scale: [1, 1.05, 1, 1.03, 1]
        };
      case 'celebrating':
        return { 
          rotate: [0, -10, 10, -10, 10, 0],
          scale: [1, 1.1, 1.05, 1.1, 1]
        };
      case 'teaching':
        return { 
          y: [0, -5, 0],
          rotate: [0, 3, -3, 0]
        };
      case 'encouraging':
        return { 
          scale: [1, 1.05, 1],
          y: [0, -3, 0]
        };
      case 'thinking':
        return {
          rotate: [-5, 5, -5],
          x: [0, 5, -5, 0]
        };
      default:
        return { 
          y: [0, -8, 0],
          rotate: [0, 2, -2, 0]
        };
    }
  };

  const getStateTransition = () => {
    switch (mascotState) {
      case 'excited':
        return { duration: 0.6, repeat: 2, repeatDelay: 0.3 };
      case 'celebrating':
        return { duration: 0.5, repeat: 3, repeatDelay: 0.2 };
      case 'teaching':
        return { duration: 2, repeat: 1, repeatDelay: 3 };
      case 'encouraging':
        return { duration: 1.5, repeat: 1, repeatDelay: 4 };
      case 'thinking':
        return { duration: 2, repeat: 1, repeatDelay: 3 };
      default:
        return { duration: 2.5, repeat: 1, repeatDelay: 5 };
    }
  };

  const getStateEmoji = () => {
    switch (mascotState) {
      case 'excited': return '🎉';
      case 'celebrating': return '🏆';
      case 'teaching': return '📚';
      case 'encouraging': return '💪';
      case 'thinking': return '🤔';
      default: return '✨';
    }
  };

  const getStateIcon = () => {
    switch (mascotState) {
      case 'celebrating': return Trophy;
      case 'teaching': return BookOpen;
      case 'encouraging': return Heart;
      case 'thinking': return Target;
      default: return Sparkles;
    }
  };

  const handleMascotClick = () => {
    if (!interactive) return;
    
    playClick();
    const newClicks = clicks + 1;
    setClicks(newClicks);

    // Special interaction on multiple clicks
    if (newClicks >= 3) {
      setMascotState('celebrating');
      setParticleTrigger(true);
      playLevelUp();
      setCurrentMessage("Hehe! You found my secret! You're awesome! 🎉✨");
      setClicks(0);
      
      setTimeout(() => {
        setMascotState('excited');
        setParticleTrigger(false);
      }, 2000);
    } else {
      // Cycle through states on click
      const states: MascotState[] = ['excited', 'teaching', 'encouraging', 'thinking'];
      const currentIndex = states.indexOf(mascotState);
      const nextState = states[(currentIndex + 1) % states.length];
      setMascotState(nextState);
      setCurrentMessage(getRandomMessage());
      playSuccess();
    }
  };

  const StateIcon = getStateIcon();

  const positionClasses = {
    fixed: 'fixed bottom-4 right-4 max-w-md z-40',
    sticky: 'sticky top-4 z-40',
    relative: 'relative'
  };

  return (
    <>
      {showParticles && <ParticleEffect type="sparkles" count={20} trigger={particleTrigger} />}
      
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className={positionClasses[position]}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border-2 border-primary/30 shadow-xl backdrop-blur-sm">
          <AnimatePresence>
            {showBubble && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-start gap-4 p-4"
              >
                <motion.div 
                  className="relative cursor-pointer"
                  animate={getStateAnimation()}
                  transition={getStateTransition()}
                  onClick={handleMascotClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ touchAction: 'manipulation' }}
                >
                  <motion.div
                    className="relative"
                    animate={{
                      rotateY: eyePosition.x * 5,
                      rotateX: -eyePosition.y * 5
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <motion.img 
                      src={novaCartoon} 
                      alt="Nova your money guide" 
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/30 shadow-lg"
                    />
                    
                    {/* Blinking eyes overlay */}
                    <AnimatePresence>
                      {isBlinking && (
                        <motion.div
                          initial={{ scaleY: 1 }}
                          animate={{ scaleY: 0 }}
                          exit={{ scaleY: 1 }}
                          transition={{ duration: 0.15 }}
                          className="absolute inset-0 bg-primary/5 rounded-full"
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                  
                  <motion.div 
                    className="absolute -top-2 -right-2 text-3xl"
                    animate={{
                      y: [0, -8, 0],
                      scale: [1, 1.3, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatDelay: 0.5
                    }}
                  >
                    {getStateEmoji()}
                  </motion.div>
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-primary text-sm">Nova says:</span>
                    <motion.div
                      animate={{ 
                        scale: [1, 1.3, 1],
                        rotate: [0, 15, -15, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <StateIcon className="h-4 w-4 text-primary" />
                    </motion.div>
                  </div>
                  
                  <motion.div
                    className="relative bg-white/50 dark:bg-slate-800/50 rounded-lg p-3 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {displayedMessage}
                      {isTyping && (
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="inline-block ml-1"
                        >
                          |
                        </motion.span>
                      )}
                    </p>
                    
                    {/* Speech bubble tail */}
                    <div className="absolute -left-2 top-4 w-4 h-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm transform rotate-45" />
                  </motion.div>
                  
                  {interactive && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      className="text-xs text-muted-foreground mt-2 text-center"
                    >
                      💡 Click me for tips!
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </>
  );
};

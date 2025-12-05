// MoneyDetectiveGamePro.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Coins, RotateCcw, Star, Sparkles, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";

// ----- Types & Data (reuse your GameItem & gameItems exactly as-is) -----
interface GameItem {
  id: string;
  name: string;
  emoji: string;
  isMoney: boolean;
  category: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  bitcoinRelated?: boolean;
}

// Comprehensive gameItems array with educational content
const gameItems: GameItem[] = [
  // 💰 MONEY ITEMS (Good Money)
  { id: 'gold', name: 'Gold Coin', emoji: '🪙', isMoney: true, category: 'Precious Metal', explanation: 'Durable, scarce, and universally accepted!', difficulty: 'easy', bitcoinRelated: false },
  { id: 'silver', name: 'Silver Coin', emoji: '🥈', isMoney: true, category: 'Precious Metal', explanation: 'Valuable metal that keeps its worth over time!', difficulty: 'easy', bitcoinRelated: false },
  { id: 'dollar', name: 'Dollar Bill', emoji: '💵', isMoney: true, category: 'Paper Money', explanation: 'Official currency backed by the government!', difficulty: 'easy', bitcoinRelated: false },
  { id: 'euro', name: 'Euro', emoji: '💶', isMoney: true, category: 'Paper Money', explanation: 'Used across many European countries!', difficulty: 'easy', bitcoinRelated: false },
  { id: 'yen', name: 'Japanese Yen', emoji: '💴', isMoney: true, category: 'Paper Money', explanation: 'Official currency of Japan!', difficulty: 'easy', bitcoinRelated: false },
  { id: 'pound', name: 'British Pound', emoji: '💷', isMoney: true, category: 'Paper Money', explanation: 'One of the oldest currencies still in use!', difficulty: 'easy', bitcoinRelated: false },
  { id: 'bitcoin', name: 'Bitcoin', emoji: '₿', isMoney: true, category: 'Digital Currency', explanation: 'Digital money that works worldwide!', difficulty: 'easy', bitcoinRelated: true },
  { id: 'ethereum', name: 'Ethereum', emoji: '♦', isMoney: true, category: 'Digital Currency', explanation: 'Smart contract digital currency!', difficulty: 'easy', bitcoinRelated: false },
  { id: 'credit_card', name: 'Credit Card', emoji: '💳', isMoney: true, category: 'Digital Payment', explanation: 'Represents money in your bank account!', difficulty: 'medium', bitcoinRelated: false },
  { id: 'check', name: 'Check', emoji: '📝', isMoney: true, category: 'Paper Payment', explanation: 'Written promise to pay money!', difficulty: 'medium', bitcoinRelated: false },
  { id: 'gift_card', name: 'Gift Card', emoji: '🎁', isMoney: true, category: 'Store Credit', explanation: 'Prepaid money for specific stores!', difficulty: 'medium', bitcoinRelated: false },
  { id: 'crypto_wallet', name: 'Crypto Wallet', emoji: '👛', isMoney: true, category: 'Digital Storage', explanation: 'Holds your digital money safely!', difficulty: 'hard', bitcoinRelated: true },

  // 🚫 NOT MONEY ITEMS (Not Good Money)
  { id: 'cow', name: 'Cow', emoji: '🐄', isMoney: false, category: 'Animal', explanation: 'Too big to carry around!', difficulty: 'easy', bitcoinRelated: false },
  { id: 'shell', name: 'Sea Shell', emoji: '🐚', isMoney: false, category: 'Natural Object', explanation: 'Too common and fragile!', difficulty: 'easy', bitcoinRelated: false },
  { id: 'rock', name: 'Rock', emoji: '🪨', isMoney: false, category: 'Natural Object', explanation: 'Too heavy and not valuable!', difficulty: 'easy', bitcoinRelated: false },
  { id: 'leaf', name: 'Leaf', emoji: '🍃', isMoney: false, category: 'Plant', explanation: 'Dies quickly and too common!', difficulty: 'easy', bitcoinRelated: false },
  { id: 'sand', name: 'Sand', emoji: '🏖️', isMoney: false, category: 'Natural Object', explanation: 'Too common and hard to count!', difficulty: 'easy', bitcoinRelated: false },
  { id: 'water', name: 'Water', emoji: '💧', isMoney: false, category: 'Liquid', explanation: 'Essential but not used as money!', difficulty: 'easy', bitcoinRelated: false },
  { id: 'air', name: 'Air', emoji: '💨', isMoney: false, category: 'Gas', explanation: 'Invisible and impossible to store!', difficulty: 'easy', bitcoinRelated: false },
  { id: 'time', name: 'Time', emoji: '⏰', isMoney: false, category: 'Concept', explanation: 'Valuable but can\'t be stored or traded!', difficulty: 'medium', bitcoinRelated: false },
  { id: 'love', name: 'Love', emoji: '❤️', isMoney: false, category: 'Emotion', explanation: 'Priceless but not tradeable!', difficulty: 'medium', bitcoinRelated: false },
  { id: 'friendship', name: 'Friendship', emoji: '🤝', isMoney: false, category: 'Relationship', explanation: 'Valuable but not a currency!', difficulty: 'medium', bitcoinRelated: false },
  { id: 'knowledge', name: 'Knowledge', emoji: '🧠', isMoney: false, category: 'Intangible', explanation: 'Valuable but hard to measure and trade!', difficulty: 'hard', bitcoinRelated: false },
  { id: 'happiness', name: 'Happiness', emoji: '😊', isMoney: false, category: 'Emotion', explanation: 'Priceless but not a form of money!', difficulty: 'hard', bitcoinRelated: false },
  { id: 'dreams', name: 'Dreams', emoji: '💭', isMoney: false, category: 'Intangible', explanation: 'Personal and not tradeable!', difficulty: 'hard', bitcoinRelated: false },
  { id: 'memories', name: 'Memories', emoji: '📸', isMoney: false, category: 'Intangible', explanation: 'Precious but not a currency!', difficulty: 'hard', bitcoinRelated: false },
  { id: 'imagination', name: 'Imagination', emoji: '🌈', isMoney: false, category: 'Intangible', explanation: 'Creative but not tradeable!', difficulty: 'hard', bitcoinRelated: false }
];

// ----- Helpers -----

function getRandomItems(): GameItem[] {
  const itemsPerGame = 10;
  const shuffled = [...gameItems].sort(() => Math.random() - 0.5);
  
  // Ensure we have a good mix of money and non-money items
  const moneyItems = shuffled.filter(item => item.isMoney);
  const notMoneyItems = shuffled.filter(item => !item.isMoney);
  
  // Take 5 money items and 5 non-money items for a balanced game
  const selectedMoney = moneyItems.slice(0, 5);
  const selectedNotMoney = notMoneyItems.slice(0, 5);
  
  const selectedItems = [...selectedMoney, ...selectedNotMoney];
  
  // Shuffle the final selection
  return selectedItems.sort(() => Math.random() - 0.5);
}

// Lightweight emoji confetti
function EmojiBurst({ show, center }: { show: boolean; center?: boolean }) {
  const emojis = ["✨", "💥", "🎉", "💫", "🪙"];
  if (!show) return null;
  return (
    <div className={`pointer-events-none absolute inset-0 ${center ? "grid place-items-center" : ""}`}>
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute text-xl select-none"
          initial={{ opacity: 0, y: 0, scale: 0.6 }}
          animate={{
            opacity: [0, 1, 0],
            y: -60 - Math.random() * 40,
            x: (Math.random() - 0.5) * 140,
            rotate: (Math.random() - 0.5) * 60,
            scale: 1,
          }}
          transition={{ duration: 0.9 + Math.random() * 0.4, ease: "easeOut" }}
          style={{ left: "50%", top: "50%" }}
        >
          {emojis[i % emojis.length]}
        </motion.span>
      ))}
    </div>
  );
}

// ----- Main Component -----
export default function MoneyDetectiveGamePro({ onComplete }: { onComplete?: () => void }) {
  const [gameState, setGameState] = useState<"ready" | "playing" | "finished">("ready");
  const [timeLeft, setTimeLeft] = useState(90);
  const [score, setScore] = useState(0);
  const [moneyBox, setMoneyBox] = useState<GameItem[]>([]);
  const [notMoneyBox, setNotMoneyBox] = useState<GameItem[]>([]);
  const [pool, setPool] = useState<GameItem[]>([]);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<string>("");
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [perfectScore, setPerfectScore] = useState(false);
  const [bitcoinItemsFound, setBitcoinItemsFound] = useState(0);
  const [justScored, setJustScored] = useState<"money" | "not" | null>(null);
  const [burst, setBurst] = useState(false);

  const { completeLesson } = useGamification();

  const arenaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (gameState !== "playing") return;
    if (timeLeft <= 0) {
      finishGame();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, gameState]);

  // Animated piggy fill
  const piggy = useSpring(0, { stiffness: 140, damping: 20, mass: 0.6 });
  const totalSorted = pool.length + moneyBox.length + notMoneyBox.length;
  const total = useMemo(() => totalSorted, [totalSorted]); // same as total items
  const piggyPct = useTransform(piggy, (v) => Math.min(Math.round(v), 100));

  useEffect(() => {
    const pct = total > 0 ? (score / total) * 100 : 0;
    piggy.set(pct);
  }, [score, total, piggy]);

  function startGame() {
    const items = getRandomItems();
    console.log('Starting game with items:', items.map(i => ({ name: i.name, isMoney: i.isMoney })));
    setPool(items);
    setMoneyBox([]);
    setNotMoneyBox([]);
    setScore(0);
    setStreak(0);
    setTimeLeft(90);
    setFeedback("");
    setCoinsEarned(0);
    setGameState("playing");
    setPerfectScore(false);
    setBitcoinItemsFound(0);
    setBurst(false);
    setJustScored(null);
  }


  function finishGame() {
    setGameState("finished");
    const finalCoins = Math.floor(score * 2) + bitcoinItemsFound * 5;
    setCoinsEarned(finalCoins);

    const xp = Math.floor(score * 3) + bitcoinItemsFound * 10;
    completeLesson(xp);

    const accuracy = total > 0 ? (score / total) * 100 : 0;
    setPerfectScore(accuracy === 100);
    
    if (accuracy === 100) {
      setFeedback("🎉 PERFECT! You found every money item!");
    } else if (accuracy >= 90) {
      setFeedback("🌟 Excellent! You're almost a Money Detective Expert!");
    } else if (accuracy >= 75) {
      setFeedback("👍 Great job! You understand money basics well!");
    } else if (accuracy >= 60) {
      setFeedback("📚 Good start! Keep practicing.");
    } else {
      setFeedback("💪 Nice try! Let's play again and improve!");
    }
    
    onComplete?.();
    // big burst on finish
    setBurst(true);
    setTimeout(() => setBurst(false), 1200);
  }

  function handleDrop(item: GameItem, target: "money" | "notMoney") {
    const correct = (target === "money" && item.isMoney) || (target === "notMoney" && !item.isMoney);

    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      if (item.bitcoinRelated) setBitcoinItemsFound((b) => b + 1);
      setJustScored(target === "money" ? "money" : "not");
      setBurst(true);
      setTimeout(() => setBurst(false), 500);
    } else {
      setStreak(0);
      setJustScored(null);
    }

    if (target === "money") setMoneyBox((arr) => [...arr, item]);
    else setNotMoneyBox((arr) => [...arr, item]);

    setPool((arr) => arr.filter((x) => x.id !== item.id));

    // done?
    if (pool.length === 1) {
      setTimeout(finishGame, 650);
    }
  }

  // ----- Game Item Component -----
  function GameItem({ item }: { item: GameItem }) {
    return (
      <motion.div
        className={`rounded-xl border-2 p-2 sm:p-3 text-center bg-white shadow-sm relative
        ${item.bitcoinRelated ? "bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-300" : "border-black/10"}
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        layout
      >
        <div className="text-2xl sm:text-3xl mb-1 leading-none">{item.emoji}</div>
        <div className="text-[10px] sm:text-xs font-medium line-clamp-2">{item.name}</div>
        {item.bitcoinRelated && <div className="text-[8px] sm:text-[10px] text-orange-600 font-bold">₿</div>}
        
        {/* Action buttons */}
        <div className="mt-1 sm:mt-2 flex flex-col sm:flex-row gap-1">
          <button 
            className="text-[10px] sm:text-xs px-1 sm:px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            onClick={() => handleDrop(item, "money")}
          >
            💰
            <span className="hidden sm:inline ml-1">Money</span>
          </button>
          <button 
            className="text-[10px] sm:text-xs px-1 sm:px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            onClick={() => handleDrop(item, "notMoney")}
          >
            🚫
            <span className="hidden sm:inline ml-1">Not</span>
          </button>
        </div>
      </motion.div>
    );
  }

  // ----- UI Renderers -----
  if (gameState === "ready") {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-lg rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl flex items-center justify-center gap-2">
            🕵️‍♀️ Money Detective
          </CardTitle>
          <p className="text-muted-foreground text-lg">
            Click the buttons to sort items into the right vault. Learn what makes good money.
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <Button
            onClick={startGame}
            size="lg"
            className="w-full bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 rounded-xl px-4 py-3 text-sm sm:text-base whitespace-nowrap"
          >
            <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Start Detective Mission</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (gameState === "finished") {
    const accuracy = total > 0 ? (score / total) * 100 : 0;

    return (
      <Card className="w-full max-w-4xl mx-auto relative overflow-hidden">
        <EmojiBurst show={burst} center />
        <CardHeader className="text-center">
          <CardTitle className="text-3xl flex items-center justify-center gap-2">
            {perfectScore ? "🎉 PERFECT SCORE!" : "🎉 Mission Complete!"}
            {perfectScore && <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-2">🐷</div>
            <Progress value={Number(piggyPct.get())} className="w-full h-6 mb-2" />
            <p className="text-sm text-muted-foreground">
              Piggy Bank: {Math.round(Number(piggyPct.get()))}%
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-xl border border-green-200">
              <div className="text-2xl font-bold text-green-700">
                {score}/{total}
              </div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">{coinsEarned}</div>
              <div className="text-sm text-muted-foreground">Coins</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">
                {Math.floor(score * 3) + bitcoinItemsFound * 10} XP
              </div>
              <div className="text-sm text-muted-foreground">Experience</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
              <div className="text-2xl font-bold text-orange-700">{bitcoinItemsFound}</div>
              <div className="text-sm text-muted-foreground">Bitcoin Found ₿</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl text-center border border-green-200">
            <p className="font-medium text-lg">{feedback}</p>
            {bitcoinItemsFound > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                🎉 You found {bitcoinItemsFound} Bitcoin item{bitcoinItemsFound > 1 ? "s" : ""}!
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-center">
            <Button onClick={() => setGameState("ready")} variant="outline" size="lg" className="rounded-xl">
              <RotateCcw className="h-4 w-4 mr-2" />
              Play Again
            </Button>
            {perfectScore && (
              <Button variant="default" size="lg" className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                <Star className="h-4 w-4 mr-2" />
                Perfect Detective!
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ----- PLAYING -----
  const multiplier = Math.min(1 + Math.floor(streak / 3) * 0.25, 3); // 1x → 3x
  const scoreTotal = pool.length + moneyBox.length + notMoneyBox.length;

  return (
    <Card className="w-full max-w-4xl mx-auto overflow-hidden">
      <CardHeader className="px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">🕵️‍♀️ Money Detective</CardTitle>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <Badge variant="secondary" className="flex items-center gap-1 rounded-xl text-xs">
              <Clock className="h-3 w-3" />
              {timeLeft}s
            </Badge>
            <Badge variant="default" className="flex items-center gap-1 rounded-xl text-xs">
              <Coins className="h-3 w-3" />
              {score}/{scoreTotal}
            </Badge>
            {streak > 0 && (
              <Badge variant="outline" className="rounded-xl bg-yellow-50 text-yellow-700 text-xs">
                <Star className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Streak {streak} • </span>{multiplier.toFixed(2)}x
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-2xl">🐷</span>
          <Progress value={Number(piggyPct.get())} className="flex-1 h-3" />
          <span className="text-sm text-muted-foreground">{Math.round(Number(piggyPct.get()))}%</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
        {/* Pool / Arena */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            Items to Sort:
            <span className="text-sm text-muted-foreground">({pool.length} remaining)</span>
          </h3>
          <div
            ref={arenaRef}
            className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 p-2 sm:p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-white border border-black/5 min-h-[120px] sm:min-h-[140px]"
          >
            <EmojiBurst show={burst} />
            <AnimatePresence>
              {pool.map((item) => (
                <GameItem key={item.id} item={item} />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Explanation toast (last correct/incorrect) */}
        <AnimatePresence>
          {justScored && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-auto max-w-lg"
            >
              <div
                className={`rounded-xl px-4 py-3 text-sm border shadow-sm ${
                  justScored === "money"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                {justScored === "money" ? (
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Correct! Money belongs in the 💰 vault.
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <XCircle className="h-4 w-4" /> Nice catch! Not money goes to 🚫 bin.
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drop Zones */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* MONEY */}
          <div className="space-y-3">
            <h3 className="font-semibold text-green-700 flex items-center gap-2 text-lg">
              💰 Money
              <Badge variant="outline" className="bg-green-50 text-green-700 rounded-xl">
                {moneyBox.length} items
              </Badge>
            </h3>
            <div
              className="relative min-h-[200px] sm:min-h-[250px] p-2 sm:p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg hover:shadow-xl transition-shadow"
            >
              <AnimatePresence>
                {moneyBox.length === 0 ? (
                  <motion.div
                    key="money-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid place-items-center h-full text-center text-muted-foreground"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">💰</div>
                      <div className="font-medium">Money items will appear here!</div>
                      <div className="text-sm text-muted-foreground mt-1">Click "💰 Money" buttons on items</div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {moneyBox.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        className={`rounded-xl border p-3 text-center bg-white ${
                          item.bitcoinRelated
                            ? "bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-300"
                            : "border-green-200"
                        }`}
                      >
                        <div className="text-2xl">{item.emoji}</div>
                        <div className="text-xs font-medium">{item.name}</div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* NOT MONEY */}
          <div className="space-y-3">
            <h3 className="font-semibold text-rose-700 flex items-center gap-2 text-lg">
              🚫 Not Money
              <Badge variant="outline" className="bg-rose-50 text-rose-700 rounded-xl">
                {notMoneyBox.length} items
              </Badge>
            </h3>
            <div
              className="relative min-h-[200px] sm:min-h-[250px] p-2 sm:p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-300 shadow-lg hover:shadow-xl transition-shadow"
            >
              <AnimatePresence>
                {notMoneyBox.length === 0 ? (
                  <motion.div
                    key="not-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid place-items-center h-full text-center text-muted-foreground"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">🚫</div>
                      <div className="font-medium">Non-money items will appear here!</div>
                      <div className="text-sm text-muted-foreground mt-1">Click "🚫 Not Money" buttons on items</div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {notMoneyBox.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        className="rounded-xl border p-3 text-center bg-white border-rose-200"
                      >
                        <div className="text-2xl">{item.emoji}</div>
                        <div className="text-xs font-medium">{item.name}</div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Hint */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 sm:p-4 rounded-xl border border-yellow-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-yellow-700" />
              <span className="font-medium text-yellow-800">Detective’s Hint</span>
            </div>
            <p className="text-xs sm:text-sm text-yellow-800">
              Durable + Portable + Divisible + Scarce + Accepted = Good Money.
            </p>
            {bitcoinItemsFound > 0 && (
              <p className="text-xs text-orange-700 mt-2 font-medium">
                You found Bitcoin! It’s digital money with global reach.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

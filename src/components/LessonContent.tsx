import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, CheckCircle, BookOpen, PlayCircle, DollarSign, Briefcase, MapPin, PieChart, TrendingUp, Bitcoin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MoneyDetectiveGamePro from './MoneyDetectiveGamePro';
import { TreasureIslandBudgetGame } from './TreasureIslandBudgetGame';
import { MoneyTreeGrowerGame } from './MoneyTreeGrowerGame';
import lessonBookIcon from '@/assets/icons/lesson-book.png';
import treasureMapIcon from '@/assets/icons/treasure-map.png';
import budgetBuilderIcon from '@/assets/icons/budget-builder.png';
import growthTreeIcon from '@/assets/icons/growth-tree.png';
import { useGamification } from '@/hooks/useGamification';

interface Lesson {
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

interface LessonContentProps {
  moduleId: number;
  moduleName: string;
  lessons: Lesson[];
  onComplete: () => void;
}

export const LessonContent: React.FC<LessonContentProps> = ({
  moduleId,
  moduleName,
  lessons,
  onComplete
}) => {
  const navigate = useNavigate();
  const { completeLesson } = useGamification();
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  const currentLesson = lessons[currentLessonIndex];
  const progress = ((currentLessonIndex + 1) / lessons.length) * 100;

  const handleNextLesson = () => {
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      setSelectedAnswer(null);
      setShowResults(false);
    } else {
      onComplete();
    }
  };

  const handlePreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      setSelectedAnswer(null);
      setShowResults(false);
    }
  };

  const handleQuizAnswer = () => {
    if (selectedAnswer !== null) {
      setShowResults(true);
      if (selectedAnswer === currentLesson.quiz?.correctAnswer) {
        setCompletedLessons(prev => new Set(prev).add(currentLesson.id));
        // Award lesson completion with earnings
        completeLesson(5); // Award $5 for completing a lesson
      }
    }
  };

  const markLessonComplete = () => {
    setCompletedLessons(prev => new Set(prev).add(currentLesson.id));
    // Award lesson completion with earnings
    completeLesson(5); // Award $5 for completing a lesson
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/learn')}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{moduleName}</h1>
              <p className="text-muted-foreground">
                Lesson {currentLessonIndex + 1} of {lessons.length}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            {Math.round(progress)}% Complete
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Lesson Content */}
        <Card className="mb-8 overflow-hidden bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-money-green/20 to-money-gold/20">
                <img src={lessonBookIcon} alt="Lesson" className="w-8 h-8" />
              </div>
              <div className="flex flex-col gap-1">
                <Badge variant="outline" className="w-fit">Lesson {currentLessonIndex + 1}</Badge>
                <CardTitle className="text-2xl font-bold text-foreground">{currentLesson.title}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Video Section */}
            {currentLesson.video && (
              <div className="mb-6">
                <video 
                  controls 
                  className="w-full rounded-lg shadow-lg"
                  src={currentLesson.video}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            <div className="bg-card/50 rounded-lg p-6 border border-muted">
              <div className="text-lg leading-relaxed whitespace-pre-line font-medium">
                {currentLesson.content}
              </div>
            </div>

            {/* Interactive Elements */}
            {currentLesson.interactive && (
              <div className="mt-6">

                {currentLesson.interactive.type === 'money-types-showcase' && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 justify-center mb-4">
                      <DollarSign className="h-6 w-6 text-green-600" />
                      <h3 className="text-xl font-bold">Money Types Showcase</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentLesson.interactive.elements.map((element, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
                          <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center bg-green-100 dark:bg-green-900 rounded-full">
                            <DollarSign className="h-6 w-6 text-green-600" />
                          </div>
                          <h4 className="font-bold text-lg mb-1">{element.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{element.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentLesson.interactive.type === 'job-simulator' && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 justify-center mb-4">
                      <Briefcase className="h-6 w-6 text-purple-600" />
                      <h3 className="text-xl font-bold">Job Simulator</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {currentLesson.interactive.elements.map((element, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                          <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center bg-purple-100 dark:bg-purple-900 rounded-full">
                            <Briefcase className="h-6 w-6 text-purple-600" />
                          </div>
                          <h4 className="font-bold text-sm mb-1">{element.name}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{element.description}</p>
                          <div className="text-lg font-bold text-green-600">+${element.reward}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentLesson.interactive.type === 'treasure-map' && (
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 justify-center mb-4">
                      <img src={treasureMapIcon} alt="Treasure Map" className="w-8 h-8" />
                      <h3 className="text-xl font-bold">Treasure Map</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentLesson.interactive.elements.map((element, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
                          <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-full">
                            <MapPin className="h-6 w-6 text-blue-600" />
                          </div>
                          <h4 className="font-bold text-lg mb-1">{element.name}</h4>
                          <div className="text-2xl font-bold text-blue-600 mb-1">{element.percentage}%</div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{element.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentLesson.interactive.type === 'budget-builder' && (
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 justify-center mb-4">
                      <img src={budgetBuilderIcon} alt="Budget Builder" className="w-8 h-8" />
                      <h3 className="text-xl font-bold">Budget Builder</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentLesson.interactive.elements.map((element, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
                          <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center bg-orange-100 dark:bg-orange-900 rounded-full">
                            <PieChart className="h-6 w-6 text-orange-600" />
                          </div>
                          <h4 className="font-bold text-lg mb-1">{element.name}</h4>
                          <div className="text-2xl font-bold text-orange-600 mb-2">{element.percentage}%</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {element.examples.map((example, i) => (
                              <span key={i}>{example}{i < element.examples.length - 1 ? ', ' : ''}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentLesson.interactive.type === 'growth-simulator' && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 justify-center mb-4">
                      <img src={growthTreeIcon} alt="Growth Simulator" className="w-8 h-8" />
                      <h3 className="text-xl font-bold">Growth Simulator</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentLesson.interactive.elements.map((element, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
                          <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center bg-green-100 dark:bg-green-900 rounded-full">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                          </div>
                          <h4 className="font-bold text-lg mb-1">{element.name}</h4>
                          <div className="text-2xl font-bold text-green-600 mb-1">{element.rate}% per year</div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{element.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentLesson.interactive.type === 'bitcoin-explorer' && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg p-6 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 justify-center mb-4">
                      <Bitcoin className="h-6 w-6 text-amber-600" />
                      <h3 className="text-xl font-bold">Bitcoin Explorer</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {currentLesson.interactive.elements.map((element, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                          <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center bg-amber-100 dark:bg-amber-900 rounded-full">
                            <Bitcoin className="h-6 w-6 text-amber-600" />
                          </div>
                          <h4 className="font-bold text-sm mb-1">{element.name}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{element.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Game Section */}
            {currentLesson.game?.type === 'money-detective' && (
              <div className="mt-6">
                <MoneyDetectiveGamePro onComplete={() => {
                  setCompletedLessons(prev => new Set(prev).add(currentLesson.id));
                  completeLesson(5); // Award $5 for completing a lesson
                }} />
              </div>
            )}
            
            {currentLesson.game?.type === 'treasure-budget' && (
              <div className="mt-6">
                <TreasureIslandBudgetGame onComplete={() => {
                  setCompletedLessons(prev => new Set(prev).add(currentLesson.id));
                  completeLesson(5); // Award $5 for completing a lesson
                }} />
              </div>
            )}
            
            {currentLesson.game?.type === 'money-tree' && (
              <div className="mt-6">
                <MoneyTreeGrowerGame onComplete={() => {
                  setCompletedLessons(prev => new Set(prev).add(currentLesson.id));
                  completeLesson(5); // Award $5 for completing a lesson
                }} />
              </div>
            )}

            {!currentLesson.quiz && !currentLesson.game && (
              <div className="flex justify-center pt-4">
                <Button 
                  variant="hero" 
                  onClick={markLessonComplete}
                  className="px-8"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Complete
                </Button>
              </div>
            )}

            {/* Quiz Section */}
            {currentLesson.quiz && (
              <Card className="bg-money-light/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-money-gold" />
                    Quick Check
                  </CardTitle>
                  <CardDescription>{currentLesson.quiz.question}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {currentLesson.quiz.options.map((option, index) => (
                      <Button
                        key={index}
                        variant={selectedAnswer === index ? "default" : "outline"}
                        className="w-full justify-start text-left h-auto p-2 sm:p-4 text-sm sm:text-base leading-relaxed"
                        onClick={() => setSelectedAnswer(index)}
                        disabled={showResults}
                      >
                        <span className="mr-2 sm:mr-3 font-medium flex-shrink-0">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className="flex-1 break-words whitespace-normal">
                          {option}
                        </span>
                      </Button>
                    ))}
                  </div>

                  {!showResults && selectedAnswer !== null && (
                    <Button 
                      variant="hero" 
                      onClick={handleQuizAnswer}
                      className="w-full"
                    >
                      Submit Answer
                    </Button>
                  )}

                  {showResults && (
                    <div className="pt-4">
                      {selectedAnswer === currentLesson.quiz.correctAnswer ? (
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">Correct! Well done!</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <div className="text-red-800 dark:text-red-200">
                            <span className="font-medium">Not quite right.</span>
                            <p className="mt-1">
                              The correct answer is: {String.fromCharCode(65 + (currentLesson.quiz.correctAnswer || 0))}. {currentLesson.quiz.options[currentLesson.quiz.correctAnswer || 0]}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePreviousLesson}
            disabled={currentLessonIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {lessons.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index <= currentLessonIndex
                    ? 'bg-money-green'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <Button
            variant="hero"
            onClick={handleNextLesson}
            disabled={(currentLesson.quiz && !showResults) || (currentLesson.game && !completedLessons.has(currentLesson.id))}
          >
            {currentLessonIndex === lessons.length - 1 ? 'Complete Module' : 'Next'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
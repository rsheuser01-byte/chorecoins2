import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format, isSameDay, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { Plus, Edit, Trash2, Calendar as CalendarIcon, CheckCircle, Clock } from 'lucide-react';
import calendarJanuary from '@/assets/calendar-january.svg';
import calendarFebruary from '@/assets/calendar-february.svg';
import calendarMarch from '@/assets/calendar-march.svg';
import calendarApril from '@/assets/calendar-april.svg';
import calendarMay from '@/assets/calendar-may.svg';
import calendarJune from '@/assets/calendar-june.svg';
import calendarJuly from '@/assets/calendar-july.svg';
import calendarAugust from '@/assets/calendar-august.svg';
import calendarSeptember from '@/assets/calendar-september.svg';
import calendarOctober from '@/assets/calendar-october.svg';
import calendarNovember from '@/assets/calendar-november.svg';
import calendarDecember from '@/assets/calendar-december.svg';

export interface Chore {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate: Date;
  recurring?: 'daily' | 'weekly' | 'monthly' | 'none';
  priority: 'low' | 'medium' | 'high';
  category: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  emoji?: string;
}

interface ChoreCalendarProps {
  chores: Chore[];
  onChoreUpdate: (chores: Chore[]) => void;
  onChoreComplete: (chore: Chore) => void;
  onAddChore?: (chore: Partial<Chore>) => void; // legacy optional
  onRequestAddChore?: (date: Date) => void; // open parent dialog with selected date
  onRequestEditChore?: (chore: Chore) => void; // open parent edit dialog in Today tab style
}

export const ChoreCalendar: React.FC<ChoreCalendarProps> = ({ 
  chores, 
  onChoreUpdate, 
  onChoreComplete,
  onAddChore,
  onRequestAddChore,
  onRequestEditChore,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddingChore, setIsAddingChore] = useState(false);
  const [newChore, setNewChore] = useState<Partial<Chore>>({
    title: '',
    description: '',
    completed: false,
    dueDate: new Date(),
    recurring: 'none',
    priority: 'medium',
    category: 'General',
    difficulty: 'easy',
    emoji: '✅'
  });

  const categories = ['General', 'Cleaning', 'Kitchen', 'Yard Work', 'Pet Care', 'Study', 'Exercise'];
  
  const monthThemes: Record<number, { title: string; emoji: string; from: string; to: string; darkFrom: string; darkTo: string; accent: string; image: string }> = {
    0: { title: "Winter Sparkle", emoji: "❄️", from: 'from-cyan-50', to: 'to-blue-100', darkFrom: 'dark:from-cyan-900', darkTo: 'dark:to-blue-800', accent: 'text-cyan-700', image: '/src/assets/calendar-january.svg' },
    1: { title: "Love & Kindness", emoji: "💖", from: 'from-rose-50', to: 'to-pink-100', darkFrom: 'dark:from-rose-900', darkTo: 'dark:to-pink-800', accent: 'text-rose-700', image: '/src/assets/calendar-february.svg' },
    2: { title: "Spring Bloom", emoji: "🌸", from: 'from-pink-50', to: 'to-emerald-100', darkFrom: 'dark:from-pink-900', darkTo: 'dark:to-emerald-800', accent: 'text-emerald-700', image: '/src/assets/calendar-march.svg' },
    3: { title: "April Showers", emoji: "🌧️", from: 'from-sky-50', to: 'to-indigo-100', darkFrom: 'dark:from-sky-900', darkTo: 'dark:to-indigo-800', accent: 'text-sky-700', image: '/src/assets/calendar-april.svg' },
    4: { title: "May Blossoms", emoji: "🌼", from: 'from-yellow-50', to: 'to-green-100', darkFrom: 'dark:from-yellow-900', darkTo: 'dark:to-green-800', accent: 'text-yellow-700', image: '/src/assets/calendar-may.svg' },
    5: { title: "Summer Vibes", emoji: "🌞", from: 'from-amber-50', to: 'to-orange-100', darkFrom: 'dark:from-amber-900', darkTo: 'dark:to-orange-800', accent: 'text-amber-700', image: '/src/assets/calendar-june.svg' },
    6: { title: "Starry Nights", emoji: "🎆", from: 'from-indigo-50', to: 'to-purple-100', darkFrom: 'dark:from-indigo-900', darkTo: 'dark:to-purple-800', accent: 'text-indigo-700', image: '/src/assets/calendar-july.svg' },
    7: { title: "Back to Fun", emoji: "🎒", from: 'from-lime-50', to: 'to-emerald-100', darkFrom: 'dark:from-lime-900', darkTo: 'dark:to-emerald-800', accent: 'text-lime-700', image: '/src/assets/calendar-august.svg' },
    8: { title: "Autumn Leaves", emoji: "🍂", from: 'from-amber-50', to: 'to-rose-100', darkFrom: 'dark:from-amber-900', darkTo: 'dark:to-rose-800', accent: 'text-amber-800', image: '/src/assets/calendar-september.svg' },
    9: { title: "Spooky Season", emoji: "🎃", from: 'from-orange-50', to: 'to-violet-100', darkFrom: 'dark:from-orange-900', darkTo: 'dark:to-violet-800', accent: 'text-orange-700', image: '/src/assets/calendar-october.svg' },
    10:{ title: "Thanksgiving", emoji: "🦃", from: 'from-amber-50', to: 'to-brown-100', darkFrom: 'dark:from-amber-900', darkTo: 'dark:to-brown-800', accent: 'text-amber-800', image: '/src/assets/calendar-november.svg' },
    11:{ title: "Holiday Magic", emoji: "🎄", from: 'from-emerald-50', to: 'to-red-100', darkFrom: 'dark:from-emerald-900', darkTo: 'dark:to-red-800', accent: 'text-emerald-700', image: '/src/assets/calendar-december.svg' },
  };

  const monthIndex = selectedDate.getMonth();
  const theme = monthThemes[monthIndex] || monthThemes[0];
  
  const recurringMatchesDate = (chore: Chore, date: Date) => {
    if (!chore.recurring || chore.recurring === 'none') return false;
    // Only consider dates on/after the chore's start date
    const start = new Date(chore.dueDate);
    const target = new Date(date);
    if (target < start) return false;
    // Daily: every day after start
    if (chore.recurring === 'daily') return true;
    // Weekly: every 7 days from start
    if (chore.recurring === 'weekly') {
      const diffDays = Math.floor((target.setHours(0,0,0,0) as unknown as number - start.setHours(0,0,0,0) as unknown as number) / (1000 * 60 * 60 * 24));
      return diffDays % 7 === 0;
    }
    // Monthly: same day-of-month each month (simple heuristic)
    if (chore.recurring === 'monthly') {
      return target.getDate() === start.getDate();
    }
    return false;
  };

  const getChoresForDate = (date: Date) => {
    return chores.filter(chore => isSameDay(chore.dueDate, date) || recurringMatchesDate(chore, date));
  };

  const getChoresForWeek = (date: Date) => {
    const start = startOfWeek(date);
    const end = endOfWeek(date);
    return chores.filter(chore => chore.dueDate >= start && chore.dueDate <= end);
  };

  const handleAddChore = () => {
    if (newChore.title) {
      const choreData = {
        title: newChore.title!,
        description: newChore.description || '',
        completed: false,
        dueDate: newChore.dueDate || selectedDate,
        recurring: newChore.recurring || 'none',
        priority: newChore.priority || 'medium',
        category: newChore.category || 'General',
        difficulty: newChore.difficulty || 'easy',
        emoji: newChore.emoji || '✅'
      };
      
      if (onAddChore) {
        // Use parent's add chore function
        onAddChore(choreData);
      } else {
        // Fallback to local handling
        const chore: Chore = {
          id: Date.now().toString(),
          ...choreData
        };
        onChoreUpdate([...chores, chore]);
      }
      
      setNewChore({
        title: '',
        description: '',
        completed: false,
        dueDate: selectedDate,
        recurring: 'none',
        priority: 'medium',
        category: 'General',
        difficulty: 'easy',
        emoji: '✅'
      });
      setIsAddingChore(false);
    }
  };

  // Editing is delegated to parent to use the exact same dialog UI

  const handleDeleteChore = (id: string) => {
    const updatedChores = chores.filter(chore => chore.id !== id);
    onChoreUpdate(updatedChores);
  };

  const toggleChoreComplete = (chore: Chore) => {
    // If this is a recurring chore and we're viewing a date different from the original dueDate,
    // create a one-time instance for the selected date instead of toggling the template.
    if (chore.recurring && chore.recurring !== 'none' && !isSameDay(chore.dueDate, selectedDate)) {
      const instance: Chore = {
        ...chore,
        id: Date.now().toString(),
        dueDate: selectedDate,
        completed: true,
        recurring: 'none',
      };
      onChoreUpdate([...chores, instance]);
      onChoreComplete(instance);
      return;
    }

    const updatedChore = { ...chore, completed: !chore.completed };
    const updatedChores = chores.map(c => c.id === chore.id ? updatedChore : c);
    onChoreUpdate(updatedChores);
    
    if (!chore.completed) {
      onChoreComplete(updatedChore);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const selectedDayChores = getChoresForDate(selectedDate);

  return (
    <div className={`relative rounded-xl p-4 sm:p-6 bg-gradient-to-br ${theme.from} ${theme.to} overflow-hidden`}>
      {/* Themed background art - positioned in visible spaces */}
      <div className="pointer-events-none absolute inset-0 select-none">
        <div className="absolute top-6 right-6 w-32 h-32 sm:w-40 sm:h-40 opacity-30 z-0">
          <img 
            src={theme.image} 
            alt={theme.title}
            className="w-full h-full object-contain filter drop-shadow-lg"
          />
        </div>
        <div className="absolute bottom-6 left-6 w-28 h-28 sm:w-36 sm:h-36 opacity-25 z-0">
          <img 
            src={theme.image} 
            alt={theme.title}
            className="w-full h-full object-contain filter drop-shadow-md"
          />
        </div>
      </div>
      <div className="relative z-10 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className={`relative overflow-hidden lg:col-span-1 bg-gradient-to-br ${theme.from} ${theme.to} ${theme.darkFrom} ${theme.darkTo}`}>
            <CardHeader className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/20">
              <CardTitle className="flex items-center justify-between gap-2 text-gray-900 dark:text-white font-bold">
                <span className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-gray-900 dark:text-white" />
                  <span className="text-gray-900 dark:text-white">Chore Calendar</span>
                </span>
                <span className={`text-sm font-semibold ${theme.accent}`}>{theme.emoji} {theme.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative pt-6">{/* Clean calendar without watermark */}
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border pointer-events-auto bg-background/70 backdrop-blur"
                modifiers={{
                  hasChores: (date) => getChoresForDate(date).length > 0,
                  hasCompletedChores: (date) => getChoresForDate(date).some(c => c.completed),
                  hasIncompleteChores: (date) => getChoresForDate(date).some(c => !c.completed)
                }}
                modifiersStyles={{
                  hasChores: { 
                    backgroundColor: 'hsl(var(--money-light))',
                    color: 'hsl(var(--foreground))'
                  },
                  hasCompletedChores: {
                    backgroundColor: 'hsl(var(--money-green) / 0.2)',
                  },
                  hasIncompleteChores: {
                    backgroundColor: 'hsl(var(--crypto-orange) / 0.2)',
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* Daily Chores View */}
          <Card className="relative overflow-hidden lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Chores for {format(selectedDate, 'MMMM d, yyyy')}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedDayChores.length} chore{selectedDayChores.length !== 1 ? 's' : ''} scheduled
                  </p>
                </div>
                
                <Button variant="hero" size="sm" onClick={() => onRequestAddChore ? onRequestAddChore(selectedDate) : setIsAddingChore(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Chore
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="relative">{/* Clean content without watermark */}
              {selectedDayChores.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No chores scheduled for this day</p>
                  <p className="text-sm">Click "Add Chore" to create one</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDayChores.map((chore) => (
                    <Card key={chore.id} className={`transition-all duration-300 hover:scale-105 ${
                      chore.completed 
                        ? 'bg-gradient-to-r from-green-50 to-money-green/10 dark:from-green-950/20 dark:to-money-green/10 border-money-green/30' 
                        : 'hover:shadow-md border-2 border-dashed border-muted hover:border-money-green/50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleChoreComplete(chore)}
                              className={`p-0 h-8 w-8 rounded-full transition-all duration-300 ${
                                chore.completed 
                                  ? 'bg-money-green text-white scale-110' 
                                  : 'border-2 border-muted-foreground hover:border-money-green hover:scale-110'
                              }`}
                            >
                              {chore.completed && <CheckCircle className="h-5 w-5" />}
                            </Button>
                            
                            <div className="flex-1">
                              <h3 className={`font-medium ${chore.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {chore.title}
                              </h3>
                              {chore.description && (
                                <p className="text-sm text-muted-foreground mt-1">{chore.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className={getPriorityColor(chore.priority)}>
                                  {chore.priority}
                                </Badge>
                                <Badge variant="outline">{chore.category}</Badge>
                                {chore.recurring !== 'none' && (
                                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                    {chore.recurring}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onRequestEditChore && onRequestEditChore(chore)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteChore(chore.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
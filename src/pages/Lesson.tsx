import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LessonContent } from '@/components/LessonContent';
import { learningModules } from '@/data/lessons';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Lesson = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  
  // Safely parse moduleId with error handling
  const parsedModuleId = moduleId ? parseInt(moduleId, 10) : NaN;
  const module = !isNaN(parsedModuleId) 
    ? learningModules.find(m => m.id === parsedModuleId)
    : null;
  
  if (!module) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Module Not Found</h1>
          <Button onClick={() => navigate('/learn')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Learning
          </Button>
        </div>
      </div>
    );
  }

  const handleComplete = () => {
    // In a real app, you'd save progress to a database
    alert(`Congratulations! You completed ${module.title}!`);
    navigate('/learn');
  };

  return (
    <LessonContent
      moduleId={module.id}
      moduleName={module.title}
      lessons={module.lessons}
      onComplete={handleComplete}
    />
  );
};

export default Lesson;
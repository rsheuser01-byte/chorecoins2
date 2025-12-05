-- Create chores table for tracking user chores
CREATE TABLE public.chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  value NUMERIC NOT NULL DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own chores"
  ON public.chores
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chores"
  ON public.chores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chores"
  ON public.chores
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chores"
  ON public.chores
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_chores_updated_at
  BEFORE UPDATE ON public.chores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
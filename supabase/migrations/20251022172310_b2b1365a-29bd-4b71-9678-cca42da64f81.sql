-- Create table for Alpaca connections
CREATE TABLE public.alpaca_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id TEXT,
  account_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  portfolio_value NUMERIC DEFAULT 0,
  buying_power NUMERIC DEFAULT 0,
  cash NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alpaca_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own Alpaca connections"
ON public.alpaca_connections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Alpaca connections"
ON public.alpaca_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Alpaca connections"
ON public.alpaca_connections
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Alpaca connections"
ON public.alpaca_connections
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_alpaca_connections_updated_at
BEFORE UPDATE ON public.alpaca_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
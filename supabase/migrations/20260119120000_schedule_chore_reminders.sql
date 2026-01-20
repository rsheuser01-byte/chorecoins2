-- Schedule chore reminder push notifications every 15 minutes
-- Requires pg_cron and supabase_functions http_request

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
begin
  begin
    perform cron.unschedule('send-chore-reminders');
  exception when others then
    -- ignore if the job does not exist
    null;
  end;

  perform cron.schedule(
    'send-chore-reminders',
    '*/15 * * * *',
    $cron$
    select
      supabase_functions.http_request(
        'POST',
        'https://fzlvrgmphdbupwqdiowl.functions.supabase.co/send-chore-reminders',
        '{"Content-Type":"application/json"}',
        '{}'
      );
    $cron$
  );
end $$;

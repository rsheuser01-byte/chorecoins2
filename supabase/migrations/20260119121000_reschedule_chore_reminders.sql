-- Reschedule chore reminder push notifications to run every minute

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
begin
  begin
    perform cron.unschedule('send-chore-reminders');
  exception when others then
    null;
  end;

  perform cron.schedule(
    'send-chore-reminders',
    '* * * * *',
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

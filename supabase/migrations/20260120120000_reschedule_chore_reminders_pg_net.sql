-- Reschedule chore reminder push notifications using pg_net http_post

create extension if not exists pg_cron with schema pg_catalog;
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
      net.http_post(
        url := 'https://fzlvrgmphdbupwqdiowl.functions.supabase.co/send-chore-reminders',
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := '{}'::jsonb
      );
    $cron$
  );
end $$;

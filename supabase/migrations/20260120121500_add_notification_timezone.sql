-- Add timezone info for reminder scheduling

alter table public.notification_preferences
  add column if not exists timezone_offset_minutes integer default 0,
  add column if not exists timezone text;

update public.notification_preferences
set timezone_offset_minutes = 0
where timezone_offset_minutes is null;

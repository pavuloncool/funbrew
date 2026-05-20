-- Legacy backup before hard removal of `/tag` runtime flow.
-- Keeps a static snapshot of legacy rows for historical/debug needs.

create schema if not exists archive;

create table if not exists archive.roaster_coffee_tags_20260509
as
select *
from public.roaster_coffee_tags;

comment on table archive.roaster_coffee_tags_20260509 is
  'Snapshot of public.roaster_coffee_tags taken during hard decommission of legacy /tag flow.';

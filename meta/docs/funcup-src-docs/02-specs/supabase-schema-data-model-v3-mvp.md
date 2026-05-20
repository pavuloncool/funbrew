---
# yaml-language-server: $schema=schemas/page.schema.json
Object type:
    - Page
Backlinks:
    - funcup-the-first-structured-feedback-loop-4-co.md
Creation date: "2026-03-13T18:45:00Z"
Created by:
    - Pa Koolig
id: bafyreiavvjkg3yuox77yovisegabs6vn4gy5bvhcjfhjkutjqsl5cnuvzm
---
# Supabase Schema (Data Model v3 MVP)   
- - =========================================================
-- funcup — PostgreSQL / Supabase Schema (Data Model v3 MVP)
-- =========================================================   
- - Extensions
create extension if not exists "uuid-ossp";   
- - =========================================================
-- USERS
-- =========================================================
create table users (
id uuid primary key default uuid\_generate\_v4(),
username text unique not null,
email text unique not null,
avatar\_url text,
reputation\_level integer default 1,
created\_at timestamp with time zone default now()
);   
- - =========================================================
-- ROASTERS
-- =========================================================
create table roasters (
id uuid primary key default uuid\_generate\_v4(),
name text not null,
website text,
country text,
city text,
description text,
verified boolean default false,
created\_at timestamp with time zone default now()
);   
- - =========================================================
-- ORIGINS
-- =========================================================
create table origins (
id uuid primary key default uuid\_generate\_v4(),
country text not null,
region text,
farm text,
altitude integer,
created\_at timestamp with time zone default now()
);   
- - =========================================================
-- COFFEES
-- =========================================================
create table coffees (
id uuid primary key default uuid\_generate\_v4(),
roaster\_id uuid references roasters(id) on delete cascade,
origin\_id uuid references origins(id),
name text not null,
variety text,
process text,
harvest\_year integer,
description text,
created\_at timestamp with time zone default now()
);   
- - =========================================================
-- ROAST BATCHES
-- =========================================================
create table roast\_batches (
id uuid primary key default uuid\_generate\_v4(),
coffee\_id uuid references coffees(id) on delete cascade,
roast\_date date,
roast\_level text,
batch\_code text,
created\_at timestamp with time zone default now()
);   
- - =========================================================
-- QR CODES
-- =========================================================
create table qr\_codes (
id uuid primary key default uuid\_generate\_v4(),
batch\_id uuid references roast\_batches(id) on delete cascade,
qr\_hash text unique not null,
created\_at timestamp with time zone default now()
);   
- - =========================================================
-- BREW METHODS
-- =========================================================
create table brew\_methods (
id uuid primary key default uuid\_generate\_v4(),
name text unique not null,
category text
);   
- - =========================================================
-- FLAVOR NOTES
-- =========================================================
create table flavor\_notes (
id uuid primary key default uuid\_generate\_v4(),
name text unique not null,
category text,
level integer default 1
);   
- - =========================================================
-- COFFEE LOGS
-- =========================================================
create table coffee\_logs (
id uuid primary key default uuid\_generate\_v4(),
user\_id uuid references users(id) on delete cascade,
coffee\_id uuid references coffees(id),
qr\_code\_id uuid references qr\_codes(id),
brew\_method\_id uuid references brew\_methods(id),
rating integer check (rating >= 1 and rating <= 5),
logged\_at timestamp with time zone default now()
);   
- - =========================================================
-- TASTING NOTES (JOIN TABLE)
-- =========================================================
create table tasting\_notes (
id uuid primary key default uuid\_generate\_v4(),
coffee\_log\_id uuid references coffee\_logs(id) on delete cascade,
flavor\_note\_id uuid references flavor\_notes(id) on delete cascade
);   
- - =========================================================
-- REVIEWS
-- =========================================================
create table reviews (
id uuid primary key default uuid\_generate\_v4(),
coffee\_log\_id uuid references coffee\_logs(id) on delete cascade,
user\_id uuid references users(id),
text text,
helpful\_count integer default 0,
created\_at timestamp with time zone default now()
);   
- - =========================================================
-- REVIEW VOTES
-- =========================================================
create table review\_votes (
id uuid primary key default uuid\_generate\_v4(),
review\_id uuid references reviews(id) on delete cascade,
user\_id uuid references users(id),
vote\_type text check (vote\_type in ('helpful','not\_helpful')),
created\_at timestamp with time zone default now()
);   
- - =========================================================
-- COFFEE STATS (AGGREGATED TABLE)
-- =========================================================
create table coffee\_stats (
coffee\_id uuid primary key references coffees(id) on delete cascade,
average\_rating numeric(3,2),
log\_count integer default 0,
top\_flavor\_notes jsonb,
last\_updated timestamp with time zone default now()
);   
- - =========================================================
-- INDEXES
-- =========================================================   
   
create index idx\_coffee\_logs\_user on coffee\_logs(user\_id);
create index idx\_coffee\_logs\_coffee on coffee\_logs(coffee\_id);
create index idx\_qr\_hash on qr\_codes(qr\_hash);
create index idx\_reviews\_coffee\_log on reviews(coffee\_log\_id);
create index idx\_tasting\_notes\_log on tasting\_notes(coffee\_log\_id);   
- - =========================================================
-- COMMENTS / ARCHITECTURE NOTES
-- =========================================================   
- - 1. coffee\_stats is an aggregated table used for discovery queries.
-- It should be updated asynchronously via edge functions or cron jobs.   
- - 2. tasting\_notes is a join table enabling many-to-many relationships
-- between coffee\_logs and flavor\_notes.   
- - 3. qr\_hash must be indexed and unique because it is used by the scan endpoint.   
- - 4. reputation\_level in users supports progressive unlocking of sensory vocabulary.   
- - 5. rating uses a constrained integer (1–5) to simplify aggregation.   
- - 6. roast\_batches allow multiple physical roasts of the same coffee product.   
- - 7. qr\_codes point to roast\_batches instead of coffees to preserve roasting precision.   
- - 8. this schema is optimized for MVP simplicity while remaining compatible with:
-- • Supabase Row Level Security
-- • analytics queries
-- • future recommendation systems.   
- - 9. expected MVP table count: 13
-- which keeps schema manageable while covering identity, experience, and discovery.   
   
   
# Jedna rzecz, którą dopiszemy w przyszłości (ale nie w MVP)   
Te tabele pojawią się później:   
```
farms
varieties
brew_recipes
coffee_shops
recommendations
```
 **MVP ich nie potrzebuje**.   

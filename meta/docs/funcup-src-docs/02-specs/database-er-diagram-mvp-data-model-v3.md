---
# yaml-language-server: $schema=schemas/page.schema.json
Object type:
    - Page
Backlinks:
    - funcup-the-first-structured-feedback-loop-4-co.md
Creation date: "2026-03-13T18:51:00Z"
Created by:
    - Pa Koolig
id: bafyreiftvyfmopfvhw3rubpy24kedcqol5n4lrjalc5cmfdochuemo2klu
---
# Database ER Diagram (MVP / Data Model v3)   
# **Purpose**   
This document defines the **Entity-Relationship Diagram for the funcup database**.   
It is compatible with:   
- Supabase   
- PostgreSQL   
- dbdiagram.io   
- Prisma schema planning   
   
The diagram reflects **Data Model v3 (MVP)** and matches the SQL schema already defined.   
 --- 
# ER Diagram (dbdiagram compatible)   
```
Table users {
  id uuid [pk]
  username text
  email text
  avatar_url text
  reputation_level int
  created_at timestamp
}

Table roasters {
  id uuid [pk]
  name text
  website text
  country text
  city text
  description text
  verified boolean
  created_at timestamp
}

Table origins {
  id uuid [pk]
  country text
  region text
  farm text
  altitude int
  created_at timestamp
}

Table coffees {
  id uuid [pk]
  roaster_id uuid
  origin_id uuid
  name text
  variety text
  process text
  harvest_year int
  description text
  created_at timestamp
}

Table roast_batches {
  id uuid [pk]
  coffee_id uuid
  roast_date date
  roast_level text
  batch_code text
  created_at timestamp
}

Table qr_codes {
  id uuid [pk]
  batch_id uuid
  qr_hash text
  created_at timestamp
}

Table brew_methods {
  id uuid [pk]
  name text
  category text
}

Table flavor_notes {
  id uuid [pk]
  name text
  category text
  level int
}

Table coffee_logs {
  id uuid [pk]
  user_id uuid
  coffee_id uuid
  qr_code_id uuid
  brew_method_id uuid
  rating int
  logged_at timestamp
}

Table tasting_notes {
  id uuid [pk]
  coffee_log_id uuid
  flavor_note_id uuid
}

Table reviews {
  id uuid [pk]
  coffee_log_id uuid
  user_id uuid
  text text
  helpful_count int
  created_at timestamp
}

Table review_votes {
  id uuid [pk]
  review_id uuid
  user_id uuid
  vote_type text
  created_at timestamp
}

Table coffee_stats {
  coffee_id uuid [pk]
  average_rating numeric
  log_count int
  top_flavor_notes jsonb
  last_updated timestamp
}

Ref: coffees.roaster_id > roasters.id
Ref: coffees.origin_id > origins.id

Ref: roast_batches.coffee_id > coffees.id

Ref: qr_codes.batch_id > roast_batches.id

Ref: coffee_logs.user_id > users.id
Ref: coffee_logs.coffee_id > coffees.id
Ref: coffee_logs.qr_code_id > qr_codes.id
Ref: coffee_logs.brew_method_id > brew_methods.id

Ref: tasting_notes.coffee_log_id > coffee_logs.id
Ref: tasting_notes.flavor_note_id > flavor_notes.id

Ref: reviews.coffee_log_id > coffee_logs.id
Ref: reviews.user_id > users.id

Ref: review_votes.review_id > reviews.id
Ref: review_votes.user_id > users.id

Ref: coffee_stats.coffee_id > coffees.id
```
 --- 
# Visual Relationship Overview   
### Product Identity Layer   
```
Roaster
   │
   └── Coffee
          │
          └── Roast Batch
                  │
                  └── QR Code
```
This layer creates **unique digital identity for each coffee package**.   
 --- 
### Consumer Experience Layer   
```
User
   │
   └── Coffee Log
          │
          ├── Review
          │       │
          │       └── Review Votes
          │
          ├── Brew Method
          │
          └── Tasting Notes
                  │
                  └── Flavor Notes
```
This layer records **how consumers experience coffee**.   
 --- 
### Discovery & Analytics Layer   
```
Coffee Logs
Reviews
Tasting Notes
        │
        ▼
   Coffee Stats
```
This layer powers:   
- discovery feeds   
- trending coffees   
- roaster analytics.   
 --- 
   
# Key Structural Principles   
### 1. Product identity precision   
```
Roaster → Coffee → Roast Batch → QR
```
This ensures the platform can identify **specific roasted coffee lots**.   
 --- 
### 2. Experience-centered data   
All consumer interactions revolve around:   
```
Coffee Log
```
This entity is the **behavioral core of the platform**.   
 --- 
### 3. Controlled sensory vocabulary   
Flavor descriptors are normalized through:   
```
flavor_notes
tasting_notes
```
This enables:   
- aggregation   
- discovery   
- future AI taste modeling.   
 --- 
   
### 4. Aggregated discovery layer   
The table:   
```
coffee_stats
```
stores **precomputed discovery metrics**, preventing expensive live queries.   
 --- 
# Diagram Import Instructions   
Developers can import the DBML diagram directly into:   
### dbdiagram   
[https://dbdiagram.io](https://dbdiagram.io)   
Paste the DBML code to generate the visual ER diagram.   
 --- 
### Supabase   
Use the SQL schema previously generated and create relationships matching this diagram.   
 --- 
### Prisma   
Each table maps directly to a Prisma model.   
 --- 
# Diagram Scope   
This ER model covers **MVP functionality only**.   
Future versions may introduce:   
```
farms
varieties
brew_recipes
coffee_shops
recommendations
```
 --- 
# Guiding Principle   
The funcup database is built around one central rule:   
```
Every coffee has an identity.
Every user experience becomes data.
That data powers discovery.
```
This structure allows funcup to evolve into a **global dataset of real coffee experiences**.   

---
# yaml-language-server: $schema=schemas/page.schema.json
Object type:
    - Page
Backlinks:
    - funcup-the-first-structured-feedback-loop-4-co.md
Creation date: "2026-03-13T18:40:00Z"
Created by:
    - Pa Koolig
id: bafyreid5bsgtox43mz7bxjf7fnsuqzb3qbbcj45srgeig3snoyupvapz5y
---
# ├ 07 Technical Architecture Blueprint (MVP)   
# **Purpose:**   
Define the technical architecture of the funcup platform for the MVP phase.   
The architecture must satisfy the following constraints:   
- **mobile-first**   
- **low operational cost**   
- **scalable**   
- **free tier friendly**   
- **simple enough for a small startup team**   
   
The stack is designed to run **without AWS or enterprise infrastructure** and remain free until meaningful usage appears.   
 --- 
# 1. Architecture Principles   
The system follows four key principles.   
### 1. Mobile-first architecture   
The primary client is the **mobile application**.   
```
Mobile App
↓
API
↓
Database
```
Desktop interfaces (roaster dashboard) are secondary.   
 --- 
### 2. Serverless-first infrastructure   
Where possible, the system uses **serverless services**.   
Benefits:   
- zero server maintenance   
- automatic scaling   
- lower cost   
- faster development.   
 --- 
   
### 3. PostgreSQL as single source of truth   
All platform data is stored in **PostgreSQL**.   
Reasons:   
- relational structure fits coffee data   
- strong analytics capability   
- compatibility with Supabase.   
 --- 
   
### 4. API-driven architecture   
All clients communicate through a **single API layer**.   
Clients:   
```
Mobile App
Roaster Dashboard
Admin Panel
```
 --- 
# 2. High-Level System Architecture   
```
Mobile App (React Native)
        │
        ▼
API Layer (Supabase / Edge Functions)
        │
        ▼
PostgreSQL Database
        │
        ├── Storage (images, QR)
        └── Analytics layer
```
 --- 
# 3. Frontend Layer   
## Mobile Application   
Primary interface of the platform.   
Technology:   
```
React Native
Expo
TypeScript
```
Reasons:   
- cross-platform (iOS + Android)   
- fast iteration   
- strong ecosystem.   
   
Core features implemented in mobile:   
- QR scanning   
- Coffee Hub   
- Coffee page   
- Logging coffee   
- Discovery.   
 --- 
   
## Roaster Dashboard   
Used by roasters to manage coffees.   
Technology:   
```
Next.js
React
TypeScript
```
Features:   
- create coffee   
- create roast batch   
- generate QR codes   
- update coffee page   
- view analytics.   
 --- 
   
# 4. Backend Layer   
Backend uses **Supabase**, which provides:   
```
PostgreSQL database
Authentication
Storage
Edge Functions
Row-level security
```
Advantages:   
- free tier available   
- open-source stack   
- strong developer ecosystem.   
 --- 
   
## Supabase Components   
### Database   
PostgreSQL database implementing **Data Model v3**.   
Tables include:   
```
users
roasters
origins
coffees
roast_batches
qr_codes
coffee_logs
reviews
flavor_notes
tasting_notes
brew_methods
review_votes
coffee_stats
```
 --- 
### Authentication   
Handled by **Supabase Auth**.   
Supported methods:   
```
email + password
magic link
OAuth (future)
```
Authentication issues **JWT tokens** used by the API.   
 --- 
### Storage   
Used for:   
```
roaster images
coffee photos
QR code files
user avatars
```
Storage structure:   
```
storage/
 ├ roasters/
 ├ coffees/
 ├ users/
 └ qr/
```
 --- 
### Edge Functions   
Serverless functions used for:   
- QR scan resolution   
- analytics updates   
- statistics aggregation   
- moderation.   
   
Example:   
```
scan_qr()
update_coffee_stats()
generate_qr()
```
 --- 
# 5. QR System   
The QR system is a critical infrastructure component.   
Each QR contains:   
```
https://funcup.app/q/{qr_hash}
```
Process:   
```
scan QR
↓
resolve qr_hash
↓
retrieve roast_batch
↓
retrieve coffee
↓
return coffee page
```
QR codes are generated in the **roaster dashboard**.   
 --- 
# 6. Discovery Engine   
Discovery features rely on aggregated statistics.   
Examples:   
```
trending coffees
top rated coffees
popular roasters
```
These are calculated via:   
- scheduled jobs   
- edge functions   
- materialized views.   
 --- 
   
# 7. Security   
Security mechanisms include:   
### Row-Level Security (RLS)   
Supabase enforces permissions at database level.   
Example:   
```
users can edit their own logs
roasters can edit their coffees
admins moderate content
```
 --- 
### Verified Roasters   
Roaster accounts require verification before:   
- creating coffees   
- generating QR codes.   
 --- 
   
### Rate Limiting   
Important endpoints:   
```
scan endpoint
review creation
coffee logging
```
Rate limiting protects the system from abuse.   
 --- 
# 8. Analytics Layer   
Analytics is built on top of PostgreSQL data.   
Examples:   
```
coffee popularity
flavor distribution
brew method statistics
roaster insights
```
Future integrations may include:   
```
PostHog
Metabase
Supabase Analytics
```
 --- 
# 9. Infrastructure Diagram   
Simplified architecture diagram:   
```
             Mobile App
          (React Native)
                 │
                 ▼
          API / Edge Layer
          (Supabase Functions)
                 │
                 ▼
            PostgreSQL
                 │
        ┌────────┴─────────┐
        │                  │
     Storage           Analytics
```
 --- 
# 10. Scaling Strategy   
The MVP architecture scales naturally.   
Scaling stages:   
### Stage 1   
```
Supabase free tier
```
Supports:   
- early users   
- beta testing   
- prototype phase.   
 --- 
   
### Stage 2   
Upgrade to:   
```
Supabase Pro
```
Supports:   
- tens of thousands of users.   
 --- 
   
### Stage 3   
Potential future architecture:   
```
PostgreSQL cluster
CDN
microservices
```
Only necessary after large growth.   
 --- 
# 11. Deployment   
Deployment pipeline:   
```
GitHub
↓
CI/CD
↓
Supabase
↓
Expo build
↓
App Store / Google Play
```
 --- 
# 12. Guiding Principle   
The technical architecture of funcup follows one simple rule:   
```
Keep the system simple.
Keep the system scalable.
Keep the system inexpensive.
```
This architecture allows funcup to launch quickly while remaining capable of supporting a global coffee discovery platform.   

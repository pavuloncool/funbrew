---
# yaml-language-server: $schema=schemas/page.schema.json
Object type:
    - Page
Backlinks:
    - funcup-the-first-structured-feedback-loop-4-co.md
Creation date: "2026-03-13T18:32:00Z"
Created by:
    - Pa Koolig
id: bafyreibva23jxead6inwdezjlijr2eztp7bh6pbcv4mcburji74xznkewa
---
# ├ 06 API Specification (MVP)   
# **Purpose:**   
Define the API contract between the mobile application, roaster dashboard, and the backend system.   
This document describes the **core endpoints required for the MVP**, aligned with:   
- Information Architecture   
- Data Model v3   
- Mobile-first UX (Scan → Discover → Log)   
   
The API follows **REST principles** and is designed for:   
- JSON responses   
- token-based authentication   
- Supabase/PostgreSQL backend.   
 --- 
   
# 1. API Design Principles   
### Mobile-first   
Endpoints are optimized for the mobile app interaction flow:   
```
scan → coffee page → log → review
```
 --- 
### Entity-based   
Endpoints map directly to core platform entities:   
```
users
coffees
roasters
coffee_logs
reviews
```
 --- 
### Lightweight responses   
Mobile responses should remain compact to reduce latency and bandwidth.   
 --- 
# 2. Authentication   
Authentication uses **JWT tokens**.   
Base endpoint:   
```
POST /auth/login
POST /auth/register
POST /auth/logout
GET /auth/me
```
 --- 
## Register User   
```
POST /auth/register
```
Request:   
```
{
  "username": "jan",
  "email": "jan@example.com",
  "password": "securepassword"
}
```
Response:   
```
{
  "user_id": "uuid",
  "token": "jwt_token"
}
```
 --- 
## Login   
```
POST /auth/login
```
Request:   
```
{
  "email": "jan@example.com",
  "password": "password"
}
```
Response:   
```
{
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "username": "jan"
  }
}
```
 --- 
# 3. Coffee Scanning   
This is the **core endpoint of the entire system**.   
 --- 
## Scan Coffee   
```
GET /scan/{qr_hash}
```
Purpose:   
Resolve a QR code into a coffee product page.   
Response:   
```
{
  "coffee": {
    "id": "coffee_uuid",
    "name": "Ethiopia Yirgacheffe",
    "roaster": "La Cabra",
    "origin": {
      "country": "Ethiopia",
      "region": "Yirgacheffe"
    },
    "process": "Washed",
    "variety": "Heirloom"
  },
  "batch": {
    "roast_date": "2026-03-10",
    "roast_level": "Light"
  },
  "stats": {
    "average_rating": 4.3,
    "log_count": 128
  }
}
```
 --- 
# 4. Coffee Endpoints   
 --- 
## Get Coffee   
```
GET /coffees/{id}
```
Returns the full coffee product page.   
Response includes:   
- product data   
- origin   
- roaster   
- statistics.   
 --- 
   
## Discover Coffees   
```
GET /coffees/discover
```
Query parameters:   
```
?sort=trending
?origin=ethiopia
?roaster=la-cabra
```
Response:   
```
{
  "coffees": []
}
```
 --- 
## Trending Coffees   
```
GET /coffees/trending
```
Used by the **Coffee Hub discovery section**.   
 --- 
# 5. Roaster Endpoints   
 --- 
## Get Roaster   
```
GET /roasters/{id}
```
Response:   
```
{
  "name": "La Cabra",
  "country": "Denmark",
  "coffees": []
}
```
 --- 
## Roaster Coffees   
```
GET /roasters/{id}/coffees
```
Returns coffees produced by the roaster.   
 --- 
# 6. Coffee Logging   
Logging a coffee is the **core behavioral action of the platform**.   
 --- 
## Log Coffee   
```
POST /coffee-logs
```
Request:   
```
{
  "coffee_id": "uuid",
  "qr_code_id": "uuid",
  "brew_method_id": "uuid",
  "rating": 4,
  "flavor_notes": ["peach", "jasmine"]
}
```
Response:   
```
{
  "coffee_log_id": "uuid",
  "status": "created"
}
```
 --- 
## User Coffee Logs   
```
GET /users/{id}/coffee-logs
```
Returns the user’s tasting history.   
 --- 
# 7. Reviews   
 --- 
## Create Review   
```
POST /reviews
```
Request:   
```
{
  "coffee_log_id": "uuid",
  "text": "Bright acidity with floral notes"
}
```
 --- 
## Get Coffee Reviews   
```
GET /coffees/{id}/reviews
```
Response:   
```
{
  "reviews": []
}
```
 --- 
# 8. Flavor Notes   
 --- 
## List Flavor Notes   
```
GET /flavor-notes
```
Response:   
```
{
  "notes": [
    {"id":1,"name":"chocolate"},
    {"id":2,"name":"peach"},
    {"id":3,"name":"jasmine"}
  ]
}
```
 --- 
# 9. Brew Methods   
 --- 
## List Brew Methods   
```
GET /brew-methods
```
Response:   
```
{
  "methods": [
    "Espresso",
    "V60",
    "Aeropress"
  ]
}
```
 --- 
# 10. Review Voting   
 --- 
## Vote Review Helpful   
```
POST /reviews/{id}/vote
```
Request:   
```
{
  "vote": "helpful"
}
```
These votes influence the **reputation system**.   
 --- 
# 11. Discovery API   
Used by the **Coffee Hub home screen**.   
 --- 
## Coffee Hub Feed   
```
GET /feed
```
Response example:   
```
{
  "trending_coffees": [],
  "recommended_roasters": [],
  "recent_reviews": []
}
```
 --- 
# 12. Roaster Dashboard API   
Used by the **roaster desktop interface**.   
 --- 
## Create Coffee   
```
POST /roaster/coffees
```
 --- 
## Create Roast Batch   
```
POST /roaster/batches
```
 --- 
## Generate QR Code   
```
POST /roaster/qr
```
Response:   
```
{
  "qr_hash": "abc123",
  "qr_url": "https://funcup.app/q/abc123"
}
```
 --- 
# 13. Rate Limits   
To prevent abuse:   
```
scan endpoint → unlimited
logging endpoint → 60/min
review endpoint → 30/min
```
 --- 
# 14. Future API Extensions   
Future endpoints may include:   
```
recommendations
coffee maps
brew recipes
AI taste profiles
```
 --- 
# 15. Guiding Principle   
The funcup API is designed around one fundamental interaction:   
```
scan coffee → understand coffee → log experience
```
Every endpoint supports this core user journey.   

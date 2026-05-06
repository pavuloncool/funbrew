# 05 Data Model v3 (MVP)   
**Purpose:**   
Define the relational database structure for the funcup platform MVP.   
This model translates the **Information Architecture** into a concrete schema that backend developers can implement.   
The model is designed for:   
- PostgreSQL   
- Supabase backend   
- mobile-first architecture   
- scalability for future analytics.   
 --- 
   
# 1. Data Model Principles   
The funcup database follows several guiding principles.   
### Product identity first   
Coffee identity is structured as:   
```
Roaster → Coffee → Roast Batch → QR Code
```
This ensures that **each physical coffee bag can be uniquely identified**.   
 --- 
### Experience-driven data   
Consumer data is structured around **coffee logs**:   
```
User → Coffee Log → Flavor Notes / Review / Brew Method
```
The coffee log represents the **moment of consumption**.   
 --- 
### Structured sensory data   
Flavor descriptors and brew methods use **controlled vocabularies** rather than free text.   
This allows:   
- aggregation   
- analytics   
- discovery features.   
 --- 
   
# 2. Core Tables   
## users   
Represents registered users.   
Fields:   
```
id (uuid)
username
email
created_at
reputation_level
avatar_url
```
Relationships:   
- one user → many coffee\_logs   
- one user → many reviews   
 --- 
   
## roasters   
Represents verified coffee roasting companies.   
Fields:   
```
id (uuid)
name
website
country
city
description
verified
created_at
```
Relationships:   
- one roaster → many coffees   
 --- 
   
## origins   
Represents coffee origin information.   
Fields:   
```
id (uuid)
country
region
farm
altitude
```
Relationships:   
- one origin → many coffees   
 --- 
   
## coffees   
Represents a specific coffee product released by a roaster.   
Fields:   
```
id (uuid)
roaster_id
origin_id
name
variety
process
harvest_year
description
created_at
```
Relationships:   
- coffee → belongs to roaster   
- coffee → belongs to origin   
- coffee → many roast\_batches   
 --- 
   
## roast\_batches   
Represents a specific roasting batch.   
Fields:   
```
id (uuid)
coffee_id
roast_date
roast_level
batch_code
created_at
```
Relationships:   
- one batch → one coffee   
- one batch → many qr\_codes   
 --- 
   
## qr\_codes   
Represents QR identifiers printed on packaging.   
Fields:   
```
id (uuid)
batch_id
qr_hash
created_at
```
Relationships:   
- qr\_code → belongs to roast\_batch   
- qr\_code → may generate coffee\_logs   
 --- 
   
# 3. Experience Tables   
## coffee\_logs   
Represents the act of a user drinking a coffee.   
Fields:   
```
id (uuid)
user_id
coffee_id
qr_code_id
brew_method_id
rating
logged_at
```
Relationships:   
- log → belongs to user   
- log → belongs to coffee   
- log → belongs to brew method   
 --- 
   
## reviews   
Represents textual feedback.   
Fields:   
```
id (uuid)
coffee_log_id
user_id
text
helpful_count
created_at
```
Relationships:   
- review → belongs to coffee\_log   
- review → belongs to user   
 --- 
   
# 4. Sensory System Tables   
## flavor\_notes   
Controlled vocabulary of tasting descriptors.   
Fields:   
```
id (uuid)
name
category
level
```
Example categories:   
```
fruit
sweet
floral
nutty
chocolate
spice
```
 --- 
## tasting\_notes   
Join table connecting logs and flavor notes.   
Fields:   
```
id (uuid)
coffee_log_id
flavor_note_id
```
Relationships:   
- many tasting\_notes → one coffee\_log   
- many tasting\_notes → one flavor\_note   
 --- 
   
# 5. Brewing Tables   
## brew\_methods   
Represents brewing techniques.   
Fields:   
```
id (uuid)
name
category
```
Examples:   
```
Espresso
V60
Aeropress
French Press
```
Relationships:   
- brew\_method → many coffee\_logs   
 --- 
   
# 6. Reputation System   
## review\_votes   
Tracks helpfulness votes.   
Fields:   
```
id (uuid)
review_id
user_id
vote_type
created_at
```
vote\_type values:   
```
helpful
not_helpful
```
These votes feed the **reputation system** that unlocks advanced sensory levels.   
 --- 
# 7. Aggregation Tables   
## coffee\_stats   
Precomputed statistics for discovery.   
Fields:   
```
coffee_id
average_rating
log_count
top_flavor_notes
last_updated
```
These statistics power:   
- trending coffees   
- discovery feeds   
- roaster analytics.   
 --- 
   
# 8. Relationship Diagram (Simplified)   
```
Roasters
   │
   └── Coffees
          │
          └── Roast_Batches
                  │
                  └── QR_Codes
                          │
                          └── Coffee_Logs
                                   │
                                   ├── Reviews
                                   ├── Tasting_Notes
                                   └── Brew_Method
```
User data:   
```
Users
   │
   └── Coffee_Logs
           │
           └── Reviews
                    │
                    └── Review_Votes
```
 --- 
# 9. MVP Scope   
The MVP version focuses on the minimum viable dataset required to enable:   
```
scan coffee
log experience
rate coffee
discover coffees
```
Core MVP tables:   
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
Future versions may expand the model to include:   
- farms   
- varietal taxonomy   
- brewing recipes   
- coffee shop integration   
- recommendation models.   
 --- 
   
# 10. Guiding Principle   
The funcup data model follows a simple rule:   
```
Coffee identity must be precise.
Consumer experience must be structured.
Discovery must be data-driven.
```
This structure enables funcup to become a **global dataset of real coffee experiences**.   

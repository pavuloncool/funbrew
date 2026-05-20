---
# yaml-language-server: $schema=schemas/page.schema.json
Object type:
    - Page
Backlinks:
    - funcup-the-first-structured-feedback-loop-4-co.md
Creation date: "2026-03-13T18:19:00Z"
Created by:
    - Pa Koolig
id: bafyreih3xj5xqzdw536o3vlesffeexvm3ni5zos2nczgumembvm3zmpifu
---
# ├ 04 Information Architecture   
# **Purpose:**   
Define the structure of all information entities within the funcup platform.   
This document describes **what types of objects exist in the system, how they relate conceptually, and how information flows between them**.   
This architecture serves as the conceptual layer above the **Data Model v3**, which later defines the relational database structure.   
 --- 
# 1. Core Concept   
funcup organizes the world of coffee into a **structured knowledge system** composed of four main domains:   
```
Products
People
Experiences
Knowledge
```
Each domain represents a different layer of information within the platform.   
 --- 
# 2. Domain Overview   
## Products   
Represents the physical coffee products that users drink.   
Key entities:   
```
Coffee
Roast Batch
QR Code
Origin
```
Products form the **core identity layer of the platform**.   
 --- 
## People   
Represents the actors participating in the system.   
Key entities:   
```
Roaster
Consumer
```
Consumers generate experience data, while roasters generate product data.   
 --- 
## Experiences   
Represents the real-world interaction between a user and a coffee.   
Key entities:   
```
Coffee Log
Review
Tasting Notes
```
This domain captures **how coffee is actually experienced by consumers**.   
 --- 
## Knowledge   
Represents structured descriptors used to interpret coffee.   
Key entities:   
```
Flavor Notes
Brew Methods
Coffee Statistics
```
These elements help transform individual experiences into **aggregated knowledge**.   
 --- 
# 3. Core Entities   
Below are the primary information objects within the platform.   
 --- 
# Coffee   
Represents a specific coffee product released by a roaster.   
Attributes may include:   
- name   
- roaster   
- origin   
- variety   
- process   
- harvest year   
- description   
   
Coffee is the **central product entity** within the system.   
 --- 
# Roast Batch   
Represents a specific roasting instance of a coffee.   
Because coffee is produced in batches, multiple roast batches may exist for the same coffee.   
Attributes:   
- roast date   
- roast level   
- batch identifier.   
 --- 
   
# QR Code   
Represents the digital identifier printed on a coffee package.   
Each QR code points to a **specific roast batch**.   
This mechanism connects the physical product to the digital platform.   
 --- 
# Roaster   
Represents a coffee roasting company.   
Attributes may include:   
- name   
- location   
- website   
- description   
- verification status.   
   
Roasters create coffees and manage product data.   
 --- 
# Origin   
Represents the geographical and agricultural source of a coffee.   
Attributes may include:   
- country   
- region   
- farm   
- altitude.   
   
Origin data provides transparency into the coffee supply chain.   
 --- 
# Consumer   
Represents a registered platform user.   
Attributes may include:   
- username   
- profile   
- tasting history   
- reputation level.   
   
Consumers generate experience data within the platform.   
 --- 
# Coffee Log   
Represents the act of a user drinking and logging a coffee.   
Attributes include:   
- coffee   
- brew method   
- rating   
- date.   
   
Coffee Logs form the **core behavioral data of the system**.   
 --- 
# Review   
Represents a textual description of a coffee experience written by a user.   
Attributes:   
- comment   
- user   
- coffee log   
- timestamp.   
   
Reviews provide qualitative feedback.   
 --- 
# Flavor Notes   
Represents descriptors used to describe coffee taste.   
Examples include:   
```
chocolate
peach
jasmine
citrus
```
Flavor notes are selected by users when logging a coffee.   
 --- 
# Tasting Notes   
Represents the relationship between a **coffee log** and the flavor notes selected by the user.   
This entity captures the **perceived sensory profile of a coffee experience**.   
 --- 
# Brew Methods   
Represents the brewing technique used to prepare coffee.   
Examples:   
```
V60
Espresso
Aeropress
French Press
```
Brewing method influences the perceived flavor profile.   
 --- 
# Coffee Statistics   
Represents aggregated community data about a coffee.   
Attributes may include:   
- average rating   
- number of logs   
- most common flavor notes.   
   
This entity powers discovery and ranking features.   
 --- 
# 4. Information Relationships   
The conceptual relationships between entities can be summarized as:   
```
Roaster
   ↓
Coffee
   ↓
Roast Batch
   ↓
QR Code
```
User experience data flows as follows:   
```
User
   ↓
Coffee Log
   ↓
Review
   ↓
Tasting Notes
   ↓
Flavor Notes
```
Knowledge aggregation flows as:   
```
Coffee Logs
   ↓
Coffee Statistics
```
 --- 
# 5. Discovery Layer   
Discovery features within the platform rely on aggregated data across several entities.   
Examples:   
Users can discover:   
```
Top rated coffees
Trending roasters
Popular brew methods
Common flavor profiles
```
These insights are derived from:   
- coffee logs   
- ratings   
- tasting notes   
- brewing data.   
 --- 
   
# 6. Mapping to Data Model v3   
The following conceptual entities map directly to the relational schema defined in **Data Model v3**.   
```
Users → users table
Roasters → roasters table
Origins → origins table
Coffees → coffees table
Roast batches → roast_batches table
QR codes → qr_codes table
Coffee logs → coffee_logs table
Reviews → reviews table
Flavor notes → flavor_notes table
Tasting notes → tasting_notes table
Brew methods → brew_methods table
Coffee statistics → coffee_stats table
```
This alignment ensures the conceptual architecture directly translates into the backend database design.   
 --- 
# 7. Guiding Principle   
The information architecture of funcup follows one key principle:   
```
Every coffee can be identified.
Every experience can be recorded.
Every experience contributes to shared knowledge.
```
This structure enables funcup to transform individual coffee experiences into a **collective discovery system**.   

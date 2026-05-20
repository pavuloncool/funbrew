---

# yaml-language-server: $schema=schemas/page.schema.json

Object type:
    - Page
Backlinks:
    - funcup-the-first-structured-feedback-loop-4-co.md
Creation date: "2026-03-13T17:42:00Z"
Created by:
    - Pa Koolig

## id: bafyreigww32aw4oklhqaw57ldukrfbysyfrqcaoyrodqppvzrrzhejwu3i

# ├ 02 Product Concept Document v2

## **Purpose:** Concise explanation of the funcup.app product concept for co-founders, investors, and developers. The document describes the problem, the product idea, the core interaction model, and the main design principles of the platform.   

# 1. The Problem

The specialty coffee market has been growing rapidly worldwide, but **the consumer data layer of the industry is almost nonexistent**.  
Today:   
- consumers often **do not really know what coffee they are drinking** beyond the information printed on the label,   
- roasters **have little to no insight into how their coffee is perceived or brewed by consumers**,   
- coffee discovery happens mainly through:  
  • cafés,
  • social media,
  • friends’ recommendations,
  • packaging.

Unlike other taste-driven industries, coffee still lacks a dominant discovery platform comparable to:   


| Industry | Platform |
| -------- | -------- |
| beer     | Untappd  |
| wine     | Vivino   |
| music    | Shazam   |
| sport    | Strava   |


## As a result, a large portion of the real consumer experience data **is never captured or analyzed**.

# 2. The Product Idea

funcup.app creates a **digital identity for coffee** and builds a **community layer of tasting experiences** around that identity.
The platform connects three sides of the market:   

```
Roasters → provide product data
Consumers → provide sensory experience
Platform → aggregates and analyzes the data
```

The mechanism that connects these elements is **coffee identification through QR codes**.  
Each bag of coffee needs to carry a QR code leading to a **dynamic product page inside funcup**.  
This allows:   
- every coffee to have a digital identity,
- consumers to log and evaluate coffees,
- roasters to receive real feedback from the market.

---

# 3. Core System Principle

The platform is built around a clear separation of roles:   

```
Roasters → product facts
Consumers → taste perception (product and tasting perception data)
Platform → aggregation and analysis
```

## This structure preserves **data credibility** and prevents information chaos.   

# 4. Core Product Interaction

The existential rationale of the app is to allow the users to:

```
scan coffee using the QR scanner and record it in their 'coffee journal'.
```

The process looks as follows:   

```
1. The user buys coffee.
↓
2. The user scans the QR code from coffee package.
↓
3. The app identifies the product.
↓
4. The user is taken to the **coffee product page** where they learn about the coffee from the data **provided by the roaster and the community**.
↓
5. The user logs their tasting experience.
↓
6. The user can label their tasting experience and rating as 'private' without publishing it or 'add' it to the publicly visible pool of product ratings and opinions.
```

### This core sequence activates the entire community data system.   

# 5. Entry Interaction — Tap to Bean (Authentication)

The first interaction with the application is designed as a distinctive visual gesture:  
When the user launches the app on their phone screen, they see a black-line **finger print** with the app name on the screen.   

The interaction works as follows:   

```
1. Every user must touch the finger print in the middle of the app screen to move further. The finger-confetti-bean animation shows only as the app-launch screen.
↓
2. The finger print bursts into a cloud of black confetti exploding in a circular fashion, edge-to-edge all over the screen.
↓
3. When the first confetti flakes reach the screen edges, the bean fades in from the white background in the centre of the app screen.
↓
4. After the coffee bean reaches its 100% visual size in its container, it bursts into a cloud of black confetti exploding in the same circular fashion, edge-to-edge all over the screen.
↓
5. Authentication: While the bean explosion is wearing out, a background process authenticates the user's device session. The check may return two scenarios:
    a. the session token is valid/user login data is stored: the Coffee Hub screen including the QR scanner button is diplayed;
    b. the session token is missing on the device ➝ the app displays the sign-in/sign-up screen (email only sign-up plus magic link) with message 'Sign in or register to join the coffee community'; the user provides their email address, a magic link is sent to their email inbox and, upon clicking, takes them back into the app; next:
        ➝ if the user's email matches an existing account ➝ the Coffee Hub screen including the QR scanner button is diplayed and the user's data are loaded from the server;
        ➝ if the user's email does not match any account ➝ an account is created for them in the app (DB, auth etc.) and the user is taken to their user account screen to complete the registration and validate their consents (the user account screen will include the Coffee Hub button and the QR scanner button for the user to launch their first scan as soon as they are ready with their sign-up information).
```

## This interaction acts as a **symbolic gateway into the coffee world**.   

# 6. Coffee Hub — the heart of the app

After entering, the user arrives at the app 'cockpit' screen called 'Coffe Hub':  
**Coffee Hub**
This is where the user 'lives' inside the application. 
The **Coffe Hub** screen displays navigation to 5 major app areas:

```
Central, bottom button: QR Coffee Scanner – the heart and the core tool of the app
Screen tile 1: Discover Coffees (coffee data, including roaster name, lot, roast date, brew method, tasting radar chart based on roaster info, tasting radar chart based on user info, overall coffee rating)
Screen tile 2: Discover Roasters (roaster name, roaster locatioin, coffee lots submitted to the app, averaged coffee ratings, tasting radars compliance (roaster vs user))
Screen tile 3: Tips & Skills (coffee blog posts, brewing tips, roaster presentations)
Screen tile 4: Community (users who rated the same coffee or follow the same roaster);
```
### A future option: the app may offer users hero-identities — a set of characters/avatars, as part of the gamification layer.

The **Coffee Hub** is designed to:
- prioritize coffee scanning,
- encourage coffee exploration,
- support roaster discovery,
– network with likewise users.

---

# 7. Coffee Page

## QR Coffee Scanner

The button in the bottom navbar opens the QR scanning interface (stack and UI needed)

After scanning a QR code, the user arrives at the **coffee product page**.  
The page is organized into four sections:   

```
Product
Brewing
Story
Community
```

These sections correspond to four key user questions:   

- what coffee is this?   
- how should I brew it?   
- where does it come from?   
- how do others experience it?

---

# 8. Product Data

Product information is provided by the roaster.  
Typical data includes:   

- roaster   
- coffee name   
- country of origin   
- region   
- farm   
- variety   
- processing method   
- altitude   
- roast date   
- batch / lot.

## The QR code identifies **a specific roasting batch**.   

# 9. Tasting Data

Consumers can log:   

- coffee rating   
- flavor notes   
- brewing method   
- short review.

## These inputs are structured so that the platform can later analyze patterns in taste perception and brewing behavior.   

# 10. Sensory Reputation System

To maintain the quality of tasting data, funcup introduces a **progressive sensory reputation system**.  
The system evolves together with the user’s experience:   

```
Beginner
Advanced
Expert
```

Progression may be influenced by:   

- user activity   
- quality of reviews   
- “helpful” feedback from other users.

However, the core design rule is **no visible barriers**.  
Users never see messages like:   

> “You need more helpful votes to unlock this level.”   

Instead the system evolves subtly:   

- additional flavor descriptors appear gradually,   
- the interface suggests more precise tasting language,   
- users naturally discover deeper layers of sensory vocabulary.

As a result:   

```
sensory learning happens naturally
without frustration or perceived restriction
```

---

# 11. Credibility System

Maintaining trustworthy data is critical.  
The platform introduces two key mechanisms.   

### Verified Roasters

Only verified roasters can publish coffee products.   

### Product Data Control

Fields such as:   

- origin   
- farm   
- variety   
- process

## can only be edited by the roaster.  
Consumers cannot modify product facts.   

# 12. Value for Users

For consumers, funcup becomes:   

- a personal coffee journal   
- a discovery tool   
- a guide to the world of coffee   
- a community of coffee enthusiasts.

---

# 13. Value for Roasters

For roasters, the platform provides:   

- a digital product page   
- a storytelling channel   
- real consumer feedback   
- behavioral analytics about how coffee is brewed and perceived.

---

# 14. Long-Term Vision

funcup has the potential to become **the global consumer data layer for specialty coffee**.  
In the future the platform could enable:   

- a global map of coffee discovery   
- personalized coffee recommendations   
- flavor preference modeling   
- increased transparency across the coffee supply chain.

Ultimately, funcup could become:   

```
the reference system showing
how coffee is truly experienced by consumers worldwide.
```

---

# 15. North Star Metric

The primary product metric is:   

```
coffees logged per user
```

This metric best reflects:   

- engagement   
- discovery behavior   
- the real value of the platform.


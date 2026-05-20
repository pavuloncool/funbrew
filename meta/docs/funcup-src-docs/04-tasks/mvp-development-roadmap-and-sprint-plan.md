---
# yaml-language-server: $schema=schemas/page.schema.json
Object type:
    - Page
Backlinks:
    - funcup-the-first-structured-feedback-loop-4-co.md
Creation date: "2026-03-14T23:26:00Z"
Created by:
    - Pa Koolig
id: bafyreif4oolaimkcsxwhqlgxfjt5teba7s4fxjl46drlqkdjsi6s67ncaa
---
# 📅 MVP Development Roadmap & Sprint Plan   
# Purpose   
This document provides a clear execution plan for the funcup MVP development. It defines **what to work on first** and establishes a logical sequence of tasks based on dependencies and priorities.   
 --- 
# Development Philosophy   
The MVP follows a **foundation-first, vertical slice** approach:   
```
Week 1-2: Foundation (infrastructure + data layer)
↓
Week 3-5: Core Loop (scan → log → discover)
↓
Week 6-7: Polish & Stakeholder Tools
```
**Key principle**: Build the **minimum viable core loop** first, then expand.   
 --- 
# 🎯 Sprint 0: Setup & Foundation (Week 1-2)   
**Goal**: Get the technical infrastructure running and data model deployed.   
## **Week 1: Infrastructure Setup**   
### Monday - Backend Foundation   
- [Set up Supabase project and PostgreSQL database](https://www.notion.so/323a0f197a1581cc886dfede17b6ce1f)   
- [Configure Supabase Authentication](https://www.notion.so/323a0f197a158140a866f47b120c4256) (JWT, email/password)   
- [Set up Supabase Storage buckets](https://www.notion.so/323a0f197a158174a222eedcf6ed0b19) (roasters/, coffees/, users/, qr/)   
   
### Tuesday - Data Model Implementation   
- [Create PostgreSQL schema for all core tables](https://www.notion.so/323a0f197a15810794a7df7686a34e90) (users, roasters, origins, coffees, batches, qr\_codes)   
- [Set up database relationships and foreign keys](https://www.notion.so/323a0f197a15813db01beb11655fcac3)   
- [Implement Row-Level Security (RLS) policies](https://www.notion.so/323a0f197a1581918e4dc66256a87418)   
   
### Wednesday - Mobile App Foundation   
- [Set up React Native mobile app project](https://www.notion.so/323a0f197a1581ad9a59ed6243ec9117) (Expo + TypeScript)   
- Configure app navigation structure   
- Connect mobile app to Supabase   
   
### Thursday - Authentication   
- [Implement authentication endpoints](https://www.notion.so/323a0f197a1581e0b90fc0d569699822) (register/login/logout)   
- Build login/register screens in mobile app   
- Test auth flow end-to-end   
   
### Friday - Documentation & Planning   
- [Define vision statement and long-term goals](https://www.notion.so/323a0f197a1581bd8511e7a8cbd6430f) (Doc 01)   
- [Document core idea and ecosystem connections](https://www.notion.so/323a0f197a15812c8ea4e30bc61236c9) (Doc 01)   
- [Establish product philosophy and guiding principles](https://www.notion.so/323a0f197a158173808be782e2ba48b7) (Doc 01)   
   
## **Week 2: Core Data & APIs**   
### Monday - Product Strategy   
- [Document problem statement and market gap analysis](https://www.notion.so/323a0f197a1581f2a12efd2e2bc2e651) (Doc 02)   
- [Define core product interaction flow](https://www.notion.so/323a0f197a1581c3958afc35d3d404dc) (Doc 02)   
- [Conduct competitive landscape analysis](https://www.notion.so/323a0f197a158191b091dd342f9064e4) (Doc 03)   
- [Define product category and positioning statement](https://www.notion.so/323a0f197a158116b362c79171b25aea) (Doc 03)   
   
### Tuesday - Information Architecture   
- [Define core information domains](https://www.notion.so/323a0f197a158195bbf9dc79ec6e9d3c) (Doc 04)   
- [Document core entities and their attributes](https://www.notion.so/323a0f197a15815b8043de46f4003850) (Doc 04)   
- [Map information relationships and data flows](https://www.notion.so/323a0f197a1581588909dab27953d3ee) (Doc 04)   
   
### Wednesday - Experience Tables   
- [Implement experience tables](https://www.notion.so/323a0f197a1581c5a001ca624aaf84b5) (coffee\_logs, reviews, tasting\_notes)   
- [Create sensory system tables](https://www.notion.so/323a0f197a1581dd8220f843cecef6b5) (flavor\_notes, brew\_methods)   
- [Implement rate limiting](https://www.notion.so/323a0f197a158183b3d2fc2c70ecaabc)   
   
### Thursday - Core API Endpoints   
- [Create coffee endpoints](https://www.notion.so/323a0f197a1581c3b858eaca434bc182) (GET /coffees/{id}, /coffees/discover)   
- [Create roaster endpoints](https://www.notion.so/323a0f197a158185a945efcd98fd1300) (GET /roasters/{id})   
- [Implement flavor notes and brew methods list endpoints](https://www.notion.so/323a0f197a1581f4bc8cfe5bb4e87d41)   
   
### Friday - Testing & Documentation   
- Test all API endpoints   
- [Document core product loop and network effects](https://www.notion.so/323a0f197a1581b7a923d690705cd5f7) (Doc 03)   
- [Define target user personas](https://www.notion.so/323a0f197a158174b71bc172621509da) (Doc 03)   
 --- 
   
# 🚀 Sprint 1: Core Product Loop (Week 3-5)   
**Goal**: Implement the **scan → identify → log → discover** flow.   
## **Week 3: QR Scan System**   
### Monday - QR Infrastructure   
- [Create QR code generation system](https://www.notion.so/323a0f197a158138ba1dd8e0fd030d18)   
- [Implement core QR scan endpoint](https://www.notion.so/323a0f197a158149b0f2c8a191f94b5a) (GET /scan/{qr\_hash})   
- [Implement Edge Functions for scan](https://www.notion.so/323a0f197a15815ab91ddd60b5dfcedf) (scan\_qr())   
   
### Tuesday - Mobile QR Scanner   
- ✅ Build QR scanner screen in mobile app   
- ✅ Implement scan → coffee page navigation   
- ✅ Test end-to-end QR scan flow   
   
### Wednesday - Coffee Page Design   
- [Design Coffee Page structure](https://www.notion.so/323a0f197a1581389dbbce8da42fcd1b) (Product/Brewing/Story/Community)   
- Build Coffee Page UI in mobile app   
- Connect Coffee Page to API   
   
### Thursday - Coffee Logging   
- [Implement coffee logging endpoint](https://www.notion.so/323a0f197a1581c189b9d99ceeb1d57e) (POST /coffee-logs)   
- Build coffee logging screen in mobile app   
- Implement rating and flavor note selection   
   
### Friday - Review System   
- [Create review endpoints](https://www.notion.so/323a0f197a158130bb8dfec6ba02ff0a) (POST /reviews, GET /coffees/{id}/reviews)   
- Build review input UI   
- Display reviews on Coffee Page   
   
## **Week 4: Discovery & Hub**   
### Monday - Aggregation Layer   
- [Create aggregation tables](https://www.notion.so/323a0f197a15812d9cc0efbbb590b1c8) (coffee\_stats)   
- [Implement Edge Functions for stats](https://www.notion.so/323a0f197a15815ab91ddd60b5dfcedf) (update\_coffee\_stats())   
- [Design discovery layer and aggregation patterns](https://www.notion.so/323a0f197a15819d9985eb5248328751) (Doc 04)   
   
### Tuesday - Discovery Engine   
- [Implement discovery engine with stats aggregation](https://www.notion.so/323a0f197a1581419551f6df01f0ff05)   
- Create trending coffees endpoint (GET /coffees/trending)   
- [Implement Coffee Hub feed endpoint](https://www.notion.so/323a0f197a15813bb194e242c3e79c92) (GET /feed)   
   
### Wednesday - Coffee Hub UI   
- [Structure Coffee Hub main screen](https://www.notion.so/323a0f197a1581a8ac33fcc085c5ed18)   
- Build discovery feeds (trending, recommended)   
- Implement search functionality   
   
### Thursday - Verified Roasters   
- [Implement verified roasters system](https://www.notion.so/323a0f197a158171bfc6ea6bb2a64f1e)   
- Create roaster verification workflow   
- Build roaster profile pages   
   
### Friday - Polish & Testing   
- Test full user journey: scan → log → discover   
- Fix bugs and UI issues   
- [Establish North Star Metric tracking](https://www.notion.so/323a0f197a1581fe9f7dccee66c41e4b) (Doc 03)   
   
## **Week 5: Reputation & Refinement**   
### Monday-Wednesday - Reputation System   
- [Design progressive sensory reputation system](https://www.notion.so/323a0f197a15812cbb71dbfa516dd78b)   
- [Implement reputation system tables](https://www.notion.so/323a0f197a1581fb8a6de6ddd45ed8a2) (review\_votes)   
- [Create review voting endpoint](https://www.notion.so/323a0f197a1581f2bf66c03a96364063) (POST /reviews/{id}/vote)   
- Build reputation progression logic   
   
### Thursday - Entry Experience   
- [Design Tap to Bean entry interaction](https://www.notion.so/323a0f197a1581018beec641a852c2e2)   
- Implement onboarding flow   
- Polish app transitions   
   
### Friday - Testing & Fixes   
- ✅ End-to-end testing of core loop   
- ✅ Performance optimization   
- ✅ Bug fixes   
 --- 
   
# 🎨 Sprint 2: Stakeholder Polish (Week 6-7)   
**Goal**: Build roaster dashboard and prepare for beta launch.   
## **Week 6: Roaster Dashboard**   
### Monday-Tuesday - Dashboard Setup   
- [Set up Next.js roaster dashboard project](https://www.notion.so/323a0f197a1581f38d58d67fd44dd39f)   
- [Create roaster dashboard API endpoints](https://www.notion.so/323a0f197a158129b863fbfc6fd9ba83)   
- Build authentication for dashboard   
   
### Wednesday-Thursday - Dashboard Features   
- Build coffee creation interface   
- Build roast batch management   
- Implement QR code generation UI ([generate\_qr() Edge Function](https://www.notion.so/323a0f197a15815ab91ddd60b5dfcedf))   
   
### Friday - Roaster Analytics   
- ✅ Build analytics views for roasters   
- ✅ Display consumer feedback data   
- ✅ Test dashboard end-to-end   
   
## **Week 7: Launch Preparation**   
### Monday-Tuesday - DevOps   
- [Set up CI/CD pipeline](https://www.notion.so/323a0f197a1581a2a555f3194ae34052) (GitHub → Supabase → Expo)   
- [Configure analytics layer](https://www.notion.so/323a0f197a15817792b1c3074c6e9285)   
- Set up monitoring and error tracking   
   
### Wednesday - Testing   
- ✅ Full system testing   
- ✅ User acceptance testing   
- ✅ Security audit   
   
### Thursday - Documentation   
- ✅ Complete all documentation   
- ✅ Create user guides   
- ✅ Prepare beta launch materials   
   
### Friday - Beta Launch   
- ✅ Deploy to production   
- ✅ Launch beta with first roasters   
- ✅ Monitor and respond to feedback   
 --- 
   
# 📊 Task Priority Matrix   
## **P1 - Must Have (Critical Path)**   
These tasks MUST be completed for MVP launch:   
### Foundation (Week 1-2)   
1. Supabase setup + PostgreSQL schema   
2. Authentication system   
3. Mobile app foundation   
4. Core API endpoints   
5. RLS policies   
   
### Core Loop (Week 3-5)   
1. QR code system (generation + scanning)   
2. Coffee logging endpoint + UI   
3. Coffee Page UI   
4. Discovery engine + feeds   
5. Coffee Hub UI   
   
### Stakeholder (Week 6-7)   
1. Roaster dashboard core features   
2. QR generation for roasters   
3. Basic analytics   
   
## **P2 - Should Have (Enhanced Experience)**   
These improve the experience but aren't blockers:   
1. Tap to Bean entry animation   
2. Advanced reputation system   
3. Review voting   
4. CI/CD pipeline   
5. Advanced analytics   
   
## **P3 - Nice to Have (Future)**   
Post-MVP features:   
1. Social features   
2. Advanced personalization   
3. Brew recipes   
4. Coffee shop integration   
 --- 
   
# 🎯 Start Here (Monday Week 1)   
## Your First Day Tasks:   
### Morning (2-3 hours)   
1. **[Set up Supabase project](https://www.notion.so/323a0f197a1581cc886dfede17b6ce1f)**   
    - Create account at [supabase.com](http://supabase.com)   
    - Create new project   
    - Note down project URL and API keys   
2. **[Initialize PostgreSQL schema](https://www.notion.so/323a0f197a15810794a7df7686a34e90)**   
    - Copy Data Model v3 schema   
    - Execute in Supabase SQL editor   
    - Verify tables created   
   
### Afternoon (3-4 hours)   
1. **[Configure Supabase Authentication](https://www.notion.so/323a0f197a158140a866f47b120c4256)**   
    - Enable email/password auth   
    - Configure JWT settings   
    - Test registration flow in Supabase UI   
2. **[Set up Storage buckets](https://www.notion.so/323a0f197a158174a222eedcf6ed0b19)**   
    - Create buckets: roasters/, coffees/, users/, qr/   
    - Configure access policies   
    - Test file upload   
   
### End of Day   
1. **[Initialize mobile app](https://www.notion.so/323a0f197a1581ad9a59ed6243ec9117)**   
    - Run: `npx create-expo-app funcup --template`   
    - Install Supabase client: `npm install @supabase/supabase-js`   
    - Configure Supabase connection   
 --- 
   
# ⚡ Quick Reference: What's Next?   
**After Foundation Week**:   
→ Can you scan a QR and see coffee data? **NO** → Work on QR system (Week 3)   
**After QR System**:   
→ Can users log coffees? **NO** → Work on logging (Week 3)   
**After Logging**:   
→ Can users discover coffees? **NO** → Work on discovery (Week 4)   
**After Discovery**:   
→ Can roasters add coffees? **NO** → Work on dashboard (Week 6)   
**After Dashboard**:   
→ Is everything production-ready? **NO** → Work on DevOps (Week 7)   
 --- 
# 🚨 Blockers & Dependencies   
## Critical Dependencies   
1. **Supabase setup** blocks → ALL backend work   
2. **Mobile app init** blocks → ALL mobile work   
3. **QR system** blocks → Coffee scanning   
4. **Coffee logging API** blocks → User experience tracking   
5. **Discovery engine** blocks → Coffee Hub features   
   
## Non-Blocking (Can Parallel)   
- Documentation (Docs 01-04) can be done anytime   
- UI design can happen while backend is built   
- Roaster dashboard can start after core API exists   
 --- 
   
# 📈 Success Metrics   
## Week 2 Goal   
- ✅ Backend deployed   
- ✅ Mobile app runs locally   
- ✅ Auth works   
- ✅ Can create coffee records manually   
   
## Week 5 Goal   
- ✅ Core loop works: scan → log → discover   
- ✅ 5 test coffees in system   
- ✅ Can rate and review coffees   
   
## Week 7 Goal   
- ✅ MVP deployed to production   
- ✅ 3 roasters onboarded   
- ✅ Dashboard functional   
- ✅ 10+ coffees scannable   
 --- 
   
# 🎓 Learning Resources   
If you get stuck:   
**Supabase**:   
- [Supabase Docs](https://supabase.com/docs)   
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)   
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)   
   
**React Native + Expo**:   
- [Expo Docs](https://docs.expo.dev)   
- [React Navigation](https://reactnavigation.org)   
   
**QR Codes**:   
- [expo-camera](https://docs.expo.dev/versions/latest/sdk/camera)   
- QR generation libraries   
 --- 
   
**Next Step**: Open Backlog in Kanban view, filter by "Phase 1 – Foundation" and "Priority: P1" → those are your Week 1-2 tasks!   

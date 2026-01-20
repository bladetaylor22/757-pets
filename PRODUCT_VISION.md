# 757 PETS — Product Vision & Platform Outline

> **Document Status:** Working Document  
> **Last Updated:** 2024  
> **Purpose:** Reference document for platform development and feature planning

---

## Table of Contents

- [0. What 757 PETS is](#0-what-757-pets-is)
- [1. Core Principles](#1-core-principles-how-we-build-and-why-it-will-feel-different)
- [2. The Four Core Areas](#2-the-four-core-areas-of-the-platform-priority-order)
- [3. Core Platform Features](#3-core-platform-features-cross-cutting)
- [4. Technical Posture](#4-web-first-mobile-ready-technical-posture)
- [5. MVP Scope](#5-mvp-scope-recommendation-first-release)
- [6. Success Metrics](#6-success-metrics-early-signals)
- [7. Open Questions](#7-open-questions-to-decide-soon)

---

## 0. What 757 PETS is

**757 PETS** is a modern, community-powered pet platform for **Hampton Roads, Virginia ("the 757")** designed to help pet owners and pet lovers quickly:

1. **Reconnect with lost pets**
2. **Find pet care and resources**
3. **Get accurate, local answers to pet-related questions**
4. **Discover causes, events, and community action for pets**

The platform will launch **web-first** and later expand to a **mobile app** (Expo), sharing a single backend and shared data model.

---

## 1. Core Principles (How We Build and Why It Will Feel Different)

### 1.1 Mission-First UX

757 PETS prioritizes **urgent, real-world tasks** over browsing:

- "My dog is missing" should be solvable in under a minute
- "I need an emergency vet now" should be solvable in under 30 seconds

### 1.2 Modern + AI-Forward, Not "Directory-First"

Instead of a traditional directory, 757 PETS uses a **task-based flow**:

- Users select a mission ("Find care", "Report lost", "Report sighting", "Ask a question")
- The platform gathers minimal details and produces the best next actions

### 1.3 Community Network Effects with Safety Guardrails

The platform is designed to become more valuable as more people use it, while protecting users from:

- Scams
- Doxxing / oversharing location
- Abuse / spam

### 1.4 Local Relevance Only

757 PETS stays grounded in Hampton Roads local context:

- Cities (e.g., Norfolk, Virginia Beach, Chesapeake, Portsmouth, Suffolk, Hampton, Newport News, etc.)
- Local animal shelters, rescues, ordinances, licensing, leash laws, etc.

---

## 2. The Four Core Areas of the Platform (Priority Order)

### 2.1 Area 1 — Lost Pet Reconnection (Highest Priority)

#### Goal

Help pet owners reunite with lost pets as quickly as possible using community reporting, location context, and rapid sharing.

#### Key Concepts

- **Pet Profile**: Stable identity record for the pet
- **Lost Report**: Time-based incident created when a pet is missing
- **Sighting Report**: Community-submitted observation tied to a lost report
- **Found Report**: Community-submitted "I have the pet" report

#### Primary User Flows

##### A) Pet Owner: Create Pet Profile

- Add pet name, species, appearance, temperament notes
- Add primary photo
- Optionally add identification details (microchip ID, collar description)
- Optionally add "Documents Vault" (rabies/vaccination records, adoption paperwork)

##### B) Pet Owner: One-Tap "Mark Lost"

- A single action creates a **Lost Report** for that pet
- Minimal required details:
  - City + approximate area (no exact address by default)
  - Last seen time
  - Notes ("skittish", "may run", "friendly but cautious")
  - Optional reward
- Generates a shareable public page (for social posting)
- Enables notification preferences

##### C) Community: Report a Sighting

- Extremely fast form:
  - When seen
  - Where seen (approximate)
  - Optional photo
  - Notes (direction, behavior)
- Can be authenticated or (policy decision) anonymous with anti-abuse controls

##### D) Community: Report a Found Pet

- "I have the pet" flow with safety options:
  - Suggest safe meetup/public place
  - Optional shelter handoff
  - Optional proof-of-ownership request workflow (later phase)

##### E) Owner: Manage the Incident

- View incoming sightings and found reports
- Update status:
  - "Still lost"
  - "Reunited"
  - "Close report"
- Add updates that propagate to share page

#### Lost Pet "Power Features" (Phased)

- "Follow this pet" alerts
- Area-based alerts ("lost pet within 3 miles")
- Printable lost poster generator (later)
- AI-assisted "lost post optimization" (later)
- Duplicate detection / scam detection (later)

#### Safety + Privacy Requirements (Non-Negotiable)

- Default to approximate location (neighborhood, cross streets, map grid)
- Owner controls what contact info displays publicly
- Reporting + moderation tools exist from v1 (minimum viable moderation)

---

### 2.2 Area 2 — Pet Care & Resources Finder

#### Goal

Help pet owners discover trusted places and services quickly—especially urgent needs.

#### Marketplace-Style Interface (Balanced + Modern)

- Task selection ("Find care", "Find a service", "Plan an outing")
- Results list + map toggle
- Filters and sorting (open now, distance, category, etc.)
- AI refinement panel suggests filters without replacing familiar browsing

#### Resource Categories (Examples)

**Care**

- Emergency vets (24/7)
- Veterinarians
- Urgent care
- Poison control resources
- Mobile vets

**Services**

- Grooming
- Training
- Boarding
- Daycare
- Pet sitting/walking
- Pet photographers
- Behavioral specialists

**Places**

- Dog parks
- Pet-friendly restaurants/patios
- Trails/beaches (where allowed)
- Stores (pet supplies)

#### Resource Listing Detail Page (Minimum)

- Name, description, category
- Address + hours
- Call button + directions
- "Open now" indicator
- Tags (cat-friendly, 24/7, large dogs, etc.)
- "Save" / "Share"
- "Report an issue" (incorrect hours, closed, etc.)

#### Future Enhancements

- Reviews/ratings (careful: moderation load)
- Partner onboarding for businesses
- Verified resources badges
- "Emergency mode" quick list (top 5 nearest open)

---

### 2.3 Area 3 — Local Pet Q&A (Government + Practical How-To)

#### Goal

Answer local, practical questions with high trust and clear sourcing.

#### Examples

- "How do I license my dog in Chesapeake, VA?"
- "What are leash laws in Virginia Beach?"
- "How do I handle pet cremation locally?"
- "What do I do if I find a stray?"

#### Approach: Two-Layer Trust Model

1. **Verified Guides** (curated articles and steps, last-updated dates)
2. **AI Assistant** that:
   - Synthesizes answers from verified guides and official sources
   - Presents citations/links
   - Clearly labels uncertainty
   - Escalates to "official source" and "call this office/service" when needed

#### Q&A Product Requirements

- Simple question box
- Answer includes:
  - Key steps
  - Relevant local links
  - "Who to contact"
  - "What you'll need"
  - Last-updated date (for curated guides)
- Ability to save/bookmark answers

---

### 2.4 Area 4 — Causes, Events, and Community Good

#### Goal

Help people participate in the local pet community: adoption events, fundraisers, volunteer needs.

#### Event Types

- Adoption events
- Fundraisers
- Vaccination clinics
- Community meetups
- Rescue transport events
- Shelter donation drives

#### Organization Pages

- Norfolk SPCA, local rescues, shelters
- Donation links
- Volunteer info
- Upcoming events
- "Follow org" notifications (later)

---

## 3. Core Platform Features (Cross-Cutting)

### 3.1 Accounts and Identity

- Email/password or passwordless (initial), add OAuth later
- Profile: name, email, phone (optional)
- Admin role for moderation actions

### 3.2 Content Types (Data Objects)

- Pet Profiles
- Lost Reports
- Sightings
- Found Reports
- Resource Listings
- Guides (verified content)
- Q&A entries (user questions + AI answers)
- Events
- Organizations
- Files (photos + documents)
- Moderation flags + admin actions log

### 3.3 File Storage and Documents Vault

- Use Convex file storage for all uploads (photos and private docs)
- Files linked to pets/reports/resources via metadata
- Visibility modes:
  - **Public**: pet photos, sighting photos
  - **Private**: documents vault items (owner-only)

### 3.4 Safety & Moderation

**Minimum viable from v1:**

- Report content button
- Admin remove content
- Admin block user
- Admin action audit log

**Later enhancements:**

- Rate limiting
- Auto-flagging suspicious patterns
- Proof-of-ownership workflows
- Scam warnings and educational prompts

### 3.5 Notifications (Phased)

**Web v1:**

- Email notifications (lost report updates, sightings)

**Later:**

- Push notifications (mobile)
- Area alerts
- "Follow this pet" subscription alerts

### 3.6 Localization (Hampton Roads Focus)

- City selection and filtering
- Location displayed as approximate
- City pages and common local flows

---

## 4. Web-First, Mobile-Ready Technical Posture

### Web First

- Next.js for web UI + auth server routes
- Convex for database + functions + realtime
- Better Auth for authentication

### Mobile Later

- Expo mobile app uses the same Better Auth server and Convex backend
- Shared types/validators to avoid duplication
- File upload flow consistent across web and mobile

---

## 5. MVP Scope Recommendation (First Release)

### MVP = Area 1 (Lost Pet Reconnection) + Light Foundation

**Included:**

- Accounts
- Pet profiles + photos
- Mark lost
- Report sighting / report found
- Public share pages
- Basic moderation tools
- Convex file uploads

**Excluded for MVP:**

- Full resource directory
- Full Q&A knowledge base
- Events platform

---

## 6. Success Metrics (Early Signals)

- Time-to-post (lost report created in < 60 seconds)
- Sighting submission completion rate
- Reunification rate (self-reported)
- Active users in the 757 region
- Viral loop effectiveness (share link clicks / conversions)

---

## 7. Open Questions (To Decide Soon)

- Anonymous sightings: allowed or require login?
- Contact info on public lost pages: default phone shown or opt-in?
- Proof-of-ownership: what is "good enough" for v1 vs later?
- How to seed resource listings and keep them updated?
- Partnerships: shelters/rescues for early adoption and trust?

---

## Document History

| Date | Change | Author |
|------|--------|--------|
| 2024 | Initial document creation | — |

---

**Note:** This is a living document and will be updated as the platform evolves and decisions are made.

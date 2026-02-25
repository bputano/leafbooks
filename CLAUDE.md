# LeafBooks

Direct-sales ecommerce platform for self-published authors.

## Tech Stack
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Payments**: Stripe (Connect for author payouts)
- **Print-on-Demand**: Lulu.com API
- **Auth**: NextAuth v5
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest (unit/integration) + Playwright (e2e)

## Project Structure
- `src/app/` — Next.js App Router (route groups: auth, dashboard, storefront)
- `src/components/` — React components organized by feature
- `src/lib/` — Server-side integrations (Stripe, Lulu, DB, Auth, Email)
- `src/hooks/` — Custom React hooks
- `src/types/` — Shared TypeScript types
- `src/config/` — App configuration and constants
- `prisma/` — Database schema and migrations
- `docs/` — PRD, API docs, design specs
- `tests/` — Unit, integration, and e2e tests

## Key Business Rules
- **Free tier**: Authors pay 20% platform fee per sale
- **Paid tiers**: Authors pay only Stripe processing fees
- Path alias: `@/*` maps to `./src/*`

## Terminology
- **LeafBooks** — the platform
- **Leaf Edition** — the web-based ereader experience for a specific book
- **Leaf Reader** — the reader UI/technology itself

## Product Decisions

### Identity
- GUID (cuid) as primary user identifier, NOT email
- Users can attach multiple emails, phone numbers to one account
- Any attached email can be used to log in

### Create a New Title Workflow
- **Auto-save**: Every step persists to DB; authors can leave and resume anytime
- **Edit after creation**: Authors can edit any title; all titles listed in sidebar or dedicated page
- **Upload later path**: Authors can skip file upload to start pre-orders before book is done
  - Without upload: authors enter metadata + cover manually
  - Without cover: generate default cover (book title + author name)
  - Always encourage uploading even a draft to auto-fill title details and generate landing page
  - Final files can be replaced later
- **Leaf Edition vs Ebook**: Leaf Edition is the web reader experience; Ebook is a downloadable format (EPUB). Different products, both available as formats
- **Print specs** (trim size, paper, binding, color): captured in Step 5 (Set up Formats), can be added later
- **Audiobook**: deferred to future release
- **ISBNs**: Offer free ISBNs via Lulu API; also auto-detect from uploaded manuscripts

### Bonus Material & Bundles
- Authors build a **library of bonus materials** (PDFs, templates, checklists, external URLs, coaching services)
- Bundles compose from: book formats + bonus materials + services
- Example: Bundle 1 = HC + Bonus A; Bundle 2 = HC + Bonus A + B; Bundle 3 = all above + coaching

### Payments & Fulfillment
- **Pre-orders**: Charge immediately at pre-order time (not at fulfillment)
- **Pre-order shipping**: Shipping address collected at pre-order for print formats
- **Cancellation**: Buyers can cancel pre-orders until printing begins
- **No author delivery deadline**: Authors are not forced to deliver by a set date
- **Taxes**: Handled by Stripe Tax
- **Shipping**: Handled by Lulu API
- **Future**: Offset printing and fulfillment option (design for this now)

### Distribution
- **Now**: Lulu API handles global distribution (Amazon, IngramSpark, bookstores worldwide)
- **Future**: Build own POD and distribution platform
- Design fulfillment layer as an abstraction so providers can be swapped/added

### Positioning & ICP
- **Position**: Platform to grow your audience through direct sales
- **Growth tools**: Cross-author promotions, SEO-indexed Leaf Edition sections, reader link-sharing, email capture
- **V1 ICP**: Authors who already have an audience (newsletter, social, podcast) and know how to monetize it
- Growth tools are amplifiers for V1; acquisition features will build over time

### Email & Marketing
- **MVP**: Email capture + easy export/integration with author's preferred ESP
- **Integrations**: Beehiiv, Kit (ConvertKit), Mailchimp — must be frictionless
- **Future**: Consider native email marketing tools

## Commands
- `npm run dev` — Start dev server
- `npm run db:migrate` — Run Prisma migrations
- `npm run db:studio` — Open Prisma Studio
- `npm test` — Run unit tests
- `npm run test:e2e` — Run e2e tests

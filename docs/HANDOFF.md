# Canopy — Handoff Document

**Last updated:** March 6, 2026

## What Is Canopy

The self-publishing platform built for growth. Authors sign up, upload manuscripts, set up book formats (hardcover, paperback, ebook, Leaf Edition), and sell directly to readers through their own landing pages. Readers get a personal library, a beautiful web reader, and frictionless purchasing.

Canopy takes a 15% platform fee on the free tier (on top of print and transaction costs). Paid subscription tiers reduce or eliminate the royalty.

**Brand name:** Canopy (formerly "LeafBooks" / "Serif" in early development)

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript + React 19
- **Database**: PostgreSQL (Neon) + Prisma 6.19
- **Auth**: NextAuth v5 (beta 30) — credentials + Google OAuth, JWT sessions
- **Payments**: Stripe Connect (Express accounts for author payouts)
- **File Storage**: Cloudflare R2 (S3-compatible, presigned URL uploads)
- **AI**: Anthropic Claude (manuscript metadata extraction), Google Gemini (chapter formatting)
- **Print-on-Demand**: Lulu.com API (fulfillment abstraction layer)
- **Styling**: Tailwind CSS v4 with custom color palettes (`leaf` greens, `ink`/`paper` editorial tones)
- **PDF Processing**: pdf-lib (truncation), pdf-parse v1 (text extraction for Leaf Reader)
- **Deployment**: Vercel (Hobby plan — 10s serverless function limit)

---

## What Has Been Built

### Three Pillars

The product has three main surfaces:

1. **Author Dashboard** — Title wizard, sales, readers CRM, settings
2. **Storefront & Canopy Reader** — Book sales pages, checkout, web reader with highlights/notes/sharing
3. **Canopy Library** — Reader accounts, personal book library, reading progress, highlights collection

---

## Architecture

### Route Groups (Next.js App Router)

| Route Group | URL Prefix | Purpose |
|---|---|---|
| `(auth)` | `/login`, `/register` | Author authentication |
| `(dashboard)` | `/titles`, `/sales`, `/readers`, `/settings` | Author dashboard (protected) |
| `(storefront)` | `/[author]`, `/[author]/[book]`, `/gift/[token]`, `/share/[token]` | Public-facing pages + Canopy Reader |
| `(library)` | `/library`, `/library/highlights`, `/library/profile` | Reader library (canopy_session protected) |
| `(library-auth)` | `/library/login` | Reader login (unprotected) |

### Key Architectural Decisions

- **GUID identity**: Users identified by cuid, NOT email. Multi-email support via `UserEmail` model.
- **Two auth systems**: NextAuth for authors (dashboard), magic-link sessions for readers (library). Readers use a `canopy_session` httpOnly cookie with 1-year expiry.
- **Reader identity by email**: Reader records are scoped per-author (`@@unique([authorId, email])`), but the reader's library is cross-author — email is the universal key for ReaderAccess, Highlights, Notes, and ReadingProgress.
- **Three-layer reader access**: `checkReaderAccess()` checks (1) URL token, (2) per-book cookie (`leaf_reader_[bookId]`), (3) unified `canopy_session` cookie. Backward compatible.
- **Lazy Stripe initialization**: Stripe client uses a Proxy pattern to avoid crashing at build time when `STRIPE_SECRET_KEY` isn't available.
- **Presigned URL uploads**: Files go directly from browser to R2 (never through server).
- **Dynamic imports for heavy deps**: `process-content` and `publish` routes use dynamic imports for mammoth, jszip, pdf-parse, @google/generative-ai to avoid crashing Vercel's serverless bundler.
- **Fulfillment abstraction**: `FulfillmentProvider` interface allows swapping Lulu for future providers.
- **Tailwind v4**: Requires `@config "../../tailwind.config.ts"` directive in `globals.css`.

---

## Database Schema (Prisma)

### Core Models

| Model | Purpose |
|---|---|
| **User** | Author account (cuid id, name, password) |
| **UserEmail** | Multi-email support (userId, email unique, isPrimary) |
| **Author** | Author profile (slug, displayName, bio, stripeAccountId, subscriptionTier) |
| **Book** | Title (authorId, title, slug, status, wizardStep, manuscriptFileUrl, coverImageUrl, giftLinksEnabled, keywords[], bisacCodes[]) |
| **BookFormat** | Per-format config (type: HC/PPB/EBOOK/LEAF_EDITION, price in cents, print specs, Lulu cost data) |
| **BookSection** | Canopy Reader content (bookId, order, slug, heading, htmlContent, textContent, wordCount, isFree) |
| **Order** | Purchase record (bookId, bookFormatId, buyerEmail, amount, platformFee, stripePaymentId, status, shippingAddress) |
| **BookCategory** | BISAC categories |
| **CrossPromotion** | Author cross-promo (stub) |

### Reader Models

| Model | Purpose |
|---|---|
| **Reader** | Per-author reader record (authorId+email unique, name, source, status, tags, sessionToken, sessionExpiresAt) |
| **ReaderEvent** | Activity log (SUBSCRIBED, PURCHASED, GIFT_RECEIVED, etc.) |
| **ReaderAccess** | Book access grants (bookId+buyerEmail unique, accessToken, isGift, giftedBy) |
| **GiftLink** | Gift tokens (bookId, createdBy, token, claimedBy) |
| **ReadingProgress** | Last section read (readerEmail+bookId unique, lastSectionId) |
| **Highlight** | Text highlights (sectionId, buyerEmail, startOffset, endOffset, selectedText, color, shareToken) |
| **Note** | Reader notes (sectionId, buyerEmail, content, shareToken) |
| **SectionFAQ** | AI-generated FAQs per section (question, answer, isApproved) |
| **MagicLink** | Passwordless auth tokens (email, token, expiresAt, usedAt) |
| **EmailSubscriber** | Email list (authorId+email unique, source) |

### Enums

- **BookStatus**: DRAFT, PUBLISHED, ARCHIVED
- **FormatType**: HARDCOVER, PAPERBACK, EBOOK, LEAF_EDITION
- **OrderStatus**: PENDING, PAID, FULFILLED, REFUNDED, FAILED
- **OrderFormat**: EBOOK, PRINT, BUNDLE
- **ReaderSource**: PURCHASE, SAMPLE_REQUEST, EMAIL_SIGNUP, GIFT, REFERRAL, MANUAL
- **ReaderStatus**: SUBSCRIBER, SAMPLE, CUSTOMER, VIP, CHURNED
- **SubscriptionTier**: FREE, STARTER, PRO, ENTERPRISE

---

## Feature Details

### 1. Author Dashboard

#### Title Wizard (6 steps, auto-saving)

| Step | What it does |
|---|---|
| 1. Get Started | Auto-advances to step 2 |
| 2. Upload Files | Manuscript (PDF/DOCX/EPUB) + cover upload. AI extraction auto-fills metadata. Auto-creates Leaf Edition format. |
| 3. Title Details | Title, subtitle, description, keywords, BISAC codes, launch/pre-order dates |
| 4. Setup Formats | Add HC/PPB/Ebook/Leaf Edition. Price each, configure print specs. Earnings breakdown calculator. Lulu cost estimates. Gift links toggle (per-book). Process & Preview for Leaf Edition. |
| 5. Review | Summary of book + formats before publishing |
| 6. Launch | Slug editor, publish button. Success screen with links to storefront + Leaf Reader. |

- Auto-saves on field changes (1s debounce), flushes on unmount
- URL tracks step via `?step=N`
- Authors can leave and resume anytime

#### Sales Dashboard (`/sales`)
- 3 stat cards: total revenue, total orders, email subscribers
- Recent orders table (last 50): book, format, buyer email, amount, status, date

#### Readers CRM (`/readers`)
- 4 stat cards: total readers, customers, subscribers, new this month
- Filterable table: name, email, status, books purchased, created/last active
- Click into reader detail page

#### Settings
- **Profile** (`/settings`): display name, slug, bio, avatar URL
- **Payments** (`/settings/payments`): Stripe Connect setup with 3 states (not connected, needs info, connected)

### 2. Storefront & Canopy Reader

#### Book Sales Page (`/[author]/[book]`)
- Two-column layout: cover image + details (title, subtitle, author, description, keywords)
- Format selector with pricing
- "Read a sample" link (if free sections exist)
- Email capture form
- About the Author section
- Full SEO metadata + OpenGraph

#### Checkout (`/[author]/[book]/checkout`)
- Two-step flow: info collection (email, name, shipping for print) → Stripe Elements payment
- Creates PaymentIntent with `application_fee_amount` and `transfer_data[destination]`

#### Success Page (`/[author]/[book]/success`)
- Order confirmation with auto-session creation (sets `canopy_session` cookie)
- "Start Reading Now" CTA (if digital format)
- Gift section (if `book.giftLinksEnabled`) with gift link creation
- "Added to your Canopy Library" teaser with link
- Optional name capture
- Back to book / browse more CTAs

#### Canopy Reader (`/[author]/[book]/read/[section]`)
- Beautiful serif reading experience with customizable font size (S/M/L)
- Sticky header with TOC sidebar, book title, settings, share button
- Gift button in header chrome (if enabled + reader has access)
- **Access levels**: full (purchased/author), preview (signed URL), free (isFree sections), none (paywall)
- **Interactive features**:
  - Text selection → highlight (4 colors) or add note
  - Section share button (generates preview URL)
  - Reading progress bar (current/total sections)
  - Reading progress tracking (fires POST to `/api/reader/progress` on each section view)
- **Paywall**: blurred text preview + "Purchase the Leaf Edition" CTA
- **Preview mode**: full content with "this is a preview" banner
- **SEO**: JSON-LD Chapter schema, per-section meta tags, `robots: noai, noimageai`
- **FAQs**: AI-generated per-section, collapsible details (author-approved)
- Previous/next section navigation

#### Content Pipeline (`src/lib/reader/content-pipeline.ts`)
- Parses PDF, EPUB, DOCX manuscripts
- TOC-based chapter detection (parses Table of Contents pages, consensus on page offset)
- Falls back to regex heuristics for PDFs without TOC
- Parallel Gemini formatting (batches of 5 chapters, max 2 retries on rate limit)
- Falls back to `textToHtml()` if no `GEMINI_API_KEY`

#### Gift Flow
- Buyer clicks "Gift a free copy" → creates GiftLink with unique token
- Recipient visits `/gift/[token]` → claims gift → gets ReaderAccess
- Tracked in Reader events (GIFT_SENT, GIFT_RECEIVED)
- Per-book toggle: `book.giftLinksEnabled` (default true, configurable in wizard)

#### Highlight Sharing
- Public highlights get a `shareToken`
- `/share/[token]` page shows the highlight with book context

### 3. Canopy Library (Reader Platform)

#### Reader Authentication
- **Magic links** (dev mode): email → POST `/api/reader/auth/magic-link` → returns URL → GET `/api/reader/auth/verify?token=` → creates session → redirect to `/library`
- **Auto-session on purchase**: success page calls POST `/api/reader/auth/set-session` with email + paymentIntentId → verifies payment belongs to email → creates session
- **Session**: `canopy_session` httpOnly cookie, 1-year expiry. Token stored on ALL Reader records for that email (cross-author).
- **Dev login**: GET `/api/reader/auth/dev-login?email=` for testing

#### Library Pages

| Page | What it shows |
|---|---|
| `/library/login` | Email input → magic link flow (dev mode: clickable link shown on screen) |
| `/library` | "My Books" grid — cover, title, author, progress bar, highlight/note counts, "Continue Reading" CTA |
| `/library/highlights` | All highlights across all books, grouped by book, clickable to section |
| `/library/profile` | Email (read-only), editable name, gift links sent + claimed status, logout |

- Library layout: Canopy-branded header with nav (My Books / Highlights / Profile)
- Auth check in layout → redirects to `/library/login` if no session

---

## File Structure

### API Routes (37 total)

```
# Auth
api/auth/[...nextauth]              — NextAuth handler

# Books (author dashboard)
api/books                           — GET (list), POST (create)
api/books/[id]                      — GET, PATCH (title, giftLinksEnabled, etc.), DELETE
api/books/[id]/formats              — GET, POST
api/books/[id]/formats/[formatId]   — PATCH, DELETE
api/books/[id]/publish              — POST (validates + publishes)
api/books/[id]/process-content      — POST (content pipeline → BookSections)
api/books/[id]/generate-faqs        — POST (AI FAQ generation)
api/books/[id]/faqs                 — GET
api/books/[id]/faqs/[faqId]        — PATCH, DELETE
api/books/extract-metadata          — POST (AI extraction from manuscript)

# Reader (public)
api/reader/highlights               — GET, POST
api/reader/highlights/[id]          — PATCH, DELETE
api/reader/notes                    — GET, POST
api/reader/notes/[id]              — PATCH, DELETE
api/reader/gift                    — POST (create gift link)
api/reader/gift/redeem             — POST (claim gift)
api/reader/chat                    — POST (AI chat about book)
api/reader/set-cookie              — GET (set per-book reader cookie + redirect)
api/reader/progress                — GET, POST (reading progress)

# Reader auth (Canopy Library)
api/reader/auth/magic-link         — POST (create magic link)
api/reader/auth/verify             — GET (verify magic link → create session → redirect)
api/reader/auth/session            — GET (check session), PATCH (update name)
api/reader/auth/logout             — POST (clear session)
api/reader/auth/set-session        — POST (auto-auth after purchase)
api/reader/auth/dev-login          — GET (dev-only session creation)

# Readers CRM (author dashboard)
api/readers                        — GET (list with filters/pagination)
api/readers/[id]                   — GET, PATCH

# Payments & Webhooks
api/checkout/create-session        — POST (Stripe PaymentIntent)
api/stripe/connect                 — POST (create Express account)
api/stripe/connect/callback        — GET (onboarding callback)
api/webhooks/stripe                — POST (payment events → orders)
api/webhooks/lulu                  — POST (print job status)

# Other
api/upload/presigned               — POST (R2 presigned URL)
api/email/subscribe                — POST (public email capture)
api/lulu/cost-estimate             — POST (print cost calculation)
api/lulu/validate-files            — POST (file validation)
```

### Key Source Directories

```
src/lib/auth/             — NextAuth config, server actions, get-author helper
src/lib/reader/           — Reader auth, access control, magic links, sessions, content pipeline, FAQs
src/lib/stripe/           — Stripe client (lazy Proxy), Connect helpers
src/lib/lulu/             — Lulu API client, cost calculator, POD packages, print jobs
src/lib/fulfillment/      — FulfillmentProvider interface + Lulu implementation
src/lib/storage/          — R2 client, presigned URLs, public URL helpers
src/lib/ai/               — Claude metadata extraction
src/lib/readers.ts        — Reader event tracking helpers (purchase, gift, etc.)

src/components/ui/        — Button, Input, Textarea, FileDropzone
src/components/dashboard/ — SidebarNav, title wizard (6 steps), readers table, FAQ review, landing page editor
src/components/storefront/ — BookCard, FormatSelector, EmailCapture, AuthorHeader, EnhancedSuccess
src/components/reader/    — ReaderLayout, TOC, SectionInteractive, Highlight/Note UI, Paywall, GiftButton, ShareButton, ProgressTracker
src/components/library/   — BookCard, LibraryNav, LoginForm
src/components/checkout/  — CheckoutForm (2-step Stripe Elements)
src/components/auth/      — LoginForm, RegisterForm

src/hooks/                — useTitleWizard (auto-save), useFileUpload (XHR with progress)
src/config/pricing.ts     — Platform fee rates per tier
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Storage (Cloudflare R2)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="leafbooks"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"
NEXT_PUBLIC_R2_PUBLIC_URL="https://pub-xxx.r2.dev"

# AI
ANTHROPIC_API_KEY="sk-ant-..."
GEMINI_API_KEY="..."                    # Required on Vercel for PDF chapter formatting

# Stripe (test mode)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET=""

# Lulu
LULU_CLIENT_KEY=""
LULU_CLIENT_SECRET=""
LULU_SANDBOX="true"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
PLATFORM_FEE_PERCENT="15"
```

R2 bucket CORS must allow the app origin with methods GET, PUT, POST, HEAD and AllowedHeaders `*`.

---

## Deployment

- **Platform**: Vercel (Hobby plan)
- **Serverless limit**: 10 seconds per function
- **Critical**: Heavy dependencies (mammoth, jszip, pdf-parse, @google/generative-ai) must be dynamically imported in `process-content` and `publish` routes to avoid bundle crashes
- **pdf-parse**: Must use v1 (not v2) — v2 bundles modern pdfjs-dist requiring DOMMatrix + web workers unavailable in serverless
- **Gemini batching**: Content pipeline processes chapters in batches of 5 via Promise.all to stay within the 10s limit
- **No `maxDuration` export**: Hobby plan rejects functions declaring maxDuration > 10s
- **Image domains**: `next.config.ts` must include `**.r2.dev` for cover images from R2 public buckets

---

## How to Run

```bash
npm install
cp .env.example .env     # Fill in all required keys
npx prisma db push       # Push schema to database
npm run dev              # → http://localhost:3000

# Other commands
npm run build            # Production build
npx prisma studio        # Database GUI
npx tsc --noEmit         # Type check
```

---

## Testing Status

### Manually tested and working:
- Author registration/login (credentials + Google OAuth)
- Full title wizard flow (upload → extract → details → formats → review → publish)
- Manuscript upload to R2 with AI metadata extraction
- Content pipeline (PDF → chapters → Gemini formatting → BookSections)
- Book sales page rendering with format selector
- Stripe checkout flow (PaymentIntent with Connect)
- Order creation via Stripe webhook
- Canopy Reader (access control, highlights, notes, sharing, FAQs)
- Gift link creation and redemption
- Reader session creation (magic link + auto-auth on purchase)
- Canopy Library (book grid, progress, highlights, profile)
- Per-book gift toggle in wizard
- Reading progress tracking across sections
- Email capture on book/author pages

### Not yet tested:
- Lulu print fulfillment end-to-end (no production API keys)
- Email delivery for magic links (dev mode shows link on screen)
- Pre-order charge-now + later fulfillment
- Refund flow

### No automated tests written yet.

---

## Backlog / Not Yet Built

### High priority (for demo readiness)
1. **Homepage redesign** — Current page is a placeholder. Needs features, visuals, value prop.
2. **Sales analytics** — Revenue chart over time, per-title/per-format breakdown, units sold.
3. **Email subscriber UI** — Authors can't see their email list. Need list view + CSV export.
4. **Growth dashboard** — Surface gift links sent, shares, preview clicks to make "built for growth" tangible.
5. **Author onboarding** — Welcome state for empty dashboard, guided first-run experience.

### Medium priority (product depth)
6. **Email marketing integrations** — Beehiiv, Kit (ConvertKit), Mailchimp sync
7. **Bundles and premium editions** — Compose book formats + bonus materials
8. **Discount / promo codes**
9. **Reader referral program** — Reward readers who refer new buyers
10. **Author cross-promotion UI** — Model exists, no UI
11. **Payout history** — Show Stripe payouts in dashboard
12. **Fulfillment tracking** — Show print order status from Lulu

### Lower priority (future roadmap from vision doc)
13. Affiliate program with trackable links
14. Social selling attribution
15. SMS/text marketing
16. Agentic commerce optimization (structured data for AI shopping agents)
17. Marketplace / catalog search
18. Manuscript formatting and interior design tools
19. Cover design templates
20. Audiobook production
21. Blogging / newsletter publishing
22. Embeddable storefronts
23. Author subscription billing (paid tiers)

# LeafBooks Phase 1 — Handoff Document

## What Is LeafBooks

A direct-sales ecommerce platform for self-published non-fiction authors. Authors sign up, upload manuscripts, set up book formats (hardcover, paperback, ebook), and sell directly to readers through their own landing pages. LeafBooks takes a 20% platform fee on the free tier.

## What Has Been Built

Phase 1 goal was **"get authors selling"** — from signup through creating a title to accepting a payment. All 7 milestones are implemented and the app builds/runs successfully.

### Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript + React 19
- **Database**: PostgreSQL (Neon) + Prisma 6.2
- **Auth**: NextAuth v5 (beta 30) — credentials + Google OAuth, JWT sessions
- **Payments**: Stripe Connect (Express accounts for author payouts)
- **File Storage**: Cloudflare R2 (S3-compatible, presigned URL uploads)
- **AI**: Anthropic Claude API (manuscript metadata extraction)
- **Print-on-Demand**: Lulu.com API (fulfillment abstraction layer)
- **Styling**: Tailwind CSS v4 with custom `leaf` color palette (greens)
- **PDF Processing**: pdf-lib (for truncating large PDFs before AI extraction)

### Dependencies (package.json)

```
@anthropic-ai/sdk, @auth/prisma-adapter, @aws-sdk/client-s3,
@aws-sdk/s3-request-presigner, @prisma/client, @stripe/react-stripe-js,
@stripe/stripe-js, bcryptjs, epubjs, lucide-react, next, next-auth,
pdf-lib, react, react-dom, satori, stripe, tailwindcss, zod
```

---

## Architecture

### Route Groups (Next.js App Router)

Route groups do NOT add to URL paths:

| Route Group | URL Prefix | Purpose |
|---|---|---|
| `(auth)` | `/login`, `/register` | Authentication pages |
| `(dashboard)` | `/titles`, `/sales`, `/settings` | Author dashboard |
| `(storefront)` | `/[author]`, `/[author]/[book]` | Public-facing pages |

### Key Architectural Decisions

- **GUID identity**: Users identified by cuid, NOT email. Multi-email support via `UserEmail` model.
- **Custom NextAuth adapter**: Overrides `getUserByEmail` and `createUser` to work with `UserEmail` model (User table has no email column).
- **Lazy Stripe initialization**: Stripe client uses a Proxy pattern to avoid crashing at build time when `STRIPE_SECRET_KEY` isn't available.
- **Presigned URL uploads**: Files go directly from browser to R2 (never through our server). The presigned route returns `{ url, key, publicUrl }`.
- **Cover image URLs**: `coverImageUrl` stores the full public URL (not just the storage key). Server-side code uses `resolveCoverUrl()` to handle both formats for backward compat.
- **Fulfillment abstraction**: `FulfillmentProvider` interface allows swapping Lulu for future providers.
- **Tailwind v4**: Requires `@config "../../tailwind.config.ts"` directive in `globals.css` (does NOT auto-read config files).

---

## File Structure

### Prisma Schema (`prisma/schema.prisma`)

Key models:
- **User** — id (cuid), name, image, password (nullable for OAuth)
- **UserEmail** — userId, email (unique), isPrimary, verified
- **Author** — userId (unique), slug (unique), displayName, bio, stripeAccountId, subscriptionTier
- **Book** — authorId, title, subtitle, description, slug, isbn, status (DRAFT/PUBLISHED/ARCHIVED), wizardStep (1-6), manuscriptFileUrl, manuscriptFileType, coverFileUrl, coverImageUrl, keywords[], bisacCodes[], launchDate, preOrderDate, isPreOrder
- **BookFormat** — bookId, type (HARDCOVER/PAPERBACK/EBOOK), price (cents), isbn, trimSize, paperType, bindingType, interiorColor, printQuality, coverFinish, pageCount, luluPodPackageId, printingCostCents, shippingEstimateCents
- **Order** — bookId, bookFormatId, buyerEmail, amount (cents), platformFee (cents), stripePaymentId, status, luluOrderId, shippingAddress (JSON)
- **EmailSubscriber** — authorId, email, source

### Auth System

```
src/lib/auth/index.ts          — NextAuth config with custom PrismaAdapter overrides
src/lib/auth/actions.ts        — Server actions: register, loginWithCredentials, loginWithGoogle
src/lib/auth/get-author.ts     — Helper to get authenticated author from session
src/types/next-auth.d.ts       — Type augmentation for session.user.id
src/middleware.ts               — Protects /titles, /sales, /settings routes
```

### Dashboard Pages

```
src/app/(dashboard)/layout.tsx              — SessionProvider + SidebarNav
src/app/(dashboard)/titles/page.tsx         — Title list with status badges
src/app/(dashboard)/titles/new/page.tsx     — Creates draft book, redirects to wizard
src/app/(dashboard)/titles/[id]/edit/page.tsx — Loads book, renders WizardShell
src/app/(dashboard)/settings/page.tsx       — Author profile form
src/app/(dashboard)/settings/payments/page.tsx — Stripe Connect status
src/app/(dashboard)/sales/page.tsx          — Revenue, orders, subscribers
```

### Title Wizard (6 steps)

```
src/hooks/use-title-wizard.ts                              — State management, debounced auto-save
src/components/dashboard/title-wizard/wizard-shell.tsx      — Layout + step routing
src/components/dashboard/title-wizard/step-sidebar.tsx      — Progress indicators
src/components/dashboard/title-wizard/steps/upload-files.tsx — Step 2: Manuscript + cover upload
src/components/dashboard/title-wizard/steps/title-details.tsx — Step 3: Title, description, keywords, dates
src/components/dashboard/title-wizard/steps/setup-formats.tsx — Step 4: HC/PPB/Ebook with pricing calculator
src/components/dashboard/title-wizard/steps/review.tsx       — Step 5: Summary + pre-order info
src/components/dashboard/title-wizard/steps/launch.tsx       — Step 6: Slug editor, publish button
```

Wizard flow: Step 1 auto-advances to Step 2. URL tracks step via `?step=N`. Auto-saves on field changes with 1s debounce. Flushes pending saves on unmount.

### API Routes

```
src/app/api/auth/[...nextauth]/route.ts     — NextAuth handler
src/app/api/books/route.ts                  — GET (list), POST (create)
src/app/api/books/[id]/route.ts             — GET, PATCH, DELETE
src/app/api/books/[id]/formats/route.ts     — GET, POST
src/app/api/books/[id]/formats/[formatId]/route.ts — PATCH, DELETE
src/app/api/books/[id]/publish/route.ts     — POST (validates + publishes)
src/app/api/books/extract-metadata/route.ts — POST (AI extraction from manuscript)
src/app/api/upload/presigned/route.ts       — POST (get presigned R2 URL)
src/app/api/checkout/create-session/route.ts — POST (Stripe PaymentIntent)
src/app/api/stripe/connect/route.ts         — POST (create Express account)
src/app/api/stripe/connect/callback/route.ts — GET (onboarding callback)
src/app/api/email/subscribe/route.ts        — POST (public email capture)
src/app/api/webhooks/stripe/route.ts        — POST (payment events → orders)
src/app/api/webhooks/lulu/route.ts          — POST (print job status updates)
src/app/api/lulu/cost-estimate/route.ts     — POST (print cost calculation)
src/app/api/lulu/validate-files/route.ts    — POST (file validation)
```

### Storage & Uploads

```
src/lib/storage/index.ts       — S3Client for R2, file type constants, key generators, getPublicUrl()
src/lib/storage/presigned.ts   — generatePresignedUploadUrl (PutObjectCommand)
src/hooks/use-file-upload.ts   — Client-side XHR upload with progress tracking
src/components/ui/file-dropzone.tsx — Drag-and-drop upload component
```

Upload flow: Client → presigned route → gets {url, key, publicUrl} → XHR PUT directly to R2 → onSuccess callback saves key/publicUrl to DB.

### AI Extraction

```
src/lib/ai/extract-metadata.ts — Claude API extraction (truncates PDFs >50 pages via pdf-lib)
```

Extracts: title, subtitle, authorName, description, keywords, bisacCodes, isbn, isbns (per format), pageCount. Also auto-generates a URL slug from the extracted title.

### Stripe Integration

```
src/lib/stripe/index.ts    — Lazy-initialized via Proxy pattern
src/lib/stripe/connect.ts  — Express account creation, onboarding links, status checks
```

Payment flow: PaymentIntent with `application_fee_amount` (based on author tier) and `transfer_data[destination]` (author's Stripe account). Webhook creates Order record and triggers Lulu fulfillment for print formats.

### Lulu Integration

```
src/lib/lulu/client.ts          — OAuth token management with promise-based lock
src/lib/lulu/cost-calculator.ts  — Print cost calculation
src/lib/lulu/pod-packages.ts    — Pod Package ID lookup (API + local fallback)
src/lib/lulu/file-validator.ts   — File validation
src/lib/lulu/print-jobs.ts      — Create/manage print jobs
src/lib/fulfillment/index.ts    — FulfillmentProvider interface
src/lib/fulfillment/lulu-provider.ts — Lulu implementation
```

### Storefront (Public Pages)

```
src/app/(storefront)/layout.tsx                    — Header + footer
src/app/(storefront)/[author]/page.tsx             — Author page with book grid
src/app/(storefront)/[author]/[book]/page.tsx      — Book landing page (SEO meta, cover, formats, email capture)
src/app/(storefront)/[author]/[book]/checkout/page.tsx — Stripe Elements checkout
src/app/(storefront)/[author]/[book]/success/page.tsx  — Order confirmation
```

### UI Components

```
src/components/ui/button.tsx       — Variants: primary/secondary/outline/ghost/danger, sizes, loading state
src/components/ui/input.tsx        — Label, error state, leaf-colored focus ring
src/components/ui/textarea.tsx     — Same pattern as input
src/components/ui/file-dropzone.tsx — Drag-and-drop with progress bar
```

### Config

```
src/config/pricing.ts — PLATFORM_FEES: { FREE: 0.2, STARTER: 0, PRO: 0, ENTERPRISE: 0 }
tailwind.config.ts    — Custom 'leaf' color palette (50-950 green shades)
src/styles/globals.css — @import "tailwindcss" + @config directive
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."          # Neon PostgreSQL

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."                    # Generated random secret

# Google OAuth (optional — credentials login works without it)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Storage (Cloudflare R2)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="leafbooks"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"
NEXT_PUBLIC_R2_PUBLIC_URL="https://pub-xxx.r2.dev"  # Same value, client-accessible

# AI
ANTHROPIC_API_KEY="sk-ant-..."

# Stripe (test mode)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."    # Same value
STRIPE_WEBHOOK_SECRET=""

# Lulu (not yet configured)
LULU_CLIENT_KEY=""
LULU_CLIENT_SECRET=""
LULU_SANDBOX="true"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
PLATFORM_FEE_PERCENT="20"
```

R2 bucket CORS must allow `http://localhost:3000` with methods GET, PUT, POST, HEAD and AllowedHeaders `*`.

---

## Known Bugs & Issues Fixed

### Critical (all fixed)
- PrismaAdapter incompatible with UserEmail model → custom adapter overrides
- NEXT_REDIRECT detection wrong → uses `isRedirectError()` now
- Route group URLs had `/dashboard/` prefix → all corrected to `/titles`, `/settings`, etc.
- Tailwind v4 config not loading → added `@config` directive to globals.css
- Satori empty fonts array → loads system font or fetches Inter from Google Fonts
- `0 || 0.2` fee bug → changed to `?? 0.2` (nullish coalescing)
- Wizard step 1 infinite render loop → moved to useEffect
- PDF >100 pages broke AI extraction → truncates to first 50 pages via pdf-lib
- Cover dropzone rejected PDFs → now accepts PDF covers
- Cover image URLs were storage keys → now stores full public URL

### Medium (all fixed)
- Debounced save lost data on unmount → flushes pending saves
- Zod schema rejected null → nullable fields use `.nullish()`
- Order set to FULFILLED prematurely → stays PAID until Lulu webhook confirms SHIPPED
- Lulu webhook had no auth → Bearer token verification added
- Lulu OAuth token race condition → promise-based lock
- Pod Package IDs were fabricated → API lookup with local fallback
- Slug regex rejected single chars → updated pattern
- Publish had no status guard → prevents re-publishing
- AI extraction didn't refresh UI → re-fetches book data after extraction
- Slug not updated from extraction → auto-generates slug from extracted title

---

## Backlog (Not Yet Built)

1. **AI extraction progress animation** (Task #20) — When navigating to Title Details after upload, the page is blank for ~60s while extraction runs. Need skeleton/shimmer placeholders and status messages ("Reading your manuscript...", "Extracting details...") with animated reveal when data arrives.

2. **Leaf Edition (web ereader)** — PRD exists at `docs/prd/Leaf Reader PRD.pdf`. This is the next major feature to build.

3. **Bonus material library** — Authors build a library of bonus materials (PDFs, templates, checklists)
4. **Bundles** — Compose from book formats + bonus materials + services
5. **Cross-author promotions** — Growth tool for audience building
6. **Email marketing integrations** — Beehiiv, Kit (ConvertKit), Mailchimp
7. **Author subscription billing** — Paid tiers (Starter, Pro, Enterprise)
8. **Offset printing option** — Fulfillment provider abstraction already in place

---

## How to Run

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Fill in DATABASE_URL, NEXTAUTH_SECRET, and service API keys

# Push schema to database
npx prisma db push

# Start dev server
npm run dev
# → http://localhost:3000

# Other commands
npm run build          # Production build
npx prisma studio      # Database GUI
npx tsc --noEmit       # Type check
```

---

## Testing Status

The app has been manually tested through the full title creation workflow:
- Registration/login with credentials ✓
- Create new title → wizard opens ✓
- Upload manuscript PDF (1.3MB, "Great Founders Write") → uploads to R2 ✓
- Upload cover PDF → uploads to R2 ✓
- AI extraction auto-fills title details (after pdf-lib truncation fix) ✓
- Format setup with ISBN per format ✓
- Review step with cover image ✓
- Launch step with slug editing ✓

Not yet tested (needs Stripe Connect onboarding):
- Publishing (requires connected Stripe account)
- Full checkout flow
- Lulu fulfillment (no API keys configured)

No automated tests have been written yet.

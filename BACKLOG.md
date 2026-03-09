# LeafBooks Backlog

## Leaf Reader
- [ ] Add progress/status bar during content processing so users know it's working and not frozen (e.g., "Processing chapter 3 of 21...")

## Grow Tab
- [ ] Add "Grow" section to dashboard sidebar with 4 sub-features:
  - Email subscribers (functional — show real data from EmailSubscriber model)
  - Referrals (placeholder — reader referral program)
  - Affiliates (placeholder — affiliate partnerships)
  - Cross-Promote (placeholder — cross-author promotions, model exists)

## Bonus Library
- [ ] Author-level page to manage bonus materials (PDFs, URLs, videos, services, courses)
- [ ] API routes: CRUD at /api/bonus-materials
- [ ] Dashboard page at /bonus-library with grid + add/edit modal
- [ ] Schema already added: BonusMaterial model with 8 types
- [ ] File upload to R2 (deferred — URLs only for now)

## Bundles
- [ ] New wizard step "Bundles" between Formats and Review (renumber steps 5→7)
- [ ] Bundle builder: name, price, select formats + bonus materials to include
- [ ] API routes: CRUD at /api/books/[id]/bundles
- [ ] Sales page: show bundles alongside individual formats in FormatSelector
- [ ] Checkout integration: bundle price in PaymentIntent, bundleId in metadata
- [ ] DB migration for existing books: UPDATE wizardStep + 1 WHERE wizardStep >= 5
- [ ] Schema already added: Bundle, BundleItem models

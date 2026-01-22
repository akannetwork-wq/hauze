# Netspace Roadmap & Tasks

## Phase 1: Admin UX Refactor (COMPLETE)
- [x] Refactor Sidebar/Layout to support 3-column / Sub-Menu architecture.
- [x] Implement Global Right Drawer (Sheet) component.
- [x] Integrate Global Drawer into core workflows (Orders, Accounting, Personnel).

## Phase 2: Performance Optimization (COMPLETE)
- [x] Slim Middleware: Move auth check to layouts/fetchers.
- [x] Public Site Caching: Implement `unstable_cache` for page results.
- [x] Dashboard Fetchers: Refactor list views (Pages, Inventory, Personnel) to use streaming fetchers.
- [x] Pagination Enforcement: Implement "Load More" for high-traffic lists.
- [x] Universal Caching: Standardize `React.cache` for request-level memoization.

## Phase 3: Website Builder Components (COMPLETE)
- [x] Product Grid Section: Create a modular section for featuring products on the site.
- [x] Testimonials Section: Implement a slider/grid for customer reviews.
- [x] FAQ Section: Accordion-based FAQ component for public pages.
- [x] CMS Action Updates: Support partial updates for these new section types.

## Phase 4: Background Processing & Cleanup
- [ ] Offload heavy report generation to background triggers.
- [ ] UI Polish for mobile responsiveness on the new builder.

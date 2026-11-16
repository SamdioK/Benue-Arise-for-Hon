# S. T. Hon (SAN) & Co. — Lawshield Partners — Phase 2: Public Catalogue and Service Enquiries

**Working branch:** `implementation/brand-and-foundation`  
**Public page:** `bookshop.html`  
**Administrator:** `admin.html` → S. T. Hon (SAN) & Co. — Lawshield Partners workspace  
**Database:** Supabase project `atstsekevoozausbiqbi`, schema `arise_site`  
**Edge Function:** `commerce-service-request`  
**Status:** Catalogue and service-enquiry foundation implemented. Checkout, cart and digital fulfilment are subsequent phases.

## 1. Purpose

This phase introduces the public S. T. Hon (SAN) & Co. — Lawshield Partners storefront and the first administrator workflows. Visitors can browse published books, choose NGN or USD display currency, filter by category and edition, follow external bookseller links, and submit a professional service enquiry.

## 2. Public storefront

1. Open `bookshop.html` from the portal navigation or homepage quick links.
2. Select NGN or USD in the currency selector. This changes displayed Lawshield Bookshop prices only; it does not convert or alter stored prices.
3. Search by title, author or ISBN.
4. Filter by category and physical/digital edition.
5. Review the available editions and the independently stored NGN/USD prices.
6. Where external retailer links exist, open the relevant listing in a separate tab.
7. External price amounts are displayed only when the administrator explicitly confirms that the source terms permit displaying the price. The recorded source and check time accompany the amount. Otherwise, only the retailer link is shown.

The storefront reads published records from Supabase. It does not use browser storage to persist catalogue or customer data.

## 3. Administrator access

1. Open `admin.html`.
2. Sign in with an existing account in the portal's Supabase administrator allowlist.
3. The commerce workspace is visible to portal administrators and hidden from Profile Manager-only accounts.
4. If the commerce tables are unavailable, verify that the Phase 1 migration is applied and that the signed-in account is authorised.

## 4. Add a book

1. Enter the title, author and URL slug.
2. Select a category if one has been created.
3. Add publisher, ISBN and description details.
4. Choose one or both editions:
   - Physical: enter NGN and USD prices independently. Optionally enter stock quantity and weight.
   - Digital: enter NGN and USD prices independently and upload the PDF/EPUB file to the private `shop-digital` bucket.
5. Upload an optional cover to the public `shop-covers` bucket.
6. Add an optional marketplace reference. The initial form supports one reference; use the separate marketplace-listings manager to add more.
7. Save. The book is created as a draft in Supabase.
8. Review the record and its editions. Use Publish only after confirming the record is complete.

## 5. Add multiple external bookseller listings

1. In the marketplace listing manager, choose the book.
2. Enter the marketplace name and region, such as Amazon US, Amazon UK, a publisher's shop or another bookseller.
3. Enter the HTTPS listing URL.
4. If a reference price is recorded, enter its amount and currency.
5. Confirm the source's terms allow the amount to be displayed before ticking the price-display authorisation checkbox.
6. Save the listing. A book may have multiple marketplace listings.

**Amazon-specific caution:** Do not scrape Amazon or display manually copied Amazon price data as a live price. Use an authorised Amazon programme/API/feed in compliance with its current terms. If that is not available, publish the retailer link without the amount.

## 6. Add a professional service

1. Enter the service title, slug and description.
2. Select one pricing mode:
   - Fixed price: exact NGN and USD prices are required.
   - Starting from: NGN and USD starting prices are required.
   - Quotation: no fixed price is displayed; the customer requests a quote.
3. Save the service as a draft. Publishing and quote administration are managed by the next service-management iteration.

## 7. Receive a service enquiry

1. A visitor opens a published service card.
2. The visitor selects Enquire and submits name, email, optional phone, preferred currency and a description.
3. The browser calls the `commerce-service-request` Edge Function.
4. The function validates the selected service is published, validates the request, applies a per-email rate limit and stores the request server-side.
5. A unique `HBS-SRV` reference is returned to the visitor.
6. The administrator can review the request in the commerce workspace and update its workflow status. Quote drafting and appointment scheduling are later iterations.

## 8. Security and persistence

- The public page reads only published books, active variants and published services.
- Customer enquiry details are submitted to a server-side Edge Function and are not written directly from an anonymous browser to the database.
- The Edge Function uses the Supabase service credential server-side. No service-role key is included in frontend code.
- E-book files remain in a private bucket. This phase does not expose a download URL or grant downloads.
- All saved catalogue records and uploaded files are confirmed by Supabase responses.
- No persistent browser storage, IndexedDB or device-local database is used.

## 9. Current boundaries

- The authenticated customer cart and pending-order preparation are documented in Phase 3. Payment collection is not yet enabled.
- Paystack initialisation, webhook verification, refunds and order receipts are not yet enabled.
- Digital downloads remain unavailable until payment verification and entitlement delivery are implemented.
- Physical stock and delivery management tables exist, but customer checkout and fulfilment workflows are not yet enabled.
- Quote drafting, appointment scheduling, customer notifications and service-request administration are subsequent work.
- No actual book records, marketplace listings or service offerings have been seeded. Administrators must add verified titles and prices.

## 10. Test tasks

1. Create a draft book with a physical edition and a digital edition.
2. Enter different NGN and USD prices and verify both appear correctly when the currency selector changes.
3. Upload a cover and a private e-book file; confirm the cover is publicly readable and the e-book is not.
4. Add two different marketplace links to one book.
5. Record an external price with permission unchecked and confirm only the link appears publicly.
6. Enable permitted price display and confirm the price and checked timestamp appear.
7. Publish a service with quotation-only pricing.
8. Submit a service enquiry and retain the returned request reference.
9. Confirm the request is present in Supabase and that an anonymous user cannot query the service request table directly.
10. Confirm the commerce workspace is unavailable to a Profile Manager-only account.

## 11. Completion checklist

- [x] Public storefront page and portal navigation link.
- [x] NGN/USD display selector.
- [x] Physical and digital edition display.
- [x] Marketplace links and price-display permission gate.
- [x] Administrator book and service draft creation.
- [x] Secure service enquiry Edge Function deployed.
- [x] Administrator service publishing and enquiry status queue.
- [x] Authenticated cart and pending-order preparation (see Phase 3 manual).
- [ ] Payment verification and order fulfilment.
- [ ] Digital download entitlement.
- [ ] Quote and appointment management.
- [ ] End-to-end browser testing with real administrator and customer accounts.

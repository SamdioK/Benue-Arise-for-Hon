# Hon's Bookshop & Services — Phase 1: Commerce Foundation

**Project:** Benue Arise for Hon  
**Working branch:** `implementation/brand-and-foundation`  
**Database:** Supabase project `atstsekevoozausbiqbi`, schema `arise_site`  
**Status:** Foundation migration applied successfully to the connected Supabase project on 16 November 2026.

## 1. Purpose

This phase establishes a secure, extensible commerce data foundation for Hon's Bookshop & Services. It supports physical and digital books, independently maintained NGN and USD prices, external marketplace references, professional services, quotation workflows, orders, payments, delivery tracking and secure digital fulfilment.

This commercial module is operationally and financially separate from campaign donations, political contributions and campaign support.

## 2. Roles and permissions

- **Public visitor:** May read published books, active book variants, public marketplace references, active service categories and published service offerings.
- **Customer:** Places orders and submits service requests through trusted server-side functions. Customer order, payment, address and download records are not exposed through public table policies.
- **Commerce administrator:** Uses the existing Supabase administrator allowlist through `arise_site.is_admin()` to manage catalogue, prices, external references, stock, orders, service requests, quotes, appointments and fulfilment.
- **Payment processor:** Communicates with server-side Edge Functions only. Provider secrets and service-role credentials must never appear in browser code.

## 3. Core design

### Books and formats
- `shop_products` stores the book's bibliographic record: title, author, ISBN, publisher, edition, language, cover, preview and publication status.
- `shop_product_variants` stores separate physical and digital offers for a book.
- Each variant stores its own NGN and USD selling prices. Prices are independently entered and maintained; they are not silently converted from one currency to another.
- A book can be offered in physical format, digital format, or both.
- Physical stock and shipping weight can be recorded. Digital files are stored in a private bucket.

### Marketplace reference prices
- `shop_external_listings` stores marketplace name, region, product/listing identifier, HTTPS listing URL, observed price, currency, observation timestamp, explicit permission to display the price, availability label and capture method.
- Supported capture methods are manual, approved API and approved feed.
- External prices are informational references, not Hon's Bookshop checkout prices.
- Marketplace price displays must follow the relevant marketplace's terms. For Amazon, do not scrape or republish prices/images outside an authorised method. Use an approved Amazon integration where eligible; otherwise show a marketplace link and avoid representing an unverified amount as live.
- Show the source marketplace, currency and the time/date checked whenever a marketplace price is displayed. The administrator must explicitly confirm that the source terms permit the price display; the default is link-only.

### Currency and checkout
- Customers choose NGN or USD.
- A cart is single-currency. The customer must change currency or create a separate cart before adding items priced in another currency.
- Orders, order items and payment records preserve the selected currency and immutable price snapshots.
- The payment amount must be calculated and verified server-side. A browser redirect is not proof of payment.

### Services
- Service offerings support fixed-price, starting-price and quotation-only modes.
- Requests can be reviewed, quoted, accepted, scheduled, completed or declined.
- Quotes store their currency, amount, scope and validity period.
- Appointments store explicit timezone information; default timezone is Africa/Lagos.

## 4. Storage

- `shop-covers`: public book-cover images only.
- `shop-digital`: private e-book files. Never expose permanent public URLs.
- `shop-documents`: private customer/service documents.

Digital fulfilment must issue short-lived signed URLs only after a verified successful payment and must confirm that the order item is entitled to the requested file.

## 5. Security and data persistence

- Row Level Security is enabled on all commerce tables.
- Public table policies expose only published catalogue and active service information.
- Commerce administrator policies use the existing administrator allowlist.
- Customer PII, cart contents, orders, payments, quotes and service requests have no anonymous read/write policy.
- Guest checkout and customer actions must be mediated by validated Edge Functions with rate limits and server-side ownership checks.
- Do not add localStorage, sessionStorage, IndexedDB, Cache API or device-local persistence. Temporary in-memory interface state is acceptable; persistent data must be confirmed by Supabase.
- Never store card numbers, CVV or raw payment credentials.

## 6. Operational workflows

### Administrator: publish a book
1. Create the book record and bibliographic details.
2. Upload the cover to `shop-covers`.
3. Add one or both format variants.
4. Enter NGN and USD prices independently.
5. Add stock quantity and weight for physical copies.
6. Upload the e-book to the private `shop-digital` bucket for digital copies.
7. Add marketplace listing references and record their source and check time.
8. Preview the catalogue record, then publish it.

### Customer: purchase a book
1. Open Hon's Bookshop & Services.
2. Select the preferred currency, NGN or USD.
3. Choose a physical or digital edition.
4. Add books to the cart. The cart enforces one currency.
5. Enter customer and delivery details where applicable.
6. Review item, delivery and total amounts.
7. Pay through the server-created payment reference.
8. The server verifies the provider response and webhook before marking the order paid.
9. Digital access is granted only after successful verification; physical orders proceed to fulfilment.

### Customer: request a service
1. Open Professional Services.
2. Select a fixed-price, starting-price or quotation service.
3. Submit contact details and a clear description.
4. Receive a request reference.
5. Review the quote or appointment communication when issued.

### Administrator: handle a quotation
1. Open the service request queue.
2. Review the request and any permitted attachments.
3. Draft the scope, amount, currency and validity period.
4. Send the quote through the approved notification workflow.
5. Record acceptance/rejection and schedule the work where appropriate.

## 7. Validation and expected outcomes

- A product cannot be published without a valid title, author and slug.
- A variant must have non-negative NGN and USD prices.
- Digital variants require a private digital-file path.
- Physical stock cannot be negative.
- External marketplace URLs must use HTTPS.
- Only published products and active variants are public.
- A cart cannot contain mixed currencies.
- Order totals and payment values must be recomputed and validated server-side.
- Duplicate payment notifications must be idempotent.
- Unverified or failed payments must not unlock digital files or mark an order as paid.
- Customers must not be able to read another customer's records by changing an identifier.

## 8. Troubleshooting

- **Catalogue is empty:** Confirm product status is published, variants are active, category is active and the public read policies are present.
- **Cover is unavailable:** Check the `shop-covers` bucket, object path and public-read policy.
- **Digital download is denied:** Confirm the payment is verified, order item matches the digital variant and the signed URL is generated server-side.
- **Currency mismatch:** Clear the cart through the server-side cart endpoint or use a separate cart for the other currency. Do not convert or combine cart items silently.
- **Marketplace price is stale:** Display its recorded timestamp or suppress the amount until refreshed through an approved source.
- **Administrator cannot edit:** Confirm the signed-in Auth user is in the existing `arise_site.admins` allowlist and `arise_site.is_admin()` returns true.
- **Payment appears pending:** Verify provider reference and webhook processing. Do not manually mark an order paid based only on a customer screenshot.

## 9. Training tasks

1. Create a draft book with both physical and digital variants.
2. Enter separate NGN and USD prices and explain why the values are not automatic conversions.
3. Add an Amazon or other marketplace listing URL with a manual observation timestamp.
4. Publish a service offering in quotation-only mode.
5. Trace a test order from cart through server-side payment verification.
6. Demonstrate that a digital file remains inaccessible before payment verification.
7. Confirm that a public visitor cannot read customer, order, payment or service-request records.

## 10. Completion checklist

- [x] Migration reviewed and applied to the intended Supabase project.
- [x] RLS enabled on all commerce tables; administrator policies installed.
- [x] Public cover and private digital/document storage buckets created; storage policies installed.
- [ ] Public catalogue read tests pass.
- [ ] Customer/private data access tests pass.
- [ ] No persistent browser/device storage introduced.
- [ ] Phase 1 manual retained in this repository branch.

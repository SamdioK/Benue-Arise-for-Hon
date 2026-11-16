# Lawshield Partners — Phase 3: Customer Accounts, Cart and Order Preparation

**Brand:** S. T. Hon (SAN) & Co. — Lawshield Partners  
**Working branch:** `implementation/brand-and-foundation`  
**Pages:** `bookshop.html`, `cart.html`  
**Database schema:** `arise_site` in the connected Supabase project  
**Migrations:** `20261116100000_lawshield_customer_cart_rpcs.sql`, `20261116110000_lawshield_order_preparation.sql`  
**Status:** Authenticated cart and pending-order preparation implemented. Payment gateway integration remains disabled.

## 1. Purpose

This phase enables customer accounts, persistent server-side shopping carts, currency-consistent cart operations, and preparation of orders using prices held in Supabase. It does not collect payment or mark an order as paid.

## 2. Customer account

1. From the Bookshop, select **Add to cart** on a physical or digital edition.
2. The customer is directed to `cart.html`, with the chosen edition identified in the URL.
3. A new customer can create an account with full name, email, optional phone number and password.
4. An existing customer signs in with email and password.
5. Email confirmation may be required according to the Supabase Auth project settings.
6. After sign-in, the cart is retrieved from Supabase. If the customer arrived with a selected edition, the item is added and the one-time selection is removed from the page URL.

## 3. Persistent cart

- Cart and cart-item records are stored in `arise_site.shop_carts` and `arise_site.shop_cart_items`.
- The browser does not use localStorage, sessionStorage or IndexedDB to save cart state.
- The page uses an in-memory authentication session. If the customer closes or reloads the page and the session is no longer available, they sign in again; the cart itself remains in Supabase.
- Customers can change quantities and remove items.
- Quantity is restricted to 1–50 per edition.
- Physical stock limits are checked against the catalogue.
- The cart uses one currency at a time. If it contains items in NGN, it cannot be switched to USD until emptied, and vice versa.
- The RPC functions validate the authenticated user and execute cart operations server-side. The browser is not granted direct access to customer cart tables.

## 4. Order preparation

1. Review each edition, quantity and unit price.
2. Confirm the cart currency.
3. Enter customer name, email and phone.
4. For physical books, provide street address, city and country.
5. Submit **Prepare order — payment not yet enabled**.
6. The database checks the customer identity, active cart, published product status, active variant and stock availability.
7. Current prices are recalculated from the catalogue in the selected cart currency.
8. The database creates an order and order-item snapshots, then marks the cart as converted.
9. The customer receives an order number and the total amount.
10. The order remains `pending_payment`. It is not a paid order, receipt of payment or fulfilment authorisation.

Stock is not decremented at order preparation. It must be rechecked and reserved/decremented atomically during verified payment confirmation in the payment phase.

## 5. Customer order history

The signed-in customer can view their recent order numbers, amounts, currency, status and creation date. The history is returned by an authenticated database function, not by a direct browser query against order tables.

## 6. Security and persistence

- Customer cart functions require an authenticated Supabase user.
- The database resolves the customer record from `auth.uid()`; the browser cannot choose another customer's ID.
- Cart and order functions use `SECURITY DEFINER` with a restricted search path and authenticated-only execute grants.
- The customer-facing browser code uses the Supabase publishable key and RLS; no service-role credential is shipped to the browser.
- Cart records, order records and order-item snapshots are stored in Supabase.
- No persistent browser storage is used for customer data, cart contents or session persistence.
- A pending order is not represented as paid. Paystack integration and webhook verification are not enabled in this phase.

## 7. Important current boundaries

- No card or bank payment is collected.
- No Paystack initialisation, verification or webhook processing is active.
- No payment receipt is issued.
- No digital download entitlement is granted.
- Delivery fees are currently zero and must be configured before live physical-book checkout.
- Stock is checked at order preparation but not reserved until the payment phase.
- Customer password reset and email notification workflows require separate implementation and testing.

## 8. Test tasks

1. Create a customer account and confirm the Supabase Auth user is created.
2. Add a physical edition and a digital edition to the cart.
3. Verify that the database cart survives sign-out and a later sign-in.
4. Increase and decrease quantities and remove an item.
5. Attempt to change the currency while the cart has items; confirm the database rejects the switch.
6. Empty the cart and switch between NGN and USD.
7. Prepare an order with physical books and confirm address validation.
8. Prepare an order containing digital books only.
9. Confirm order numbers and item price snapshots are saved in Supabase.
10. Confirm each prepared order remains `pending_payment` and no payment is recorded.
11. Confirm anonymous users cannot execute the cart or order RPC functions.
12. Confirm customer A cannot retrieve customer B's cart or order history.

## 9. Completion checklist

- [x] Supplied Lawshield scales-of-justice symbol integrated as SVG.
- [x] Customer account sign-up and sign-in interface.
- [x] Authenticated cart database functions.
- [x] Add, update quantity and remove cart item operations.
- [x] NGN/USD single-currency cart enforcement.
- [x] Pending-order preparation with server-side price snapshots.
- [x] Authenticated customer order-history function.
- [ ] Live browser testing with real customer accounts.
- [ ] Delivery fee and fulfilment configuration.
- [ ] Paystack initialisation, webhook verification and payment confirmation.
- [ ] Receipts and digital download entitlement.

## 10. Lawshield contact directory and administrator management

The commercial website uses `lawshield-contact.html`. It is independent of the Benue Arise campaign's `contact.html` page. Storefront and cart Contact links point to the Lawshield page.

The Lawshield administrator can manage the firm's commercial contact channels from the **Lawshield contact details and social channels** panel in the Commerce Administrator workspace.

Fields include:
- Main telephone number and WhatsApp number
- Customer-care/business email
- Office or correspondence address
- Firm website
- Facebook, Instagram, LinkedIn, X and YouTube links
- A short contact-page introduction

### Save and publication workflow

1. Sign in to the authorised portal administrator account.
2. Open the Lawshield Commerce workspace.
3. Enter only verified firm contact details and official social profile URLs.
4. Choose **Save as draft** while information is awaiting confirmation. Draft information is private and cannot be read by anonymous visitors.
5. Choose **Publish contact details** only after verifying the details. At least one direct contact method (telephone, WhatsApp or email) is required.
6. The public Lawshield contact page reads only the published record. If no record is published, it displays a clear pending-update message and does not invent contact details.

### Security and independence

- Contact information is stored in `arise_site.lawshield_contact_profiles`.
- Row-level security allows public reading only when the record status is `published`.
- Only an authenticated account on the existing administrator allowlist can create or change the contact record.
- Draft contact details remain private in Supabase.
- The commercial contact directory does not reuse campaign phone numbers, social handles, donations or campaign enquiry forms.
- The page uses only details uploaded and published by the Lawshield administrator.

### Contact directory test tasks

1. Open `lawshield-contact.html` before any contact details have been published; confirm the pending-update message appears.
2. Save sample details as a draft; confirm they do not appear on the public page.
3. Attempt an anonymous read of a draft row; confirm RLS returns no row.
4. Publish verified test details; confirm the public page displays only the supplied details.
5. Confirm HTTPS social URLs open in a new tab with safe link attributes.
6. Confirm the commercial Contact links from the Bookshop and Cart open `lawshield-contact.html`, not the campaign Contact page.
7. Confirm the campaign `contact.html` remains a separate page and is not overwritten.

## 11. Dedicated customer sign-in and registration experience

The customer account landing page is `customer-account.html`. It provides the branded Lawshield sign-in composition with a legal-library visual panel, firm identity, customer access features, sign-in form, account registration, password recovery, password visibility control, and security information.

### Customer workflow

1. Open **My Account** from the Bookshop or Cart navigation.
2. Sign in using the email address and password registered with Supabase Auth.
3. New customers can choose **Create a New Account** and provide their name, email, optional phone number and password.
4. Customers who cannot access their account can request a password-reset email.
5. Follow the secure email link to choose a new password.
6. After successful sign-in, the page confirms the active account and provides links to the Bookshop and Cart.
7. The Cart also retains its own sign-in form for direct checkout access.

### Session and persistence policy

- Supabase Auth handles credentials; passwords are never written to application tables or browser storage.
- The account page sets `persistSession:false`; the session remains in page memory only and is not written to localStorage, sessionStorage or IndexedDB.
- A customer may need to authenticate again when navigating to another page or reloading. This is deliberate until a server-managed session hand-off is designed that preserves the project's no-browser-persistence requirement.
- The Remember-me device persistence option is intentionally not offered.

### Test tasks

1. Test sign-in with a valid customer account and an invalid password.
2. Create a new account and confirm the email-confirmation flow if enabled in Supabase Auth.
3. Request a password reset and complete it from the email link.
4. Test show/hide password controls.
5. Confirm the page is responsive at phone, tablet and desktop widths.
6. Confirm no localStorage, sessionStorage or IndexedDB calls exist in the customer account files.


## 12. Global telephone entry and email-confirmation recovery

The registration form now uses the international telephone input component. The phone field uses an integrated country flag and calling-code prefix at the left edge of the same textbox. The visitor's country is detected using an IP-country lookup, with Nigeria (+234) as the fallback and first preferred country in the searchable list. Customers can change the selected country at any time. The selected number is formatted as the customer types, validated and normalised to E.164 before it is submitted as Supabase Auth user metadata. The prefix is displayed as part of the field but is not editable as ordinary typed text; changing the country selector changes the prefix. A valid example format is `+2348012345678`; the country dialling code is included in the stored value. The phone field remains optional.

The registration confirmation message is deliberately worded so it does not claim that an email has definitely arrived. Customers should check Inbox, Spam/Junk and Promotions. The **Resend confirmation email** control calls Supabase Auth's signup-resend endpoint for customers whose address still needs confirmation. If Supabase reports that the address is already confirmed, the customer is instructed to sign in or use password recovery instead.

### Support and verification

- A successful signup API response is not proof of inbox delivery.
- A repeated signup for an existing account may be accepted with a generic response to prevent account enumeration; it does not mean a new confirmation message was sent.
- If a customer reports a missing message, inspect the Auth user's `email_confirmed_at` and the Auth logs before asking them to register again.
- If the account is already confirmed, direct the customer to **Sign In** or **Forgot password?**; do not ask them to create another account.
- For a genuinely unconfirmed account, use **Resend confirmation email**, then check the configured Supabase SMTP/provider delivery logs and the recipient's spam folders.
- Test phone entry with Nigeria (+234), United Kingdom (+44), United States (+1), Ghana (+233), and at least one additional country. Confirm the saved phone value includes the correct country calling code and is in E.164 format.
- Confirm the selector is usable on narrow mobile screens and can search by country name or calling code.
- The phone selector does not store data in browser storage. The validated international phone string is submitted to Supabase Auth metadata.

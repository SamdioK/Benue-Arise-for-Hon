# Lawshield Partners Commerce — Paystack and Business Identity Compliance Gate

**Trading identity:** S. T. Hon (SAN) & Co. (Lawshield Partners)  
**Commerce label:** Lawshield Books & Professional Services  
**Working branch:** `implementation/brand-and-foundation`  
**Status:** Compliance verification required before live payment activation.

## 1. Business identity

The attached firm letterhead identifies the practice as **S. T. Hon (SAN) & Co. (Lawshield Partners)** and uses a scales-of-justice mark. The commerce storefront has been rebranded to this identity.

The displayed brand must not be used to misstate the legal merchant, registered business, beneficial owner, nature of goods/services or settlement account. The Paystack legal business name and compliance records must match the actual registration documents. The public trading name may be Lawshield Partners where Paystack's trading-name rules permit it.

## 2. Paystack international payments

According to Paystack's current support guidance:

1. Confirm the business is activated and its compliance requirements are complete.
2. Open Paystack Dashboard → Settings → Preferences.
3. Check whether **Accept international payments** is enabled.
4. If it is not enabled, submit **Request international payments** from Preferences. Paystack says a response is normally provided within 48 working hours after a successful request.
5. Do not treat international-card acceptance as proof that USD settlement is already configured.

Official guidance: https://support.paystack.com/en/articles/2130690

## 3. USD settlement for a Nigeria-based merchant

Paystack states that a Nigeria-based business needs a **Zenith Bank USD domiciliary account** for USD payouts.

1. Open Paystack Dashboard → Settings → Accounts.
2. Select Add USD account.
3. Supply the required domiciliary account details.
4. Wait for Paystack's review and confirmation.
5. Verify USD is enabled as a transaction currency before enabling USD checkout in the storefront.

Official guidance: https://support.paystack.com/en/articles/2130690

## 4. Business-category and international-payment restrictions

Paystack's international-payment eligibility page lists **political parties** among business types ineligible for international payments. It also says sale of e-books and other digital products receives additional scrutiny and requires complete compliance documentation plus a valid website or social media page showing where the products are sold.

Paystack's supported-business categories list includes **legal services** for registered businesses, subject to the applicable registration documents and compliance requirements.

Official guidance:
- https://support.paystack.com/en/articles/2127682
- https://support.paystack.com/en/articles/2129730

**Important:** Naming a campaign-associated shop after a law firm does not change the actual merchant or make a prohibited activity eligible. The business must be genuinely owned and operated by the firm or other correctly disclosed registered merchant, and proceeds must not be collected for or on behalf of a political party. If the legal ownership, business activity or beneficiary relationship is unclear, obtain written confirmation from Paystack before processing transactions.

## 5. Recommended separation before launch

The current portal is a political/public campaign website. For a clean commercial and compliance presentation, the Lawshield storefront should ultimately have:

- A standalone Lawshield Partners business domain or subdomain.
- A dedicated firm-branded storefront, customer account, cart, checkout, receipts and customer support identity.
- A merchant Paystack profile whose legal entity, trading name, ownership and business category accurately reflect the actual firm.
- Commercial sales records and settlement accounts kept separate from campaign donations, political contributions and campaign accounts.
- A clear catalogue of real books and legal/professional services, with accurate prices, terms, delivery information, privacy notice and refund policy.

This is a risk-control recommendation, not a guarantee of Paystack approval.

## 6. E-book and marketplace pricing

- Do not activate e-book payments until Paystack has reviewed the actual digital products and approved the business for the required payment channels.
- Do not scrape Amazon or other retailer websites.
- Display third-party marketplace prices only through a permitted API, feed or other source method authorised by that retailer's current terms.
- Otherwise, show the external listing link and ask the customer to verify the retailer's current price there.
- Keep the firm's own NGN and USD prices independently set and clearly distinguished from external retailer prices.

## 7. Release gate

The live checkout must remain disabled until all applicable checks below are completed:

- [ ] Confirm the actual legal merchant and CAC/business registration category.
- [ ] Confirm Paystack account ownership and trading name match the firm.
- [ ] Confirm Paystack has reviewed the real business model and the connection, if any, to the campaign portal.
- [ ] Confirm international payments are enabled in Preferences.
- [ ] Confirm the USD domiciliary account has been approved and USD is enabled.
- [ ] Obtain Paystack's written position on the proposed e-book and service categories where required.
- [ ] Publish the standalone business website, customer support details, terms, privacy and refund/delivery policies.
- [ ] Complete successful low-value NGN and (only after approval) USD test transactions.
- [ ] Verify server-side payment verification, webhook signatures, idempotency, receipts and refund handling.

No production payment route should be enabled by merely ticking a frontend setting.

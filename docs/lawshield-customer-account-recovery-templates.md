# Lawshield customer account recovery message templates

These templates are for the customer authentication experience of **S. T. Hon (SAN) & Co. — Lawshield Partners**, including Hon's Bookshop & Services.

## Email OTP template

In Supabase Dashboard, open **Authentication → Email Templates → Magic Link**. Use the subject and body below. The customer recovery screen requests an email OTP and verifies it in the browser before allowing a password change.

**Subject**

Your Lawshield Partners account verification code

**Body (HTML)**

```html
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:28px;color:#211c1c;border:1px solid #e9e2ec;border-radius:14px">
  <div style="text-align:center;border-bottom:3px solid #e6ad31;padding-bottom:18px">
    <h2 style="margin:0;color:#06432f">S. T. HON (SAN) &amp; CO.</h2>
    <p style="margin:7px 0 0;color:#50136a;font-weight:bold;letter-spacing:2px">LAWSHIELD PARTNERS</p>
    <p style="margin:8px 0 0;color:#68616d">Hon's Bookshop &amp; Services</p>
  </div>
  <h2 style="color:#06432f;margin:26px 0 10px">Verify your customer account</h2>
  <p>Use the one-time verification code below to continue resetting your Lawshield Partners customer account password.</p>
  <div style="margin:24px 0;padding:18px;text-align:center;background:#f5eff7;border:1px solid #e6ad31;border-radius:12px">
    <div style="font-size:30px;font-weight:bold;letter-spacing:8px;color:#50136a">{{ .Token }}</div>
  </div>
  <p>This code is for your account security. Do not share it with anyone, including anyone claiming to represent the firm.</p>
  <p>If you did not request this code, you can safely ignore this email.</p>
  <p style="margin-top:26px;color:#06432f;font-weight:bold">S. T. Hon (SAN) &amp; Co.<br>Lawshield Partners</p>
  <p style="font-size:12px;color:#777">Customer account security • Hon's Bookshop &amp; Services</p>
</div>
```

## SMS OTP template

In Supabase Dashboard, open **Authentication → SMS Templates** and set the message body to:

```text
S. T. Hon (SAN) & Co. — Lawshield Partners (Hon's Bookshop & Services): Your secure account verification code is {{ .Code }}. Do not share this code with anyone. If you did not request it, ignore this message.
```

## Important configuration and eligibility

1. Configure a production SMS provider under **Authentication → Providers → Phone** and confirm that SMS OTP is enabled. SMS delivery is not provided merely by adding a phone number to customer profile metadata.
2. Phone recovery works only when the phone number is a verified phone identity on the same Supabase Auth user. The current registration flow records the phone number in user metadata; that is not equivalent to a verified Auth phone identity. Existing customers must complete a separate phone-verification/linking step before phone recovery can work.
3. Configure the email OTP template above and use a production-ready SMTP provider with a verified sender domain for dependable email delivery.
4. Keep the Supabase Auth redirect/allowed URL configuration aligned with the deployed customer-account page.
5. Never place OTP values, service-role keys, SMTP credentials, or SMS provider secrets in frontend code.
6. The UI must not reveal whether an email or phone number belongs to an account. Generic delivery wording helps prevent account enumeration.

## Test checklist

- Request email OTP for an existing account, verify the code, set a new password, then sign in with it.
- Request SMS OTP only for a phone number verified and linked in Supabase Auth, verify the code, set a new password, then sign in with it.
- Confirm wrong, expired, and reused codes are rejected.
- Confirm unknown email addresses do not produce an account-existence disclosure.
- Confirm no OTP or password is written to browser persistent storage or application logs.

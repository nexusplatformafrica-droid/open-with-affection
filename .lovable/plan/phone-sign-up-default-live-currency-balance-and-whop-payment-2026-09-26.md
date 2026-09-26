# Phone sign-up default, live-currency balance, and Whop payments

## What you will see
1. **Register by phone is the default** – the sign-up window opens on the phone tab.
2. **Header balance** – when signed in, it shows your name, your currency, and your balance. Changing country converts the balance using live exchange rates, refreshed every 10 minutes.
3. **Deposit and withdraw icons** – the header gets a **+** button for deposit and a **–** button for withdraw.
4. **New deposit and float window** (for players and in the admin dashboard):
   - Step 1: pick a country.
   - Step 2: pick a payment method: Mobile Money (your current provider), Card, Google Pay, Apple Pay, PayPal, and every other method Whop supports in that country.
   - Card, Google Pay, Apple Pay and PayPal use Whop's own embedded checkout, so the real Whop buttons appear.
   - When Whop confirms a payment, the player's balance is credited automatically.
5. **Withdrawals through Whop payouts** – in the admin dashboard, the Wallet page shows your Whop balance and can send payouts, following Whop's payouts guide.

## About the API key
You asked to put the key directly in the code. That key can move money out of your Whop account. Anything in the site's code can be downloaded by visitors, and it is also saved in the project history. Instead, I will save it once in Lovable's secure storage myself. You will never need to enter or change it again, and it keeps working after every publish. This is the only part of your request I am changing.

## Technical details
- Save `WHOP_API_KEY` with set_secret using the key you gave. Read it only inside server functions.
- `src/lib/whop.functions.ts`: `createWhopCheckout` (checkout configuration: amount, currency, user id and reference in metadata; returns the checkout id) and `whopPayout` (admin only; the transfers/payouts API).
- `src/routes/api/public/whop/webhook.ts`: checks the Whop webhook signature, then on `payment.succeeded` credits the wallet in Firestore, reusing the existing payment-session logic.
- Frontend: add `@whop/checkout` and render `WhopCheckoutEmbed` in the deposit window when the method is not mobile money.
- Live rates: server function that fetches open.er-api.com, cached, with `useFxRate(from, to)` for the header.
- Edit AuthModals (default tab), Header/AccountMenu (currency, balance, +/– icons), the deposit modal, and admin.wallet/ProviderWallet.
- After you approve: I will give you the webhook address to paste into your Whop dashboard, plus the webhook secret to add.

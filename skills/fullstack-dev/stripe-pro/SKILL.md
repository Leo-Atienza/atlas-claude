---
name: stripe-pro
description: Stripe Checkout, Subscriptions, Webhooks, Customer Portal patterns for Next.js and React Native
keywords: [stripe, payments, checkout, subscription, webhook, customer portal, billing]
version: 1.0.0
---

# Stripe Pro

Expert-level Stripe integration patterns for Next.js App Router and React Native.

## 1. Server-side Client Setup

```ts
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
});
```

Env vars: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.
Rule: `STRIPE_SECRET_KEY` is server-only. Never import `lib/stripe.ts` in a Client Component.

## 2. Checkout Sessions

### Hosted Checkout (redirect)

```ts
// app/actions/checkout.ts
'use server';
import { stripe } from '@/lib/stripe';
import { redirect } from 'next/navigation';

export async function createCheckoutSession(priceId: string, userId: string) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    client_reference_id: userId,
    metadata: { userId },
  });
  redirect(session.url!);
}
```

### Embedded Checkout (stays on your domain)

```ts
// app/api/checkout/route.ts
export async function POST(req: Request) {
  const { priceId, userId } = await req.json();
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/return?session_id={CHECKOUT_SESSION_ID}`,
    metadata: { userId },
  });
  return NextResponse.json({ clientSecret: session.client_secret });
}
```

## 3. Customer Portal

```ts
// app/actions/portal.ts
'use server';
export async function createPortalSession(stripeCustomerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
  });
  redirect(session.url);
}
```

Configure in Stripe Dashboard > Billing > Customer portal first.

## 4. Webhook Handling

**Golden rule**: use `req.text()` — never `req.json()`. Raw body required for signature verification.

```ts
// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency: skip already-processed events
  const seen = await db.webhookEvents.findUnique({ where: { id: event.id } });
  if (seen) return NextResponse.json({ received: true });

  try {
    await handleStripeEvent(event);
    await db.webhookEvents.create({ data: { id: event.id, type: event.type } });
  } catch (err) {
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await db.users.update({
        where: { id: session.metadata?.userId },
        data: { stripeCustomerId: session.customer as string, plan: 'pro' },
      });
      break;
    }
    case 'invoice.payment_failed':
      // Email user, restrict access gracefully
      break;
    case 'customer.subscription.updated':
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await db.users.update({
        where: { stripeCustomerId: sub.customer as string },
        data: { plan: 'free' },
      });
      break;
    }
  }
}
```

## 5. Subscription Lifecycle

```
checkout.session.completed   → trialing | active
invoice.paid                 → active, update current_period_end
invoice.payment_failed       → past_due, notify user
subscription.updated         → check cancel_at_period_end
customer.subscription.deleted → revoke access, downgrade to free
```

Sync helper:
```ts
async function syncSubscription(sub: Stripe.Subscription) {
  await db.subscriptions.upsert({
    where: { stripeSubscriptionId: sub.id },
    update: {
      status: sub.status,
      cancelAtEnd: sub.cancel_at_period_end,
      periodEnd: new Date(sub.current_period_end * 1000),
      priceId: sub.items.data[0].price.id,
    },
    create: {
      stripeSubscriptionId: sub.id,
      stripeCustomerId: sub.customer as string,
      status: sub.status,
      cancelAtEnd: sub.cancel_at_period_end,
      periodEnd: new Date(sub.current_period_end * 1000),
      priceId: sub.items.data[0].price.id,
    },
  });
}
```

## 6. Price Management

```ts
// Always fetch prices server-side — never trust client-passed amounts
const prices = await stripe.prices.list({
  active: true,
  expand: ['data.product'],
  lookup_keys: ['pro_monthly', 'pro_yearly'],
});
```

Use lookup keys over hardcoded IDs — rotate prices without code changes.

## 7. Stripe CLI — Local Testing

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Outputs whsec_xxxx → set as STRIPE_WEBHOOK_SECRET in .env.local

stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
```

Test cards: `4242 4242 4242 4242` (success), `4000 0000 0000 0341` (fails), `4000 0027 6000 3184` (3DS).

## 8. React Native / Expo

```bash
npx expo install @stripe/stripe-react-native
```

Root layout:
```tsx
import { StripeProvider } from '@stripe/stripe-react-native';

export default function RootLayout() {
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      merchantIdentifier="merchant.com.yourapp"
    >
      <Stack />
    </StripeProvider>
  );
}
```

Payment Sheet:
```tsx
const { initPaymentSheet, presentPaymentSheet } = useStripe();

async function checkout() {
  const { paymentIntent, ephemeralKey, customer } = await fetchPaymentSheetParams();
  await initPaymentSheet({
    merchantDisplayName: 'Your App',
    customerId: customer,
    customerEphemeralKeySecret: ephemeralKey,
    paymentIntentClientSecret: paymentIntent,
    googlePay: { merchantCountryCode: 'US', testEnv: __DEV__ },
    applePay: { merchantCountryCode: 'US' },
  });
  const { error } = await presentPaymentSheet();
  if (!error) router.push('/success');
}
```

## 9. Error Handling

```ts
// StripeCardError           → safe to show user
// StripeRateLimitError      → retry with backoff
// StripeInvalidRequestError → developer error, log err.param
// StripeAPIError            → Stripe 5xx, retry once
// StripeAuthenticationError → bad API key
```

## Quick Reference

| Task | Pattern |
|------|---------|
| Checkout | Server Action → `stripe.checkout.sessions.create()` |
| Verify webhook | `req.text()` + `stripe.webhooks.constructEvent()` |
| Portal | Server Action → `stripe.billingPortal.sessions.create()` |
| Prices | Server-side, use lookup keys |
| Local webhook | `stripe listen --forward-to localhost:3000/api/webhooks/stripe` |
| Idempotency | Store `event.id`, skip duplicates |
| Never trust | Client-passed price IDs or amounts |

"use client";

import { loadStripe, type Stripe } from '@stripe/stripe-js';

// Client-side only: NEVER use secret keys here
const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

if (!pk && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.error(
    'Missing VITE_STRIPE_PUBLISHABLE_KEY. Set it in your environment for client builds.'
  );
}

/**
 * Stripe.js singleton
 * Initialized once and reused across the app
 */
export const stripePromise: Promise<Stripe | null> | null =
  pk ? loadStripe(pk) : null;

export default stripePromise;

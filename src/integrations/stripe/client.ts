"use client";

import { loadStripe } from '@stripe/stripe-js';

// IMPORTANT: This file is client-side only and must NEVER use server secrets.
// Only use Stripe's publishable key (VITE_STRIPE_PUBLISHABLE_KEY) here.
const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

if (!pk || typeof pk !== 'string') {
  // Fail fast in development if the publishable key is missing or invalid.
  // This avoids accidental attempts to read server secrets on the client.
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error('Missing VITE_STRIPE_PUBLISHABLE_KEY. Set it in your environment for client builds.');
  }
}

// Initialize Stripe.js outside render to avoid re-creation on every render
export const stripePromise = loadStripe(pk ?? "");

export default stripePromise;
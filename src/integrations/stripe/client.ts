"use client";

import { loadStripe, Stripe } from "@stripe/stripe-js";

const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

if (!pk) {
  if (import.meta.env.DEV) {
    console.error(
      "❌ VITE_STRIPE_PUBLISHABLE_KEY não definida. Stripe não será inicializado."
    );
  }
}

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(pk ?? "");
  }
  return stripePromise;
}

export default getStripe;

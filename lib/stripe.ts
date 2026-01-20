import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export const PRICE_IDS = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID!,
  yearly: process.env.STRIPE_YEARLY_PRICE_ID!,
  semester: process.env.STRIPE_SEMESTER_PRICE_ID!,
};

export const PRICES = {
  monthly: 5,
  yearly: 48,
  semester: 18,
};

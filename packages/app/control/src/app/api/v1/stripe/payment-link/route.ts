import Stripe from 'stripe';

import { NextResponse } from 'next/server';

import {
  createCreditsPaymentLink,
  createCreditsPaymentLinkSchema,
} from '@/services/stripe/create-link/credits';

import { authRoute } from '../../../../../lib/api/auth-route';

export const POST = authRoute
  .body(createCreditsPaymentLinkSchema)
  .handler(async (_, context) => {
    try {
      const result = await createCreditsPaymentLink(
        context.ctx.userId,
        context.body
      );
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        return NextResponse.json(
          { message: `Stripe error: ${error.message}` },
          { status: 400 }
        );
      }
      if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
      }
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      );
    }
  });

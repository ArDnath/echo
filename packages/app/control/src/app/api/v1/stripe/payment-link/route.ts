import Stripe from 'stripe';

import { NextResponse } from 'next/server';

import {
  createFreeTierPaymentLinkSchema,
  createPaymentLink,
} from '@/services/stripe';

import { authRoute } from '../../_lib/auth-route';

export const POST = authRoute
  .body(createFreeTierPaymentLinkSchema)
  .handler(async (_, context) => {
    try {
      const result = await createPaymentLink(context.ctx.userId, context.body);
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        return NextResponse.json(
          { error: `Stripe error: ${error.message}` },
          { status: 400 }
        );
      }
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });

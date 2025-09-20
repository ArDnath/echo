import type { z } from 'zod';

import { createAppSchema } from './lib/schemas';

import { queueJob } from '../../../email/queue';
import { EmailType } from '../../../email/emails/types';

import { logger } from '@/logger';
import { db } from '@/services/db/client';
import { AppRole, MembershipStatus } from '@/lib/permissions';

export const createApp = async (
  userId: string,
  data: z.infer<typeof createAppSchema>
) => {
  const validatedData = createAppSchema.safeParse(data);

  if (!validatedData.success) {
    logger.emit({
      severityText: 'WARN',
      body: 'Invalid data provided for app creation',
      attributes: {
        userId,
        validationError: validatedData.error.message,
        function: 'createApp',
      },
    });
    throw new Error(validatedData.error.message);
  }

  try {
    const app = await db.echoApp.create({
      data: {
        name: data.name.trim(),
        markUp: {
          create: {
            amount: data.markup,
          },
        },
        appMemberships: {
          create: {
            userId,
            role: AppRole.OWNER,
            status: MembershipStatus.ACTIVE,
            isArchived: false,
            totalSpent: 0,
          },
        },
        authorizedCallbackUrls: [],
      },
    });

    logger.emit({
      severityText: 'INFO',
      body: 'Successfully created new app',
      attributes: {
        userId,
        appId: app.id,
        appName: app.name,
        markup: data.markup,
        function: 'createApp',
      },
    });

    await queueJob({
      campaign: EmailType.CREATE_APP_FOLLOW_UP,
      payload: {
        userId,
        appName: app.name,
        appId: app.id,
      },
    });

    return app;
  } catch (error) {
    logger.emit({
      severityText: 'ERROR',
      body: 'Error creating app',
      attributes: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        appName: data.name,
        function: 'createApp',
      },
    });
    throw error;
  }
};

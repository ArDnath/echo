import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express, NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { authenticateRequest } from './auth';
import logger, { logMetric } from './logger';
import { HttpError } from './errors/http';
import { PrismaClient } from './generated/prisma';
import { traceEnrichmentMiddleware } from './middleware/trace-enrichment-middleware';
import {
  TransactionEscrowMiddleware,
  EscrowRequest,
} from './middleware/transaction-escrow-middleware';
import standardRouter from './routers/common';
import inFlightMonitorRouter from './routers/in-flight-monitor';
import { buildX402Response, isApiRequest, isX402Request } from 'utils';
import { handleX402Request, handleApiKeyRequest } from './handlers';
import { checkBalance } from './services/BalanceCheckService';
import { modelRequestService } from './services/ModelRequestService';
import { initializeProvider } from './services/ProviderInitializationService';
import { makeProxyPassthroughRequest } from './services/ProxyPassthroughService';
import { getRequestMaxCost } from './services/PricingService';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3069;

// Configure multer for handling form data and file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL ?? 'postgresql://localhost:5469/echo',
    },
  },
  log: ['warn', 'error'],
});

// Initialize the transaction escrow middleware
const transactionEscrowMiddleware = new TransactionEscrowMiddleware(prisma);

app.use(traceEnrichmentMiddleware);

// Add middleware
app.use(
  cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: '*', // Allow all headers
    exposedHeaders: '*', // Expose all headers to the client
    credentials: false, // Set to false when using origin: '*'
    preflightContinue: false, // Handle preflight requests here
    optionsSuccessStatus: 200, // Return 200 for preflight OPTIONS requests
  })
);

// Preserve content-length before body parsing middleware removes it
app.use((req: EscrowRequest, res, next) => {
  // Capture Content-Length from raw request before any parsing
  const rawContentLength = req.headers['content-length'];
  
  logger.info('Raw request headers before parsing:', {
    'content-length': rawContentLength,
    'content-type': req.headers['content-type'],
    method: req.method,
    url: req.url
  });
  
  if (rawContentLength) {
    req.originalContentLength = rawContentLength;
    logger.info(`Preserved Content-Length: ${rawContentLength}`);
  } else {
    logger.info('No Content-Length header in raw request');
  }
  next();
});

app.use(express.json({ limit: '100mb' }));
app.use(upload.any()); // Handle multipart/form-data with any field names
app.use(compression());

// Use common router for utility routes
app.use(standardRouter);

// Use in-flight monitor router for monitoring endpoints
app.use(inFlightMonitorRouter);

// Main route handler
app.all('*', async (req: EscrowRequest, res: Response, next: NextFunction) => {
  try {
    const headers = req.headers as Record<string, string>;

    // VERIFY
    const { processedHeaders, echoControlService } = await authenticateRequest(
      headers,
      prisma
    );

    const { provider, isStream, isPassthroughProxyRoute, providerId } =
      await initializeProvider(req, res, echoControlService);
    const maxCost = getRequestMaxCost(req, provider);
    logger.info(`Max cost: ${maxCost}`);

    if (!isApiRequest(headers) && !isX402Request(headers)) {
      return buildX402Response(res, maxCost);
    }

    if (isX402Request(headers)) {
      await handleX402Request({
        req,
        res,
        processedHeaders,
        echoControlService,
        maxCost,
        isPassthroughProxyRoute,
        providerId,
        provider,
        isStream,
      });
      return;
    }

    if (isApiRequest(headers)) {
      await handleApiKeyRequest({
        req,
        res,
        processedHeaders,
        echoControlService,
        maxCost,
        isPassthroughProxyRoute,
        providerId,
        provider,
        isStream,
      });
      return;
    }

    return res.status(400).json({
      error: 'No request type found',
    });
  } catch (error) {
    return next(error);
  }
});

// Error handling middleware
app.use((error: Error, req: Request, res: Response) => {
  logger.error(
    `Error handling request: ${error.message} | Stack: ${error.stack}`
  );

  if (error instanceof HttpError) {
    logMetric('server.internal_error', 1, {
      error_type: 'http_error',
      error_message: error.message,
    });
    res.status(error.statusCode).json({
      error: error.message,
    });
  } else if (error instanceof Error) {
    logMetric('server.internal_error', 1, {
      error_type: error.name,
      error_message: error.message,
    });
    // Handle other errors with a more specific message
    logger.error('Internal server error', error);
    res.status(500).json({
      error: error.message || 'Internal Server Error',
    });
  } else {
    logMetric('server.internal_error', 1, {
      error_type: 'unknown_error',
    });
    logger.error('Internal server error', error);
    res.status(500).json({
      error: 'Internal Server Error',
    });
  }

  return res.status(500).json({
    erorr: 'Internal Server Error',
  });
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Stop the escrow cleanup process
  transactionEscrowMiddleware.stopCleanupProcess();

  // Close database connections
  prisma
    .$disconnect()
    .then(() => {
      logger.info('Database connections closed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    });
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Only start the server if this file is being run directly
if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
}

export default app;

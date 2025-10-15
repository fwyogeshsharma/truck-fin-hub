import { Router, Request, Response, NextFunction } from 'express';
import { createTrip } from '../../src/db/queries/trips.ts';
import { getUsersByRole } from '../../src/db/queries/users.ts';
import { createNotification } from '../../src/db/queries/notifications.ts';
import { getNotificationTemplate } from '../../src/services/notificationTemplates.ts';

const router = Router();

// Basic Auth credentials (in production, these should be per-shipper)
const BASIC_AUTH_USERNAME = 'shipper_api';
const BASIC_AUTH_PASSWORD = 'shipper_api_password_2024';

// Demo API token (in production, this should be unique per shipper)
const DEMO_API_TOKEN = 'shipper_demo_token';

/**
 * Middleware to validate Basic Authentication
 */
const validateBasicAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Basic authentication required'
    });
  }

  try {
    // Decode Base64 credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // Validate credentials
    if (username !== BASIC_AUTH_USERNAME || password !== BASIC_AUTH_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid authorization header format'
    });
  }
};

/**
 * Middleware to validate API Token
 */
const validateApiToken = (req: Request, res: Response, next: NextFunction) => {
  const apiToken = req.headers['x-api-token'];

  if (!apiToken) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'API token required in X-API-Token header'
    });
  }

  // In production, validate against database of shipper tokens
  if (apiToken !== DEMO_API_TOKEN) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid API token'
    });
  }

  next();
};

/**
 * Validate trip data
 */
const validateTripData = (tripData: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields
  if (!tripData.load_owner_id) errors.push('load_owner_id is required');
  if (!tripData.load_owner_name) errors.push('load_owner_name is required');
  if (!tripData.origin) errors.push('origin is required');
  if (!tripData.destination) errors.push('destination is required');
  if (!tripData.load_type) errors.push('load_type is required');

  // Amount validation
  if (tripData.amount === undefined || tripData.amount === null) {
    errors.push('amount is required');
  } else if (typeof tripData.amount !== 'number') {
    errors.push('amount must be a number');
  } else if (tripData.amount < 20000 || tripData.amount > 80000) {
    errors.push('amount must be between ₹20,000 and ₹80,000');
  }

  // Distance validation
  if (tripData.distance !== undefined) {
    if (typeof tripData.distance !== 'number' || tripData.distance <= 0) {
      errors.push('distance must be a positive number');
    }
  }

  // Weight validation
  if (tripData.weight !== undefined) {
    if (typeof tripData.weight !== 'number' || tripData.weight <= 0) {
      errors.push('weight must be a positive number');
    }
  }

  // Interest rate validation (if provided)
  if (tripData.interest_rate !== undefined) {
    if (typeof tripData.interest_rate !== 'number' || tripData.interest_rate < 8 || tripData.interest_rate > 18) {
      errors.push('interest_rate must be between 8 and 18');
    }
  }

  // Risk level validation (if provided)
  if (tripData.risk_level !== undefined) {
    if (!['low', 'medium', 'high'].includes(tripData.risk_level)) {
      errors.push('risk_level must be one of: low, medium, high');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * POST /api/public/shippers/trips
 * Create trip(s) via public API
 * Requires: Basic Auth + API Token
 *
 * Body can be:
 * - Single trip object
 * - Array of trip objects
 */
router.post('/shippers/trips', validateBasicAuth, validateApiToken, async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Check if body is an array or single object
    const tripsData = Array.isArray(body) ? body : [body];

    if (tripsData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Request body cannot be empty'
      });
    }

    const results = {
      success: true,
      message: '',
      created_count: 0,
      failed_count: 0,
      trip_ids: [] as string[],
      errors: [] as any[],
      shipper: 'Demo Shipper', // In production, get from authenticated user
      company: 'Demo Company'  // In production, get from authenticated user
    };

    // Process each trip
    for (let i = 0; i < tripsData.length; i++) {
      const tripData = tripsData[i];

      // Validate trip data
      const validation = validateTripData(tripData);

      if (!validation.valid) {
        results.failed_count++;
        results.errors.push({
          index: i,
          data: tripData,
          errors: validation.errors
        });
        continue;
      }

      try {
        // Set defaults for optional fields
        const tripToCreate = {
          ...tripData,
          interest_rate: tripData.interest_rate || 12,
          maturity_days: tripData.maturity_days || 30,
          risk_level: tripData.risk_level || 'low',
          insurance_status: tripData.insurance_status !== undefined ? tripData.insurance_status : true,
          status: 'active',
          load_owner_logo: tripData.load_owner_logo || '/default-logo.png',
          load_owner_rating: tripData.load_owner_rating || 4.5,
        };

        // Create the trip
        const trip = await createTrip(tripToCreate);
        results.created_count++;
        results.trip_ids.push(trip.id);

        // Notify lenders about the new trip
        try {
          const lenders = await getUsersByRole('lender');
          const template = getNotificationTemplate('investment_opportunity');

          if (template && lenders.length > 0) {
            const tripNotifData = {
              tripId: trip.id,
              origin: trip.origin,
              destination: trip.destination,
              loadType: trip.load_type,
              amount: trip.amount,
              distance: trip.distance,
              interestRate: trip.interest_rate,
              riskLevel: trip.risk_level,
              maturityDays: trip.maturity_days,
            };

            // Create notifications for all lenders
            for (const lender of lenders) {
              await createNotification({
                userId: lender.id,
                type: 'investment_opportunity',
                title: template.subject,
                message: template.inAppMessage(tripNotifData),
                priority: template.priority,
                actionUrl: `/investment-opportunities`,
                metadata: tripNotifData,
              });
            }

            console.log(`[Public API] Notified ${lenders.length} lenders about new trip ${trip.id}`);
          }
        } catch (notifError) {
          console.error('[Public API] Failed to send notifications:', notifError);
          // Don't fail the trip creation if notifications fail
        }

      } catch (createError: any) {
        results.failed_count++;
        results.errors.push({
          index: i,
          data: tripData,
          errors: [createError.message]
        });
      }
    }

    // Set final message
    if (results.created_count > 0 && results.failed_count === 0) {
      results.message = `${results.created_count} trip(s) created successfully`;
      return res.status(201).json(results);
    } else if (results.created_count > 0 && results.failed_count > 0) {
      results.message = `${results.created_count} trip(s) created, ${results.failed_count} failed`;
      return res.status(207).json(results); // Multi-Status
    } else {
      results.success = false;
      results.message = 'All trips failed to create';
      return res.status(400).json(results);
    }

  } catch (error: any) {
    console.error('[Public API] Create trips error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/public/docs
 * Get API documentation
 */
router.get('/docs', (req: Request, res: Response) => {
  res.json({
    title: 'Shipper Public API Documentation',
    version: '1.0.0',
    description: 'Public API for creating trips programmatically',
    authentication: {
      type: 'Basic Auth + API Token',
      basic_auth: {
        username: BASIC_AUTH_USERNAME,
        password: '[Contact admin for password]'
      },
      api_token: {
        header: 'X-API-Token',
        value: '[Contact admin for token]'
      }
    },
    endpoints: {
      create_trips: {
        method: 'POST',
        path: '/api/public/shippers/trips',
        description: 'Create one or more trips',
        content_type: 'application/json',
        body: {
          single_trip: 'Object with trip data',
          multiple_trips: 'Array of trip objects'
        },
        required_fields: [
          'load_owner_id',
          'load_owner_name',
          'origin',
          'destination',
          'load_type',
          'amount (between 20000 and 80000)'
        ],
        optional_fields: [
          'client_company',
          'client_logo',
          'distance',
          'weight',
          'interest_rate (8-18, default: 12)',
          'maturity_days (default: 30)',
          'risk_level (low/medium/high, default: low)',
          'insurance_status (default: true)',
          'load_owner_logo',
          'load_owner_rating'
        ]
      }
    }
  });
});

export default router;

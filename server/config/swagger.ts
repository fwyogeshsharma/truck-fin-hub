import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Truck Fin Hub - Shipper API',
      version: '1.0.0',
      description: 'Public API for shippers to create trips programmatically. This API uses dual authentication: Basic Auth and API Token.',
      contact: {
        name: 'API Support',
        email: 'support@truckfinhub.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'http://34.31.185.19:3001',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        basicAuth: {
          type: 'http',
          scheme: 'basic',
          description: 'Basic Authentication with username and password',
        },
        apiToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Token',
          description: 'API Token for additional security layer',
        },
      },
      schemas: {
        Trip: {
          type: 'object',
          required: [
            'load_owner_id',
            'load_owner_name',
            'origin',
            'destination',
            'load_type',
            'amount',
          ],
          properties: {
            load_owner_id: {
              type: 'string',
              description: 'Unique identifier for the load owner/shipper',
              example: 'rr',
            },
            load_owner_name: {
              type: 'string',
              description: 'Name of the load owner/shipper',
              example: 'RollingRadius',
            },
            load_owner_logo: {
              type: 'string',
              description: 'Path or URL to shipper logo',
              example: '/rr_full_transp_old.png',
            },
            load_owner_rating: {
              type: 'number',
              format: 'float',
              description: 'Rating of the shipper (0-5)',
              example: 4.5,
            },
            client_company: {
              type: 'string',
              description: 'Name of the client company',
              example: 'Berger Paints',
            },
            client_logo: {
              type: 'string',
              description: 'Path or URL to client logo',
              example: '/clients/berger.png',
            },
            origin: {
              type: 'string',
              description: 'Trip origin location',
              example: 'Mumbai, Maharashtra',
            },
            destination: {
              type: 'string',
              description: 'Trip destination location',
              example: 'Delhi, NCR',
            },
            distance: {
              type: 'number',
              description: 'Distance in kilometers',
              example: 1400,
            },
            load_type: {
              type: 'string',
              description: 'Type of load being transported',
              example: 'Electronics',
            },
            weight: {
              type: 'number',
              description: 'Weight in kilograms',
              example: 15000,
            },
            amount: {
              type: 'number',
              description: 'Trip amount in INR (must be between 20,000 and 80,000)',
              minimum: 20000,
              maximum: 80000,
              example: 50000,
            },
            interest_rate: {
              type: 'number',
              format: 'float',
              description: 'Interest rate percentage (8-18, default: 12)',
              minimum: 8,
              maximum: 18,
              default: 12,
              example: 12,
            },
            maturity_days: {
              type: 'number',
              description: 'Number of days until maturity (default: 30)',
              default: 30,
              example: 30,
            },
            risk_level: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Risk level of the trip',
              default: 'low',
              example: 'low',
            },
            insurance_status: {
              type: 'boolean',
              description: 'Whether the trip is insured',
              default: true,
              example: true,
            },
          },
        },
        TripResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the operation was successful',
            },
            message: {
              type: 'string',
              description: 'Result message',
            },
            created_count: {
              type: 'number',
              description: 'Number of trips successfully created',
            },
            failed_count: {
              type: 'number',
              description: 'Number of trips that failed to create',
            },
            trip_ids: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of created trip IDs',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  index: {
                    type: 'number',
                  },
                  data: {
                    type: 'object',
                  },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                },
              },
              description: 'Array of errors for failed trips',
            },
            shipper: {
              type: 'string',
              description: 'Shipper name',
            },
            company: {
              type: 'string',
              description: 'Company name',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              description: 'Error type',
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
    },
    security: [
      {
        basicAuth: [],
        apiToken: [],
      },
    ],
  },
  apis: ['./server/routes/publicApi.ts', './server/routes/publicApiDocs.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

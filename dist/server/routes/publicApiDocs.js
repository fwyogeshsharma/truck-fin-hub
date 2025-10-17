/**
 * @swagger
 * /api/public/shippers/trips:
 *   post:
 *     summary: Create trip(s)
 *     description: Create one or more trips via the public API. Requires both Basic Authentication and API Token.
 *     tags:
 *       - Shipper API
 *     security:
 *       - basicAuth: []
 *         apiToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/Trip'
 *               - type: array
 *                 items:
 *                   $ref: '#/components/schemas/Trip'
 *           examples:
 *             singleTrip:
 *               summary: Single trip
 *               value:
 *                 load_owner_id: "rr"
 *                 load_owner_name: "RollingRadius"
 *                 load_owner_logo: "/rr_full_transp_old.png"
 *                 load_owner_rating: 4.5
 *                 client_company: "Berger Paints"
 *                 client_logo: "/clients/berger.png"
 *                 origin: "Mumbai, Maharashtra"
 *                 destination: "Delhi, NCR"
 *                 distance: 1400
 *                 load_type: "Electronics"
 *                 weight: 15000
 *                 amount: 50000
 *                 interest_rate: 12
 *                 maturity_days: 30
 *                 risk_level: "low"
 *                 insurance_status: true
 *             multipleTrips:
 *               summary: Multiple trips
 *               value:
 *                 - load_owner_id: "rr"
 *                   load_owner_name: "RollingRadius"
 *                   origin: "Mumbai, Maharashtra"
 *                   destination: "Delhi, NCR"
 *                   distance: 1400
 *                   load_type: "Electronics"
 *                   weight: 15000
 *                   amount: 50000
 *                 - load_owner_id: "rr"
 *                   load_owner_name: "RollingRadius"
 *                   origin: "Bangalore, Karnataka"
 *                   destination: "Chennai, Tamil Nadu"
 *                   distance: 350
 *                   load_type: "FMCG"
 *                   weight: 12000
 *                   amount: 35000
 *     responses:
 *       201:
 *         description: Trip(s) created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TripResponse'
 *             example:
 *               success: true
 *               message: "2 trip(s) created successfully"
 *               created_count: 2
 *               failed_count: 0
 *               trip_ids: ["trip-uuid-1", "trip-uuid-2"]
 *               errors: []
 *               shipper: "Demo Shipper"
 *               company: "Demo Company"
 *       207:
 *         description: Partial success (some trips created, some failed)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TripResponse'
 *       400:
 *         description: Bad request - validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Bad Request"
 *               message: "amount must be between ₹20,000 and ₹80,000"
 *       401:
 *         description: Unauthorized - invalid credentials or token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Unauthorized"
 *               message: "Invalid credentials"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export {};

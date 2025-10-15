import { Router, Request, Response } from 'express';
import {
  getAllTrips,
  getTrip,
  getTripsByLoadOwner,
  getTripsByLender,
  getTripsByStatus,
  createTrip,
  updateTrip,
  addBid,
  uploadDocument,
  getTripBids,
  deleteTrip,
  bulkCreateTrips,
  BulkTripInput,
} from '../../src/db/queries/trips.ts';
import { getUsersByRole, findLoadOwnerByName, findTransporterByName } from '../../src/db/queries/users.ts';
import { createNotification } from '../../src/db/queries/notifications.ts';
import { getNotificationTemplate } from '../../src/services/notificationTemplates.ts';
import { getCompanyInfo } from '../../src/data/companyInfo.ts';

const router = Router();

// GET /api/trips - Get all trips or filter by query params
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, loadOwnerId, lenderId } = req.query;

    let trips;
    if (status) {
      trips = await getTripsByStatus(status as any);
    } else if (loadOwnerId) {
      trips = await getTripsByLoadOwner(loadOwnerId as string);
    } else if (lenderId) {
      trips = await getTripsByLender(lenderId as string);
    } else {
      trips = await getAllTrips();
      console.log('getAllTrips returned', trips.length, 'trips');
      if (trips.length > 0) {
        console.log('First trip has bids:', trips[0].bids);
      }
    }

    res.json(trips);
  } catch (error: any) {
    console.error('Get trips error:', error);
    res.status(500).json({ error: 'Failed to get trips', message: error.message });
  }
});

// POST /api/trips/bulk - Bulk create trips (MUST be before /:id route)
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const trips: BulkTripInput[] = req.body;

    // Validate input
    if (!Array.isArray(trips) || trips.length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Expected an array of trip objects'
      });
    }

    // Validate required fields for each trip
    const requiredFields = ['ewayBillNumber', 'pickup', 'destination', 'receiver', 'transporter',
                            'loanAmount', 'loanInterestRate', 'maturityDays', 'distance',
                            'loadType', 'weight'];

    for (let i = 0; i < trips.length; i++) {
      const trip = trips[i];
      const missingFields = requiredFields.filter(field => !trip[field as keyof BulkTripInput]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: 'Validation error',
          message: `Trip at index ${i} is missing required fields: ${missingFields.join(', ')}`
        });
      }
    }

    console.log(`Processing bulk creation of ${trips.length} trips...`);

    // Process bulk creation
    const result = await bulkCreateTrips(trips, findLoadOwnerByName, findTransporterByName, getCompanyInfo);

    console.log(`Bulk creation completed: ${result.created} created, ${result.failed} failed`);

    // Return appropriate status based on results
    if (result.failed === 0) {
      return res.status(201).json({
        success: true,
        message: `Successfully created ${result.created} trips`,
        created: result.created,
        failed: result.failed
      });
    } else if (result.created > 0) {
      return res.status(207).json({ // 207 Multi-Status
        success: false,
        message: `Partially successful: ${result.created} created, ${result.failed} failed`,
        created: result.created,
        failed: result.failed,
        errors: result.errors
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Failed to create any trips',
        created: result.created,
        failed: result.failed,
        errors: result.errors
      });
    }
  } catch (error: any) {
    console.error('Bulk create trips error:', error);
    res.status(500).json({
      error: 'Failed to process bulk creation',
      message: error.message
    });
  }
});

// GET /api/trips/:id - Get single trip with bids and documents
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const trip = await getTrip(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(trip);
  } catch (error: any) {
    console.error('Get trip error:', error);
    res.status(500).json({ error: 'Failed to get trip', message: error.message });
  }
});

// POST /api/trips - Create new trip
router.post('/', async (req: Request, res: Response) => {
  try {
    const trip = await createTrip(req.body);

    // Notify all lenders about the new investment opportunity
    try {
      const lenders = await getUsersByRole('lender');
      const template = getNotificationTemplate('investment_opportunity');

      if (template) {
        const tripData = {
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
            message: template.inAppMessage(tripData),
            priority: template.priority,
            actionUrl: `/investment-opportunities`,
            metadata: tripData,
          });
        }

        console.log(`Notified ${lenders.length} lenders about new trip ${trip.id}`);
      }
    } catch (notifError) {
      console.error('Failed to send notifications:', notifError);
      // Don't fail the trip creation if notifications fail
    }

    res.status(201).json(trip);
  } catch (error: any) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'Failed to create trip', message: error.message });
  }
});

// PUT /api/trips/:id - Update trip
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const trip = await updateTrip(req.params.id, req.body);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(trip);
  } catch (error: any) {
    console.error('Update trip error:', error);
    res.status(500).json({ error: 'Failed to update trip', message: error.message });
  }
});

// DELETE /api/trips/:id - Delete trip
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await deleteTrip(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json({ message: 'Trip deleted successfully' });
  } catch (error: any) {
    console.error('Delete trip error:', error);
    res.status(500).json({ error: 'Failed to delete trip', message: error.message });
  }
});

// GET /api/trips/:id/bids - Get bids for a trip
router.get('/:id/bids', async (req: Request, res: Response) => {
  try {
    const bids = await getTripBids(req.params.id);
    res.json(bids);
  } catch (error: any) {
    console.error('Get bids error:', error);
    res.status(500).json({ error: 'Failed to get bids', message: error.message });
  }
});

// POST /api/trips/:id/bids - Add bid to trip
router.post('/:id/bids', async (req: Request, res: Response) => {
  try {
    const { lenderId, lenderName, amount, interestRate } = req.body;

    if (!lenderId || !lenderName || !amount || !interestRate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const bid = await addBid(req.params.id, lenderId, lenderName, amount, interestRate);

    // Notify the trip owner (shipper/load owner) about the new bid
    try {
      const trip = await getTrip(req.params.id);
      if (trip) {
        const template = getNotificationTemplate('bid_received');

        if (template) {
          const bidData = {
            tripId: trip.id,
            origin: trip.origin,
            destination: trip.destination,
            lenderName,
            amount,
            interestRate,
          };

          await createNotification({
            userId: trip.load_owner_id,
            type: 'bid_received',
            title: template.subject,
            message: template.inAppMessage(bidData),
            priority: template.priority,
            actionUrl: `/trips/${trip.id}`,
            metadata: bidData,
          });

          console.log(`Notified load owner ${trip.load_owner_id} about bid from ${lenderName}`);
        }
      }
    } catch (notifError) {
      console.error('Failed to send bid notification:', notifError);
      // Don't fail the bid creation if notification fails
    }

    res.status(201).json(bid);
  } catch (error: any) {
    console.error('Add bid error:', error);
    res.status(500).json({ error: 'Failed to add bid', message: error.message });
  }
});

// POST /api/trips/:id/documents - Upload document
router.post('/:id/documents', async (req: Request, res: Response) => {
  try {
    const { documentType, documentData, uploadedBy } = req.body;

    if (!documentType || !documentData || !uploadedBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const doc = await uploadDocument(req.params.id, documentType, documentData, uploadedBy);
    res.status(201).json(doc);
  } catch (error: any) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Failed to upload document', message: error.message });
  }
});

export default router;
// trigger restart

import { Router, Request, Response } from 'express';
import {
  getAllTrips,
  getTrip,
  getTripsByLoadOwner,
  getTripsByLender,
  getTripsByTransporter,
  getTripsByStatus,
  createTrip,
  updateTrip,
  addBid,
  uploadDocument,
  getTripBids,
  deleteTrip,
} from '../../db/queries/trips.ts';
import { getUsersByRole } from '../../db/queries/users.ts';
import { createNotification } from '../../db/queries/notifications.ts';
import { getNotificationTemplate } from '../../../src/services/notificationTemplates.ts';

const router = Router();

// GET /api/trips - Get all trips or filter by query params
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, loadOwnerId, lenderId, transporterId } = req.query;

    let trips;
    if (status) {
      trips = getTripsByStatus(status as any);
    } else if (loadOwnerId) {
      trips = getTripsByLoadOwner(loadOwnerId as string);
    } else if (lenderId) {
      trips = getTripsByLender(lenderId as string);
    } else if (transporterId) {
      trips = getTripsByTransporter(transporterId as string);
    } else {
      trips = getAllTrips();
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

// GET /api/trips/:id - Get single trip with bids and documents
router.get('/:id', (req: Request, res: Response) => {
  try {
    const trip = getTrip(req.params.id);
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
    const trip = createTrip(req.body);

    // Notify all lenders about the new investment opportunity
    try {
      const lenders = getUsersByRole('lender');
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
        lenders.forEach(lender => {
          createNotification({
            userId: lender.id,
            type: 'investment_opportunity',
            title: template.subject,
            message: template.inAppMessage(tripData),
            priority: template.priority,
            actionUrl: `/investment-opportunities`,
            metadata: tripData,
          });
        });

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
router.put('/:id', (req: Request, res: Response) => {
  try {
    const trip = updateTrip(req.params.id, req.body);
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
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const deleted = deleteTrip(req.params.id);
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
router.get('/:id/bids', (req: Request, res: Response) => {
  try {
    const bids = getTripBids(req.params.id);
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

    const bid = addBid(req.params.id, lenderId, lenderName, amount, interestRate);

    // Notify the trip owner (shipper/load owner) about the new bid
    try {
      const trip = getTrip(req.params.id);
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

          createNotification({
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
router.post('/:id/documents', (req: Request, res: Response) => {
  try {
    const { documentType, documentData, uploadedBy } = req.body;

    if (!documentType || !documentData || !uploadedBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const doc = uploadDocument(req.params.id, documentType, documentData, uploadedBy);
    res.status(201).json(doc);
  } catch (error: any) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Failed to upload document', message: error.message });
  }
});

export default router;
// trigger restart

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
} from '../../src/db/queries/trips.ts';

const router = Router();

// GET /api/trips - Get all trips or filter by query params
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, loadOwnerId, lenderId } = req.query;

    let trips;
    if (status) {
      trips = getTripsByStatus(status as any);
    } else if (loadOwnerId) {
      trips = getTripsByLoadOwner(loadOwnerId as string);
    } else if (lenderId) {
      trips = getTripsByLender(lenderId as string);
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
router.post('/', (req: Request, res: Response) => {
  try {
    const trip = createTrip(req.body);
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
router.post('/:id/bids', (req: Request, res: Response) => {
  try {
    const { lenderId, lenderName, amount, interestRate } = req.body;

    if (!lenderId || !lenderName || !amount || !interestRate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const bid = addBid(req.params.id, lenderId, lenderName, amount, interestRate);
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

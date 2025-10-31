import { getDatabase } from '../database';

export interface Trip {
  id: string;
  load_owner_id: string;
  load_owner_name: string;
  load_owner_logo?: string;
  load_owner_rating?: number;
  client_company?: string;
  client_logo?: string;
  transporter_id?: string;
  transporter_name?: string;
  origin: string;
  destination: string;
  distance: number;
  load_type: string;
  weight: number;
  amount: number;
  interest_rate?: number;
  maturity_days?: number;
  risk_level?: 'low' | 'medium' | 'high';
  insurance_status: number;
  status: 'pending' | 'escrowed' | 'funded' | 'in_transit' | 'completed' | 'cancelled';
  lender_id?: string;
  lender_name?: string;
  created_at: string;
  funded_at?: string;
  completed_at?: string;
}

export interface TripBid {
  id: string;
  trip_id: string;
  lender_id: string;
  lender_name: string;
  amount: number;
  interest_rate: number;
  created_at: string;
}

export interface TripDocument {
  id: string;
  trip_id: string;
  document_type: 'bilty' | 'ewaybill' | 'invoice';
  document_data: string;
  uploaded_at: string;
  uploaded_by: string;
}

export interface CreateTripInput {
  load_owner_id: string;
  load_owner_name: string;
  load_owner_logo?: string;
  load_owner_rating?: number;
  client_company?: string;
  client_logo?: string;
  origin: string;
  destination: string;
  distance: number;
  load_type: string;
  weight: number;
  amount: number;
  interest_rate?: number;
  maturity_days?: number;
  risk_level?: 'low' | 'medium' | 'high';
  insurance_status?: boolean;
}

/**
 * Get trip by ID with bids and documents
 */
export const getTrip = (id: string): (Trip & { bids?: TripBid[], documents?: Record<string, string> }) | null => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM trips WHERE id = ?');
  const trip = stmt.get(id) as Trip | undefined;

  if (!trip) return null;

  // Get bids
  const bidsStmt = db.prepare('SELECT * FROM trip_bids WHERE trip_id = ? ORDER BY created_at DESC');
  const bids = bidsStmt.all(id) as TripBid[];

  // Get documents
  const docsStmt = db.prepare('SELECT * FROM trip_documents WHERE trip_id = ?');
  const docs = docsStmt.all(id) as TripDocument[];
  const documents: Record<string, string> = {};
  docs.forEach(doc => {
    documents[doc.document_type] = doc.document_data;
  });

  return {
    ...trip,
    bids: bids.length > 0 ? bids : undefined,
    documents: Object.keys(documents).length > 0 ? documents : undefined,
  };
};

/**
 * Get all trips with bids
 */
export const getAllTrips = (): (Trip & { bids?: TripBid[] })[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM trips ORDER BY created_at DESC');
  const trips = stmt.all() as Trip[];

  try {
    // Get all bids for all trips in a single query for efficiency
    const bidsStmt = db.prepare('SELECT * FROM trip_bids ORDER BY created_at DESC');
    const allBids = bidsStmt.all() as TripBid[];

    // Group bids by trip_id
    const bidsByTrip = allBids.reduce((acc, bid) => {
      if (!acc[bid.trip_id]) {
        acc[bid.trip_id] = [];
      }
      acc[bid.trip_id].push(bid);
      return acc;
    }, {} as Record<string, TripBid[]>);

    // Add bids to each trip
    return trips.map(trip => ({
      ...trip,
      bids: bidsByTrip[trip.id] || undefined,
    }));
  } catch (error) {
    console.error('Error loading bids:', error);
    // Return trips without bids if there's an error
    return trips;
  }
};

/**
 * Get trips by status
 */
export const getTripsByStatus = (status: Trip['status']): Trip[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM trips WHERE status = ? ORDER BY created_at DESC');
  return stmt.all(status) as Trip[];
};

/**
 * Get trips by load owner
 */
export const getTripsByLoadOwner = (loadOwnerId: string): Trip[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM trips WHERE load_owner_id = ? ORDER BY created_at DESC');
  return stmt.all(loadOwnerId) as Trip[];
};

/**
 * Get trips by lender
 */
export const getTripsByLender = (lenderId: string): Trip[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM trips WHERE lender_id = ? ORDER BY created_at DESC');
  return stmt.all(lenderId) as Trip[];
};

/**
 * Create trip
 */
export const createTrip = (input: CreateTripInput): Trip => {
  const db = getDatabase();
  const id = `trip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const stmt = db.prepare(`
    INSERT INTO trips (
      id, load_owner_id, load_owner_name, load_owner_logo, load_owner_rating,
      client_company, client_logo, origin, destination, distance, load_type,
      weight, amount, interest_rate, maturity_days, risk_level, insurance_status, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `);

  stmt.run(
    id,
    input.load_owner_id,
    input.load_owner_name,
    input.load_owner_logo || null,
    input.load_owner_rating || null,
    input.client_company || null,
    input.client_logo || null,
    input.origin,
    input.destination,
    input.distance,
    input.load_type,
    input.weight,
    input.amount,
    input.interest_rate || null,
    input.maturity_days || 30,
    input.risk_level || 'low',
    input.insurance_status ? 1 : 0
  );

  const trip = getTrip(id);
  if (!trip) {
    throw new Error('Failed to create trip');
  }

  return trip;
};

/**
 * Update trip
 */
export const updateTrip = (id: string, updates: Partial<Trip>): Trip | null => {
  const db = getDatabase();

  const trip = getTrip(id);
  if (!trip) return null;

  // Map field names from API to database column names
  const fieldMapping: Record<string, string> = {
    'pickup': 'origin',  // Map pickup to origin
    // Add any other field mappings here if needed
  };

  // Use a Map to avoid duplicate column assignments
  const fieldMap = new Map<string, any>();

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id') {
      // Use mapped field name if it exists, otherwise use the original key
      const dbFieldName = fieldMapping[key] || key;

      // If origin already exists and we're trying to add pickup, skip pickup
      // Prefer the actual database column name over the alias
      if (dbFieldName === 'origin' && fieldMap.has('origin') && key === 'pickup') {
        return; // Skip pickup if origin is already set
      }

      // If we're setting origin and pickup was already added, remove pickup
      if (key === 'origin' && fieldMap.has('origin')) {
        // Origin takes precedence, just update the value
        fieldMap.set(dbFieldName, value);
      } else {
        fieldMap.set(dbFieldName, value);
      }
    }
  });

  const fields: string[] = [];
  const values: any[] = [];

  fieldMap.forEach((value, dbFieldName) => {
    fields.push(`${dbFieldName} = ?`);
    values.push(value);
  });

  if (fields.length === 0) return trip;

  values.push(id);

  const stmt = db.prepare(`
    UPDATE trips SET ${fields.join(', ')} WHERE id = ?
  `);

  stmt.run(...values);

  return getTrip(id);
};

/**
 * Add bid to trip
 */
export const addBid = (tripId: string, lenderId: string, lenderName: string, amount: number, interestRate: number): TripBid => {
  const db = getDatabase();
  const id = `bid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const stmt = db.prepare(`
    INSERT INTO trip_bids (id, trip_id, lender_id, lender_name, amount, interest_rate)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, tripId, lenderId, lenderName, amount, interestRate);

  const bidStmt = db.prepare('SELECT * FROM trip_bids WHERE id = ?');
  return bidStmt.get(id) as TripBid;
};

/**
 * Upload document
 */
export const uploadDocument = (
  tripId: string,
  documentType: 'bilty' | 'ewaybill' | 'invoice',
  documentData: string,
  uploadedBy: string
): TripDocument => {
  const db = getDatabase();
  const id = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Delete existing document of same type
  const deleteStmt = db.prepare('DELETE FROM trip_documents WHERE trip_id = ? AND document_type = ?');
  deleteStmt.run(tripId, documentType);

  const stmt = db.prepare(`
    INSERT INTO trip_documents (id, trip_id, document_type, document_data, uploaded_by)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(id, tripId, documentType, documentData, uploadedBy);

  const docStmt = db.prepare('SELECT * FROM trip_documents WHERE id = ?');
  return docStmt.get(id) as TripDocument;
};

/**
 * Get bids for trip
 */
export const getTripBids = (tripId: string): TripBid[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM trip_bids WHERE trip_id = ? ORDER BY created_at DESC');
  return stmt.all(tripId) as TripBid[];
};

/**
 * Delete trip
 */
export const deleteTrip = (id: string): boolean => {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM trips WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

export default {
  getTrip,
  getAllTrips,
  getTripsByStatus,
  getTripsByLoadOwner,
  getTripsByLender,
  createTrip,
  updateTrip,
  addBid,
  uploadDocument,
  getTripBids,
  deleteTrip,
};

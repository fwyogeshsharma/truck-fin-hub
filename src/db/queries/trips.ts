import { getDatabase } from '../database.js';

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
  insurance_status: boolean;
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
  document_type: 'bilty' | 'ewaybill' | 'advance_invoice' | 'pod' | 'final_invoice';
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
export const getTrip = async (id: string): Promise<(Trip & { bids?: TripBid[], documents?: Record<string, string> }) | null> => {
  const db = await getDatabase();
  const result = await db.query('SELECT * FROM trips WHERE id = $1', [id]);
  const trip = result.rows[0];

  if (!trip) return null;

  // Get bids
  const bidsResult = await db.query('SELECT * FROM trip_bids WHERE trip_id = $1 ORDER BY created_at DESC', [id]);
  const bids = bidsResult.rows as TripBid[];

  // Get documents
  const docsResult = await db.query('SELECT * FROM trip_documents WHERE trip_id = $1', [id]);
  const docs = docsResult.rows as TripDocument[];
  const documents: Record<string, string> = {};
  docs.forEach(doc => {
    documents[doc.document_type] = doc.document_data;
  });

  // Convert numeric fields to numbers
  return {
    ...trip,
    distance: Number(trip.distance),
    weight: Number(trip.weight),
    amount: Number(trip.amount),
    interest_rate: trip.interest_rate ? Number(trip.interest_rate) : undefined,
    maturity_days: trip.maturity_days ? Number(trip.maturity_days) : undefined,
    load_owner_rating: trip.load_owner_rating ? Number(trip.load_owner_rating) : undefined,
    bids: bids.length > 0 ? bids.map(bid => ({
      ...bid,
      amount: Number(bid.amount),
      interest_rate: Number(bid.interest_rate),
    })) : undefined,
    documents: Object.keys(documents).length > 0 ? documents : undefined,
  };
};

/**
 * Get all trips with bids and documents
 */
export const getAllTrips = async (): Promise<(Trip & { bids?: TripBid[], documents?: Record<string, string> })[]> => {
  const db = await getDatabase();
  const result = await db.query('SELECT * FROM trips ORDER BY created_at DESC');
  const trips = result.rows as Trip[];

  try {
    // Get all bids for all trips in a single query for efficiency
    const bidsResult = await db.query('SELECT * FROM trip_bids ORDER BY created_at DESC');
    const allBids = bidsResult.rows as TripBid[];

    // Get all documents for all trips in a single query for efficiency
    const docsResult = await db.query('SELECT * FROM trip_documents');
    const allDocs = docsResult.rows as TripDocument[];

    // Group bids by trip_id and convert numeric fields
    const bidsByTrip = allBids.reduce((acc, bid) => {
      if (!acc[bid.trip_id]) {
        acc[bid.trip_id] = [];
      }
      acc[bid.trip_id].push({
        ...bid,
        amount: Number(bid.amount),
        interest_rate: Number(bid.interest_rate),
      });
      return acc;
    }, {} as Record<string, TripBid[]>);

    // Group documents by trip_id
    const docsByTrip = allDocs.reduce((acc, doc) => {
      if (!acc[doc.trip_id]) {
        acc[doc.trip_id] = {};
      }
      acc[doc.trip_id][doc.document_type] = doc.document_data;
      return acc;
    }, {} as Record<string, Record<string, string>>);

    // Add bids and documents to each trip and convert numeric fields
    return trips.map(trip => ({
      ...trip,
      distance: Number(trip.distance),
      weight: Number(trip.weight),
      amount: Number(trip.amount),
      interest_rate: trip.interest_rate ? Number(trip.interest_rate) : undefined,
      maturity_days: trip.maturity_days ? Number(trip.maturity_days) : undefined,
      load_owner_rating: trip.load_owner_rating ? Number(trip.load_owner_rating) : undefined,
      bids: bidsByTrip[trip.id] || undefined,
      documents: docsByTrip[trip.id] && Object.keys(docsByTrip[trip.id]).length > 0 ? docsByTrip[trip.id] : undefined,
    }));
  } catch (error) {
    console.error('Error loading bids and documents:', error);
    // Return trips with numeric conversions even if bids/documents fail
    return trips.map(trip => ({
      ...trip,
      distance: Number(trip.distance),
      weight: Number(trip.weight),
      amount: Number(trip.amount),
      interest_rate: trip.interest_rate ? Number(trip.interest_rate) : undefined,
      maturity_days: trip.maturity_days ? Number(trip.maturity_days) : undefined,
      load_owner_rating: trip.load_owner_rating ? Number(trip.load_owner_rating) : undefined,
    }));
  }
};

/**
 * Get trips by status with documents
 */
export const getTripsByStatus = async (status: Trip['status']): Promise<(Trip & { documents?: Record<string, string> })[]> => {
  const db = await getDatabase();
  const result = await db.query('SELECT * FROM trips WHERE status = $1 ORDER BY created_at DESC', [status]);
  const trips = result.rows as Trip[];

  // Get all documents for these trips
  const tripIds = trips.map(t => t.id);
  if (tripIds.length === 0) return [];

  const docsResult = await db.query('SELECT * FROM trip_documents WHERE trip_id = ANY($1)', [tripIds]);
  const allDocs = docsResult.rows as TripDocument[];

  // Group documents by trip_id
  const docsByTrip = allDocs.reduce((acc, doc) => {
    if (!acc[doc.trip_id]) {
      acc[doc.trip_id] = {};
    }
    acc[doc.trip_id][doc.document_type] = doc.document_data;
    return acc;
  }, {} as Record<string, Record<string, string>>);

  return trips.map(trip => ({
    ...trip,
    distance: Number(trip.distance),
    weight: Number(trip.weight),
    amount: Number(trip.amount),
    interest_rate: trip.interest_rate ? Number(trip.interest_rate) : undefined,
    maturity_days: trip.maturity_days ? Number(trip.maturity_days) : undefined,
    load_owner_rating: trip.load_owner_rating ? Number(trip.load_owner_rating) : undefined,
    documents: docsByTrip[trip.id] && Object.keys(docsByTrip[trip.id]).length > 0 ? docsByTrip[trip.id] : undefined,
  }));
};

/**
 * Get trips by load owner with documents
 */
export const getTripsByLoadOwner = async (loadOwnerId: string): Promise<(Trip & { documents?: Record<string, string> })[]> => {
  const db = await getDatabase();
  const result = await db.query('SELECT * FROM trips WHERE load_owner_id = $1 ORDER BY created_at DESC', [loadOwnerId]);
  const trips = result.rows as Trip[];

  // Get all documents for these trips
  const tripIds = trips.map(t => t.id);
  if (tripIds.length === 0) return [];

  const docsResult = await db.query('SELECT * FROM trip_documents WHERE trip_id = ANY($1)', [tripIds]);
  const allDocs = docsResult.rows as TripDocument[];

  // Group documents by trip_id
  const docsByTrip = allDocs.reduce((acc, doc) => {
    if (!acc[doc.trip_id]) {
      acc[doc.trip_id] = {};
    }
    acc[doc.trip_id][doc.document_type] = doc.document_data;
    return acc;
  }, {} as Record<string, Record<string, string>>);

  return trips.map(trip => ({
    ...trip,
    distance: Number(trip.distance),
    weight: Number(trip.weight),
    amount: Number(trip.amount),
    interest_rate: trip.interest_rate ? Number(trip.interest_rate) : undefined,
    maturity_days: trip.maturity_days ? Number(trip.maturity_days) : undefined,
    load_owner_rating: trip.load_owner_rating ? Number(trip.load_owner_rating) : undefined,
    documents: docsByTrip[trip.id] && Object.keys(docsByTrip[trip.id]).length > 0 ? docsByTrip[trip.id] : undefined,
  }));
};

/**
 * Get trips by lender with documents
 */
export const getTripsByLender = async (lenderId: string): Promise<(Trip & { documents?: Record<string, string> })[]> => {
  const db = await getDatabase();
  const result = await db.query('SELECT * FROM trips WHERE lender_id = $1 ORDER BY created_at DESC', [lenderId]);
  const trips = result.rows as Trip[];

  // Get all documents for these trips
  const tripIds = trips.map(t => t.id);
  if (tripIds.length === 0) return [];

  const docsResult = await db.query('SELECT * FROM trip_documents WHERE trip_id = ANY($1)', [tripIds]);
  const allDocs = docsResult.rows as TripDocument[];

  // Group documents by trip_id
  const docsByTrip = allDocs.reduce((acc, doc) => {
    if (!acc[doc.trip_id]) {
      acc[doc.trip_id] = {};
    }
    acc[doc.trip_id][doc.document_type] = doc.document_data;
    return acc;
  }, {} as Record<string, Record<string, string>>);

  return trips.map(trip => ({
    ...trip,
    distance: Number(trip.distance),
    weight: Number(trip.weight),
    amount: Number(trip.amount),
    interest_rate: trip.interest_rate ? Number(trip.interest_rate) : undefined,
    maturity_days: trip.maturity_days ? Number(trip.maturity_days) : undefined,
    load_owner_rating: trip.load_owner_rating ? Number(trip.load_owner_rating) : undefined,
    documents: docsByTrip[trip.id] && Object.keys(docsByTrip[trip.id]).length > 0 ? docsByTrip[trip.id] : undefined,
  }));
};

/**
 * Create trip
 */
export const createTrip = async (input: CreateTripInput): Promise<Trip> => {
  const db = await getDatabase();
  const id = `trip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await db.query(`
    INSERT INTO trips (
      id, load_owner_id, load_owner_name, load_owner_logo, load_owner_rating,
      client_company, client_logo, origin, destination, distance, load_type,
      weight, amount, interest_rate, maturity_days, risk_level, insurance_status, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'pending')
  `, [
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
    input.insurance_status || false
  ]);

  const trip = await getTrip(id);
  if (!trip) {
    throw new Error('Failed to create trip');
  }

  return trip;
};

/**
 * Update trip
 */
export const updateTrip = async (id: string, updates: Partial<Trip & { documents?: Record<string, string> }>): Promise<Trip | null> => {
  const db = await getDatabase();

  const trip = await getTrip(id);
  if (!trip) return null;

  // Extract and handle documents separately
  const { documents, ...tripUpdates } = updates as any;

  // Handle document updates if provided
  if (documents && typeof documents === 'object') {
    const validDocTypes: Array<'bilty' | 'ewaybill' | 'advance_invoice' | 'pod' | 'final_invoice'> =
      ['bilty', 'ewaybill', 'advance_invoice', 'pod', 'final_invoice'];

    for (const docType of validDocTypes) {
      if (documents[docType]) {
        // Use 'system' as uploadedBy for now, or extract from context if available
        await uploadDocument(id, docType, documents[docType], trip.load_owner_id || 'system');
      }
    }
  }

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(tripUpdates).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id' && key !== 'documents') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (fields.length > 0) {
    values.push(id);

    await db.query(`
      UPDATE trips SET ${fields.join(', ')} WHERE id = $${paramIndex}
    `, values);
  }

  return await getTrip(id);
};

/**
 * Add bid to trip
 */
export const addBid = async (tripId: string, lenderId: string, lenderName: string, amount: number, interestRate: number): Promise<TripBid> => {
  const db = await getDatabase();
  const id = `bid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await db.query(`
    INSERT INTO trip_bids (id, trip_id, lender_id, lender_name, amount, interest_rate)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [id, tripId, lenderId, lenderName, amount, interestRate]);

  const result = await db.query('SELECT * FROM trip_bids WHERE id = $1', [id]);
  return result.rows[0] as TripBid;
};

/**
 * Update bid with contract reference
 */
export const updateBidContract = async (bidId: string, contractId: string): Promise<void> => {
  const db = await getDatabase();
  await db.query(`
    UPDATE trip_bids
    SET contract_id = $1, has_contract = TRUE
    WHERE id = $2
  `, [contractId, bidId]);
};

/**
 * Upload document
 */
export const uploadDocument = async (
  tripId: string,
  documentType: 'bilty' | 'ewaybill' | 'advance_invoice' | 'pod' | 'final_invoice',
  documentData: string,
  uploadedBy: string
): Promise<TripDocument> => {
  const db = await getDatabase();
  const id = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Delete existing document of same type
  await db.query('DELETE FROM trip_documents WHERE trip_id = $1 AND document_type = $2', [tripId, documentType]);

  await db.query(`
    INSERT INTO trip_documents (id, trip_id, document_type, document_data, uploaded_by)
    VALUES ($1, $2, $3, $4, $5)
  `, [id, tripId, documentType, documentData, uploadedBy]);

  const result = await db.query('SELECT * FROM trip_documents WHERE id = $1', [id]);
  return result.rows[0] as TripDocument;
};

/**
 * Get bids for trip
 */
export const getTripBids = async (tripId: string): Promise<TripBid[]> => {
  const db = await getDatabase();
  const result = await db.query('SELECT * FROM trip_bids WHERE trip_id = $1 ORDER BY created_at DESC', [tripId]);
  return result.rows;
};

/**
 * Delete trip
 */
export const deleteTrip = async (id: string): Promise<boolean> => {
  const db = await getDatabase();
  const result = await db.query('DELETE FROM trips WHERE id = $1', [id]);
  return result.rowCount > 0;
};

/**
 * Bulk create trips - input format for bulk creation
 */
export interface BulkTripInput {
  ewayBillNumber: string;
  pickup: string;
  destination: string;
  sender?: string;
  receiver: string;
  transporter: string;
  loanAmount: number;
  loanInterestRate: number;
  maturityDays: number;
  distance: number;
  loadType: string;
  weight: number;
}

/**
 * Result of bulk trip creation
 */
export interface BulkCreateResult {
  success: boolean;
  created: number;
  failed: number;
  errors: Array<{
    index: number;
    data: BulkTripInput;
    error: string;
  }>;
}

/**
 * Create trips in bulk from external data format
 */
export const bulkCreateTrips = async (
  trips: BulkTripInput[],
  findLoadOwnerByName: (name: string) => Promise<any>,
  findTransporterByName: (name: string) => Promise<any>,
  getCompanyInfo: (key: string) => any
): Promise<BulkCreateResult> => {
  const db = await getDatabase();
  const result: BulkCreateResult = {
    success: true,
    created: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < trips.length; i++) {
    const tripData = trips[i];

    try {
      // Try to get company info from companyDatabase first
      let receiverCompanyInfo = null;
      let loadOwner = null;

      if (tripData.receiver) {
        // Try to get from companyInfo database
        receiverCompanyInfo = getCompanyInfo(tripData.receiver);

        // Try to find load owner by the full company name or the key
        if (receiverCompanyInfo) {
          loadOwner = await findLoadOwnerByName(receiverCompanyInfo.name);
        }

        // If not found, try with the provided name directly
        if (!loadOwner) {
          loadOwner = await findLoadOwnerByName(tripData.receiver);
        }

        // If still not found, just use receiver as client company (not an error)
        if (!loadOwner) {
          console.log(`Load owner "${tripData.receiver}" not found in users database, using as client company`);
        }
      }

      // Find transporter - try companyInfo database first, then users database
      let transporterCompanyInfo = getCompanyInfo(tripData.transporter);
      let transporter = null;

      // Try to find transporter by full company name from companyInfo
      if (transporterCompanyInfo) {
        transporter = await findTransporterByName(transporterCompanyInfo.name);
      }

      // If not found, try with the provided name directly
      if (!transporter) {
        transporter = await findTransporterByName(tripData.transporter);
      }

      // If still not found, throw error (transporter is required)
      if (!transporter) {
        throw new Error(`Transporter "${tripData.transporter}" not found in database. Please use "Rolling Radius" or add the transporter to users database.`);
      }

      // Optional: sender is the client company (consignor)
      let clientCompany = tripData.sender || (tripData.receiver && !loadOwner ? tripData.receiver : null);
      let clientLogo = receiverCompanyInfo?.logo || null;

      // Create trip
      const id = `trip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      //If no load owner found, we need a placeholder or use the transporter as load owner temporarily
      const effectiveLoadOwner = loadOwner || {
        id: transporter.id, // Use transporter as fallback
        name: tripData.receiver || 'Unknown',
        company: tripData.receiver,
        company_logo: receiverCompanyInfo?.logo || null,
        user_logo: null,
        rating: receiverCompanyInfo?.rating || null
      };

      await db.query(`
        INSERT INTO trips (
          id, load_owner_id, load_owner_name, load_owner_logo, load_owner_rating,
          client_company, client_logo, transporter_id, transporter_name,
          origin, destination, distance, load_type,
          weight, amount, interest_rate, maturity_days, risk_level, insurance_status, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'pending')
      `, [
        id,
        effectiveLoadOwner.id,
        effectiveLoadOwner.company || effectiveLoadOwner.name,
        effectiveLoadOwner.company_logo || effectiveLoadOwner.user_logo || null,
        effectiveLoadOwner.rating || null,
        clientCompany,
        clientLogo,
        transporter.id,
        transporter.company || transporter.name,
        tripData.pickup,
        tripData.destination,
        tripData.distance,
        tripData.loadType,
        tripData.weight,
        tripData.loanAmount,
        tripData.loanInterestRate,
        tripData.maturityDays,
        'medium', // Default risk level
        true // Default insurance status
      ]);

      result.created++;
    } catch (error: any) {
      result.failed++;
      result.errors.push({
        index: i,
        data: tripData,
        error: error.message || 'Unknown error occurred'
      });
      console.error(`Failed to create trip at index ${i}:`, error);
    }
  }

  result.success = result.failed === 0;
  return result;
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
  bulkCreateTrips,
};

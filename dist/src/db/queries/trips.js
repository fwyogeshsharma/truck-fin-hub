import { getDatabase } from '../database.js';
/**
 * Get trip by ID with bids and documents
 */
export const getTrip = async (id) => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM trips WHERE id = $1', [id]);
    const trip = result.rows[0];
    if (!trip)
        return null;
    // Get bids
    const bidsResult = await db.query('SELECT * FROM trip_bids WHERE trip_id = $1 ORDER BY created_at DESC', [id]);
    const bids = bidsResult.rows;
    // Get documents
    const docsResult = await db.query('SELECT * FROM trip_documents WHERE trip_id = $1', [id]);
    const docs = docsResult.rows;
    const documents = {};
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
 * Get all trips with bids
 */
export const getAllTrips = async () => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM trips ORDER BY created_at DESC');
    const trips = result.rows;
    try {
        // Get all bids for all trips in a single query for efficiency
        const bidsResult = await db.query('SELECT * FROM trip_bids ORDER BY created_at DESC');
        const allBids = bidsResult.rows;
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
        }, {});
        // Add bids to each trip and convert numeric fields
        return trips.map(trip => ({
            ...trip,
            distance: Number(trip.distance),
            weight: Number(trip.weight),
            amount: Number(trip.amount),
            interest_rate: trip.interest_rate ? Number(trip.interest_rate) : undefined,
            maturity_days: trip.maturity_days ? Number(trip.maturity_days) : undefined,
            load_owner_rating: trip.load_owner_rating ? Number(trip.load_owner_rating) : undefined,
            bids: bidsByTrip[trip.id] || undefined,
        }));
    }
    catch (error) {
        console.error('Error loading bids:', error);
        // Return trips with numeric conversions even if bids fail
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
 * Get trips by status
 */
export const getTripsByStatus = async (status) => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM trips WHERE status = $1 ORDER BY created_at DESC', [status]);
    return result.rows.map(trip => ({
        ...trip,
        distance: Number(trip.distance),
        weight: Number(trip.weight),
        amount: Number(trip.amount),
        interest_rate: trip.interest_rate ? Number(trip.interest_rate) : undefined,
        maturity_days: trip.maturity_days ? Number(trip.maturity_days) : undefined,
        load_owner_rating: trip.load_owner_rating ? Number(trip.load_owner_rating) : undefined,
    }));
};
/**
 * Get trips by load owner
 */
export const getTripsByLoadOwner = async (loadOwnerId) => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM trips WHERE load_owner_id = $1 ORDER BY created_at DESC', [loadOwnerId]);
    return result.rows.map(trip => ({
        ...trip,
        distance: Number(trip.distance),
        weight: Number(trip.weight),
        amount: Number(trip.amount),
        interest_rate: trip.interest_rate ? Number(trip.interest_rate) : undefined,
        maturity_days: trip.maturity_days ? Number(trip.maturity_days) : undefined,
        load_owner_rating: trip.load_owner_rating ? Number(trip.load_owner_rating) : undefined,
    }));
};
/**
 * Get trips by lender
 */
export const getTripsByLender = async (lenderId) => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM trips WHERE lender_id = $1 ORDER BY created_at DESC', [lenderId]);
    return result.rows.map(trip => ({
        ...trip,
        distance: Number(trip.distance),
        weight: Number(trip.weight),
        amount: Number(trip.amount),
        interest_rate: trip.interest_rate ? Number(trip.interest_rate) : undefined,
        maturity_days: trip.maturity_days ? Number(trip.maturity_days) : undefined,
        load_owner_rating: trip.load_owner_rating ? Number(trip.load_owner_rating) : undefined,
    }));
};
/**
 * Create trip
 */
export const createTrip = async (input) => {
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
export const updateTrip = async (id, updates) => {
    const db = await getDatabase();
    const trip = await getTrip(id);
    if (!trip)
        return null;
    const fields = [];
    const values = [];
    let paramIndex = 1;
    Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    });
    if (fields.length === 0)
        return trip;
    values.push(id);
    await db.query(`
    UPDATE trips SET ${fields.join(', ')} WHERE id = $${paramIndex}
  `, values);
    return await getTrip(id);
};
/**
 * Add bid to trip
 */
export const addBid = async (tripId, lenderId, lenderName, amount, interestRate) => {
    const db = await getDatabase();
    const id = `bid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db.query(`
    INSERT INTO trip_bids (id, trip_id, lender_id, lender_name, amount, interest_rate)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [id, tripId, lenderId, lenderName, amount, interestRate]);
    const result = await db.query('SELECT * FROM trip_bids WHERE id = $1', [id]);
    return result.rows[0];
};
/**
 * Upload document
 */
export const uploadDocument = async (tripId, documentType, documentData, uploadedBy) => {
    const db = await getDatabase();
    const id = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    // Delete existing document of same type
    await db.query('DELETE FROM trip_documents WHERE trip_id = $1 AND document_type = $2', [tripId, documentType]);
    await db.query(`
    INSERT INTO trip_documents (id, trip_id, document_type, document_data, uploaded_by)
    VALUES ($1, $2, $3, $4, $5)
  `, [id, tripId, documentType, documentData, uploadedBy]);
    const result = await db.query('SELECT * FROM trip_documents WHERE id = $1', [id]);
    return result.rows[0];
};
/**
 * Get bids for trip
 */
export const getTripBids = async (tripId) => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM trip_bids WHERE trip_id = $1 ORDER BY created_at DESC', [tripId]);
    return result.rows;
};
/**
 * Delete trip
 */
export const deleteTrip = async (id) => {
    const db = await getDatabase();
    const result = await db.query('DELETE FROM trips WHERE id = $1', [id]);
    return result.rowCount > 0;
};
/**
 * Create trips in bulk from external data format
 */
export const bulkCreateTrips = async (trips, findLoadOwnerByName, findTransporterByName, getCompanyInfo) => {
    const db = await getDatabase();
    const result = {
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
        }
        catch (error) {
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

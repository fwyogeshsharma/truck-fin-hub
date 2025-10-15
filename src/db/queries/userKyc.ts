import { getDatabase } from '../database.js';

export interface UserKyc {
  id: string;
  user_id: string;
  // Personal Information
  pan_number?: string;
  pan_document?: string;
  aadhar_number?: string;
  aadhar_document?: string;
  // Address Proof
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address_proof_type?: 'aadhar' | 'passport' | 'voter_id' | 'driving_license' | 'utility_bill';
  address_proof_document?: string;
  // Business/Company Documents
  gst_number?: string;
  gst_certificate?: string;
  company_registration_number?: string;
  company_registration_document?: string;
  // Vehicle Documents
  vehicle_registration_number?: string;
  vehicle_registration_document?: string;
  vehicle_insurance_document?: string;
  vehicle_fitness_certificate?: string;
  // Verification Status
  kyc_status: 'pending' | 'under_review' | 'approved' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  // Timestamps
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserKycInput {
  user_id: string;
  pan_number?: string;
  pan_document?: string;
  aadhar_number?: string;
  aadhar_document?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address_proof_type?: UserKyc['address_proof_type'];
  address_proof_document?: string;
  gst_number?: string;
  gst_certificate?: string;
  company_registration_number?: string;
  company_registration_document?: string;
  vehicle_registration_number?: string;
  vehicle_registration_document?: string;
  vehicle_insurance_document?: string;
  vehicle_fitness_certificate?: string;
}

export interface UpdateUserKycInput {
  pan_number?: string;
  pan_document?: string;
  aadhar_number?: string;
  aadhar_document?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address_proof_type?: UserKyc['address_proof_type'];
  address_proof_document?: string;
  gst_number?: string;
  gst_certificate?: string;
  company_registration_number?: string;
  company_registration_document?: string;
  vehicle_registration_number?: string;
  vehicle_registration_document?: string;
  vehicle_insurance_document?: string;
  vehicle_fitness_certificate?: string;
  kyc_status?: UserKyc['kyc_status'];
}

/**
 * Get KYC by user ID
 */
export const getUserKyc = async (userId: string): Promise<UserKyc | null> => {
  const db = await getDatabase();
  const result = await db.query('SELECT * FROM user_kyc WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
};

/**
 * Get KYC by ID
 */
export const getKycById = async (id: string): Promise<UserKyc | null> => {
  const db = await getDatabase();
  const result = await db.query('SELECT * FROM user_kyc WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Get all KYC records
 */
export const getAllKyc = async (): Promise<UserKyc[]> => {
  const db = await getDatabase();
  const result = await db.query('SELECT * FROM user_kyc ORDER BY created_at DESC');
  return result.rows;
};

/**
 * Get KYC records by status
 */
export const getKycByStatus = async (status: UserKyc['kyc_status']): Promise<UserKyc[]> => {
  const db = await getDatabase();
  const result = await db.query('SELECT * FROM user_kyc WHERE kyc_status = $1 ORDER BY created_at DESC', [status]);
  return result.rows;
};

/**
 * Create or update KYC
 */
export const createOrUpdateUserKyc = async (input: CreateUserKycInput): Promise<UserKyc> => {
  const db = await getDatabase();

  // Check if KYC exists
  const existing = await getUserKyc(input.user_id);

  if (existing) {
    // Update existing
    return (await updateUserKyc(input.user_id, input as UpdateUserKycInput))!;
  }

  // Create new
  const id = `kyc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await db.query(`
    INSERT INTO user_kyc (
      id, user_id, pan_number, pan_document, aadhar_number, aadhar_document,
      address_line1, address_line2, city, state, pincode, address_proof_type, address_proof_document,
      gst_number, gst_certificate, company_registration_number, company_registration_document,
      vehicle_registration_number, vehicle_registration_document, vehicle_insurance_document,
      vehicle_fitness_certificate, kyc_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 'pending')
  `, [
    id,
    input.user_id,
    input.pan_number || null,
    input.pan_document || null,
    input.aadhar_number || null,
    input.aadhar_document || null,
    input.address_line1 || null,
    input.address_line2 || null,
    input.city || null,
    input.state || null,
    input.pincode || null,
    input.address_proof_type || null,
    input.address_proof_document || null,
    input.gst_number || null,
    input.gst_certificate || null,
    input.company_registration_number || null,
    input.company_registration_document || null,
    input.vehicle_registration_number || null,
    input.vehicle_registration_document || null,
    input.vehicle_insurance_document || null,
    input.vehicle_fitness_certificate || null
  ]);

  const kyc = await getUserKyc(input.user_id);
  if (!kyc) {
    throw new Error('Failed to create KYC');
  }

  return kyc;
};

/**
 * Update KYC
 */
export const updateUserKyc = async (userId: string, input: UpdateUserKycInput): Promise<UserKyc | null> => {
  const db = await getDatabase();

  const kyc = await getUserKyc(userId);
  if (!kyc) return null;

  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  // Build update query dynamically
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (updates.length === 0) return kyc;

  updates.push(`updated_at = NOW()`);
  values.push(userId);

  await db.query(`
    UPDATE user_kyc SET ${updates.join(', ')} WHERE user_id = $${paramIndex}
  `, values);

  return await getUserKyc(userId);
};

/**
 * Submit KYC for review
 */
export const submitKycForReview = async (userId: string): Promise<UserKyc | null> => {
  const db = await getDatabase();
  await db.query(`
    UPDATE user_kyc SET kyc_status = 'under_review', submitted_at = NOW(), updated_at = NOW()
    WHERE user_id = $1
  `, [userId]);
  return await getUserKyc(userId);
};

/**
 * Approve KYC
 */
export const approveKyc = async (userId: string, verifiedBy: string): Promise<UserKyc | null> => {
  const db = await getDatabase();
  await db.query(`
    UPDATE user_kyc
    SET kyc_status = 'approved', verified_by = $1, verified_at = NOW(), updated_at = NOW(), rejection_reason = NULL
    WHERE user_id = $2
  `, [verifiedBy, userId]);
  return await getUserKyc(userId);
};

/**
 * Reject KYC
 */
export const rejectKyc = async (userId: string, verifiedBy: string, rejectionReason: string): Promise<UserKyc | null> => {
  const db = await getDatabase();
  await db.query(`
    UPDATE user_kyc
    SET kyc_status = 'rejected', verified_by = $1, verified_at = NOW(), rejection_reason = $2, updated_at = NOW()
    WHERE user_id = $3
  `, [verifiedBy, rejectionReason, userId]);
  return await getUserKyc(userId);
};

/**
 * Check if user has approved KYC
 */
export const hasApprovedKyc = async (userId: string): Promise<boolean> => {
  const kyc = await getUserKyc(userId);
  return kyc?.kyc_status === 'approved';
};

/**
 * Get pending KYC count
 */
export const getPendingKycCount = async (): Promise<number> => {
  const db = await getDatabase();
  const result = await db.query('SELECT COUNT(*) as count FROM user_kyc WHERE kyc_status = $1', ['pending']);
  return parseInt(result.rows[0].count);
};

/**
 * Get under review KYC count
 */
export const getUnderReviewKycCount = async (): Promise<number> => {
  const db = await getDatabase();
  const result = await db.query('SELECT COUNT(*) as count FROM user_kyc WHERE kyc_status = $1', ['under_review']);
  return parseInt(result.rows[0].count);
};

export default {
  getUserKyc,
  getKycById,
  getAllKyc,
  getKycByStatus,
  createOrUpdateUserKyc,
  updateUserKyc,
  submitKycForReview,
  approveKyc,
  rejectKyc,
  hasApprovedKyc,
  getPendingKycCount,
  getUnderReviewKycCount,
};

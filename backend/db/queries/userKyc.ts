import { getDatabase } from '../database';

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
export const getUserKyc = (userId: string): UserKyc | null => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM user_kyc WHERE user_id = ?');
  return stmt.get(userId) as UserKyc | null;
};

/**
 * Get KYC by ID
 */
export const getKycById = (id: string): UserKyc | null => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM user_kyc WHERE id = ?');
  return stmt.get(id) as UserKyc | null;
};

/**
 * Get all KYC records
 */
export const getAllKyc = (): UserKyc[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM user_kyc ORDER BY created_at DESC');
  return stmt.all() as UserKyc[];
};

/**
 * Get KYC records by status
 */
export const getKycByStatus = (status: UserKyc['kyc_status']): UserKyc[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM user_kyc WHERE kyc_status = ? ORDER BY created_at DESC');
  return stmt.all(status) as UserKyc[];
};

/**
 * Create or update KYC
 */
export const createOrUpdateUserKyc = (input: CreateUserKycInput): UserKyc => {
  const db = getDatabase();

  // Check if KYC exists
  const existing = getUserKyc(input.user_id);

  if (existing) {
    // Update existing
    return updateUserKyc(input.user_id, input as UpdateUserKycInput)!;
  }

  // Create new
  const id = `kyc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const stmt = db.prepare(`
    INSERT INTO user_kyc (
      id, user_id, pan_number, pan_document, aadhar_number, aadhar_document,
      address_line1, address_line2, city, state, pincode, address_proof_type, address_proof_document,
      gst_number, gst_certificate, company_registration_number, company_registration_document,
      vehicle_registration_number, vehicle_registration_document, vehicle_insurance_document,
      vehicle_fitness_certificate, kyc_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `);

  stmt.run(
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
  );

  const kyc = getUserKyc(input.user_id);
  if (!kyc) {
    throw new Error('Failed to create KYC');
  }

  return kyc;
};

/**
 * Update KYC
 */
export const updateUserKyc = (userId: string, input: UpdateUserKycInput): UserKyc | null => {
  const db = getDatabase();

  const kyc = getUserKyc(userId);
  if (!kyc) return null;

  const updates: string[] = [];
  const values: any[] = [];

  // Build update query dynamically
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (updates.length === 0) return kyc;

  updates.push('updated_at = datetime(\'now\')');
  values.push(userId);

  const stmt = db.prepare(`
    UPDATE user_kyc SET ${updates.join(', ')} WHERE user_id = ?
  `);

  stmt.run(...values);

  return getUserKyc(userId);
};

/**
 * Submit KYC for review
 */
export const submitKycForReview = (userId: string): UserKyc | null => {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE user_kyc SET kyc_status = 'under_review', submitted_at = datetime('now'), updated_at = datetime('now')
    WHERE user_id = ?
  `);
  stmt.run(userId);
  return getUserKyc(userId);
};

/**
 * Approve KYC
 */
export const approveKyc = (userId: string, verifiedBy: string): UserKyc | null => {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE user_kyc
    SET kyc_status = 'approved', verified_by = ?, verified_at = datetime('now'), updated_at = datetime('now'), rejection_reason = NULL
    WHERE user_id = ?
  `);
  stmt.run(verifiedBy, userId);
  return getUserKyc(userId);
};

/**
 * Reject KYC
 */
export const rejectKyc = (userId: string, verifiedBy: string, rejectionReason: string): UserKyc | null => {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE user_kyc
    SET kyc_status = 'rejected', verified_by = ?, verified_at = datetime('now'), rejection_reason = ?, updated_at = datetime('now')
    WHERE user_id = ?
  `);
  stmt.run(verifiedBy, rejectionReason, userId);
  return getUserKyc(userId);
};

/**
 * Check if user has approved KYC
 */
export const hasApprovedKyc = (userId: string): boolean => {
  const kyc = getUserKyc(userId);
  return kyc?.kyc_status === 'approved';
};

/**
 * Get pending KYC count
 */
export const getPendingKycCount = (): number => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM user_kyc WHERE kyc_status = ?');
  const result = stmt.get('pending') as { count: number };
  return result.count;
};

/**
 * Get under review KYC count
 */
export const getUnderReviewKycCount = (): number => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM user_kyc WHERE kyc_status = ?');
  const result = stmt.get('under_review') as { count: number };
  return result.count;
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

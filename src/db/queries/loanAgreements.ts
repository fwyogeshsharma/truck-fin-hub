import { getDatabase } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

export interface LoanAgreement {
  id: string;
  trip_id: string;
  bid_id: string;
  lender_id: string;
  borrower_id: string;

  // Contract Content
  contract_terms: string;
  interest_rate: number;
  loan_amount: number;
  maturity_days: number;

  // Terms Clauses
  terms_and_conditions?: string;
  interest_rate_clause?: string;
  repayment_clause?: string;
  late_payment_clause?: string;
  default_clause?: string;
  custom_clauses?: any;

  // Signatures
  lender_signature_image?: string;
  lender_signed_at?: string;
  borrower_signature_image?: string;
  borrower_signed_at?: string;

  // Status
  status: 'pending_borrower' | 'accepted' | 'rejected';
  contract_accepted: boolean;

  created_at: string;
  updated_at: string;
}

export interface CreateLoanAgreementInput {
  trip_id: string;
  bid_id: string;
  lender_id: string;
  borrower_id: string;
  contract_terms: string;
  interest_rate: number;
  loan_amount: number;
  maturity_days: number;
  terms_and_conditions?: string;
  interest_rate_clause?: string;
  repayment_clause?: string;
  late_payment_clause?: string;
  default_clause?: string;
  custom_clauses?: any;
  lender_signature_image?: string;
}

export interface UpdateLoanAgreementInput {
  borrower_signature_image?: string;
  borrower_signed_at?: string;
  status?: 'pending_borrower' | 'accepted' | 'rejected';
  contract_accepted?: boolean;
}

// Get all loan agreements
export async function getAllLoanAgreements(): Promise<LoanAgreement[]> {
  const db = getDatabase();
  const query = `
    SELECT * FROM loan_agreements
    ORDER BY created_at DESC
  `;
  const result = await db.query(query);
  return result.rows;
}

// Get loan agreement by ID
export async function getLoanAgreementById(id: string): Promise<LoanAgreement | null> {
  const db = getDatabase();
  const query = `
    SELECT * FROM loan_agreements
    WHERE id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
}

// Get loan agreements by trip ID
export async function getLoanAgreementsByTrip(tripId: string): Promise<LoanAgreement[]> {
  const db = getDatabase();
  const query = `
    SELECT * FROM loan_agreements
    WHERE trip_id = $1
    ORDER BY created_at DESC
  `;
  const result = await db.query(query, [tripId]);
  return result.rows;
}

// Get loan agreement by bid ID
export async function getLoanAgreementByBid(bidId: string): Promise<LoanAgreement | null> {
  const db = getDatabase();
  const query = `
    SELECT * FROM loan_agreements
    WHERE bid_id = $1
  `;
  const result = await db.query(query, [bidId]);
  return result.rows[0] || null;
}

// Get loan agreements by lender ID
export async function getLoanAgreementsByLender(lenderId: string): Promise<LoanAgreement[]> {
  const db = getDatabase();
  const query = `
    SELECT * FROM loan_agreements
    WHERE lender_id = $1
    ORDER BY created_at DESC
  `;
  const result = await db.query(query, [lenderId]);
  return result.rows;
}

// Get loan agreements by borrower ID
export async function getLoanAgreementsByBorrower(borrowerId: string): Promise<LoanAgreement[]> {
  const db = getDatabase();
  const query = `
    SELECT * FROM loan_agreements
    WHERE borrower_id = $1
    ORDER BY created_at DESC
  `;
  const result = await db.query(query, [borrowerId]);
  return result.rows;
}

// Create loan agreement
export async function createLoanAgreement(input: CreateLoanAgreementInput): Promise<LoanAgreement> {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  const query = `
    INSERT INTO loan_agreements (
      id, trip_id, bid_id, lender_id, borrower_id,
      contract_terms, interest_rate, loan_amount, maturity_days,
      terms_and_conditions, interest_rate_clause, repayment_clause,
      late_payment_clause, default_clause, custom_clauses,
      lender_signature_image, lender_signed_at,
      status, contract_accepted, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    RETURNING *
  `;

  const customClausesJson = input.custom_clauses ? input.custom_clauses : null;
  const lenderSignedAt = input.lender_signature_image ? now : null;

  const result = await db.query(query, [
    id,
    input.trip_id,
    input.bid_id,
    input.lender_id,
    input.borrower_id,
    input.contract_terms,
    input.interest_rate,
    input.loan_amount,
    input.maturity_days,
    input.terms_and_conditions || null,
    input.interest_rate_clause || null,
    input.repayment_clause || null,
    input.late_payment_clause || null,
    input.default_clause || null,
    customClausesJson,
    input.lender_signature_image || null,
    lenderSignedAt,
    'pending_borrower',
    false,
    now,
    now
  ]);

  return result.rows[0];
}

// Update loan agreement
export async function updateLoanAgreement(
  id: string,
  input: UpdateLoanAgreementInput
): Promise<LoanAgreement> {
  const db = getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (input.borrower_signature_image !== undefined) {
    updates.push(`borrower_signature_image = $${paramIndex++}`);
    params.push(input.borrower_signature_image);
  }

  if (input.borrower_signed_at !== undefined) {
    updates.push(`borrower_signed_at = $${paramIndex++}`);
    params.push(input.borrower_signed_at);
  }

  if (input.status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    params.push(input.status);
  }

  if (input.contract_accepted !== undefined) {
    updates.push(`contract_accepted = $${paramIndex++}`);
    params.push(input.contract_accepted);
  }

  updates.push(`updated_at = $${paramIndex++}`);
  params.push(now);

  params.push(id);

  const query = `
    UPDATE loan_agreements
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await db.query(query, params);

  if (result.rows.length === 0) {
    throw new Error('Loan agreement not found');
  }

  return result.rows[0];
}

// Delete loan agreement
export async function deleteLoanAgreement(id: string): Promise<void> {
  const db = getDatabase();
  const query = `DELETE FROM loan_agreements WHERE id = $1`;
  await db.query(query, [id]);
}

import { getDatabase } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

export interface LoanContractTemplate {
  id: string;
  lender_id: string;
  template_name: string;
  terms_and_conditions: string;
  interest_rate_clause?: string;
  repayment_clause?: string;
  late_payment_clause?: string;
  default_clause?: string;
  custom_clauses?: any;
  lender_signature_image?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateLoanContractTemplateInput {
  lender_id: string;
  template_name: string;
  terms_and_conditions: string;
  interest_rate_clause?: string;
  repayment_clause?: string;
  late_payment_clause?: string;
  default_clause?: string;
  custom_clauses?: any;
  lender_signature_image?: string;
  is_default?: boolean;
}

export interface UpdateLoanContractTemplateInput {
  template_name?: string;
  terms_and_conditions?: string;
  interest_rate_clause?: string;
  repayment_clause?: string;
  late_payment_clause?: string;
  default_clause?: string;
  custom_clauses?: any;
  lender_signature_image?: string;
  is_default?: boolean;
}

// Get all templates
export async function getAllLoanContractTemplates(): Promise<LoanContractTemplate[]> {
  const db = getDatabase();
  const query = `
    SELECT * FROM loan_contract_templates
    ORDER BY created_at DESC
  `;
  const result = await db.query(query);
  return result.rows;
}

// Get template by ID
export async function getLoanContractTemplateById(id: string): Promise<LoanContractTemplate | null> {
  const db = getDatabase();
  const query = `
    SELECT * FROM loan_contract_templates
    WHERE id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
}

// Get templates by lender ID
export async function getLoanContractTemplatesByLender(lenderId: string): Promise<LoanContractTemplate[]> {
  const db = getDatabase();
  const query = `
    SELECT * FROM loan_contract_templates
    WHERE lender_id = $1
    ORDER BY is_default DESC, created_at DESC
  `;
  const result = await db.query(query, [lenderId]);
  return result.rows;
}

// Get default template for a lender
export async function getDefaultLoanContractTemplate(lenderId: string): Promise<LoanContractTemplate | null> {
  const db = getDatabase();
  const query = `
    SELECT * FROM loan_contract_templates
    WHERE lender_id = $1 AND is_default = TRUE
    LIMIT 1
  `;
  const result = await db.query(query, [lenderId]);
  return result.rows[0] || null;
}

// Create loan contract template
export async function createLoanContractTemplate(input: CreateLoanContractTemplateInput): Promise<LoanContractTemplate> {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  // If this is being set as default, unset other defaults for this lender
  if (input.is_default) {
    await db.query(
      `UPDATE loan_contract_templates SET is_default = FALSE WHERE lender_id = $1`,
      [input.lender_id]
    );
  }

  const query = `
    INSERT INTO loan_contract_templates (
      id, lender_id, template_name, terms_and_conditions,
      interest_rate_clause, repayment_clause, late_payment_clause,
      default_clause, custom_clauses, lender_signature_image,
      is_default, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;

  const customClausesJson = input.custom_clauses ? input.custom_clauses : null;

  const result = await db.query(query, [
    id,
    input.lender_id,
    input.template_name,
    input.terms_and_conditions,
    input.interest_rate_clause || null,
    input.repayment_clause || null,
    input.late_payment_clause || null,
    input.default_clause || null,
    customClausesJson,
    input.lender_signature_image || null,
    input.is_default || false,
    now,
    now
  ]);

  return result.rows[0];
}

// Update loan contract template
export async function updateLoanContractTemplate(
  id: string,
  input: UpdateLoanContractTemplateInput
): Promise<LoanContractTemplate> {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Get the template to find the lender_id
  const existing = await getLoanContractTemplateById(id);
  if (!existing) {
    throw new Error('Template not found');
  }

  // If setting as default, unset other defaults for this lender
  if (input.is_default) {
    await db.query(
      `UPDATE loan_contract_templates SET is_default = FALSE WHERE lender_id = $1 AND id != $2`,
      [existing.lender_id, id]
    );
  }

  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (input.template_name !== undefined) {
    updates.push(`template_name = $${paramIndex++}`);
    params.push(input.template_name);
  }

  if (input.terms_and_conditions !== undefined) {
    updates.push(`terms_and_conditions = $${paramIndex++}`);
    params.push(input.terms_and_conditions);
  }

  if (input.interest_rate_clause !== undefined) {
    updates.push(`interest_rate_clause = $${paramIndex++}`);
    params.push(input.interest_rate_clause);
  }

  if (input.repayment_clause !== undefined) {
    updates.push(`repayment_clause = $${paramIndex++}`);
    params.push(input.repayment_clause);
  }

  if (input.late_payment_clause !== undefined) {
    updates.push(`late_payment_clause = $${paramIndex++}`);
    params.push(input.late_payment_clause);
  }

  if (input.default_clause !== undefined) {
    updates.push(`default_clause = $${paramIndex++}`);
    params.push(input.default_clause);
  }

  if (input.custom_clauses !== undefined) {
    updates.push(`custom_clauses = $${paramIndex++}`);
    params.push(input.custom_clauses);
  }

  if (input.lender_signature_image !== undefined) {
    updates.push(`lender_signature_image = $${paramIndex++}`);
    params.push(input.lender_signature_image);
  }

  if (input.is_default !== undefined) {
    updates.push(`is_default = $${paramIndex++}`);
    params.push(input.is_default);
  }

  updates.push(`updated_at = $${paramIndex++}`);
  params.push(now);

  params.push(id);

  const query = `
    UPDATE loan_contract_templates
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await db.query(query, params);

  if (result.rows.length === 0) {
    throw new Error('Template not found');
  }

  return result.rows[0];
}

// Delete loan contract template
export async function deleteLoanContractTemplate(id: string): Promise<void> {
  const db = getDatabase();
  const query = `DELETE FROM loan_contract_templates WHERE id = $1`;
  await db.query(query, [id]);
}

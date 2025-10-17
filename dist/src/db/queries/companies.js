import { getDatabase } from '../database.js';
// Get all companies
export async function getAllCompanies() {
    const db = getDatabase();
    const result = await db.query('SELECT * FROM companies ORDER BY created_at DESC');
    return result.rows;
}
// Get active companies only
export async function getActiveCompanies() {
    const db = getDatabase();
    const result = await db.query('SELECT * FROM companies WHERE is_active = TRUE ORDER BY display_name ASC');
    return result.rows;
}
// Get company by ID
export async function getCompanyById(id) {
    const db = getDatabase();
    const result = await db.query('SELECT * FROM companies WHERE id = $1', [id]);
    return result.rows[0] || null;
}
// Get company by name
export async function getCompanyByName(name) {
    const db = getDatabase();
    const result = await db.query('SELECT * FROM companies WHERE name = $1', [name]);
    return result.rows[0] || null;
}
// Get company by GST number
export async function getCompanyByGST(gstNumber) {
    const db = getDatabase();
    const result = await db.query('SELECT * FROM companies WHERE gst_number = $1', [gstNumber]);
    return result.rows[0] || null;
}
// Create new company
export async function createCompany(data) {
    // Check if company with same name already exists
    const existing = await getCompanyByName(data.name);
    if (existing) {
        throw new Error(`Company with name "${data.name}" already exists`);
    }
    // Check if GST number already exists
    if (data.gst_number) {
        const existingGST = await getCompanyByGST(data.gst_number);
        if (existingGST) {
            throw new Error(`Company with GST number "${data.gst_number}" already exists`);
        }
    }
    const db = getDatabase();
    const result = await db.query(`INSERT INTO companies (
      id, name, display_name, logo, description, industry, website,
      email, phone, address_line1, address_line2, city, state, pincode,
      country, gst_number, pan_number, company_registration_number
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *`, [
        data.id,
        data.name,
        data.display_name,
        data.logo,
        data.description,
        data.industry,
        data.website,
        data.email,
        data.phone,
        data.address_line1,
        data.address_line2,
        data.city,
        data.state,
        data.pincode,
        data.country || 'India',
        data.gst_number,
        data.pan_number,
        data.company_registration_number,
    ]);
    return result.rows[0];
}
// Update company
export async function updateCompany(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;
    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
            fields.push(`${key} = $${paramCount}`);
            values.push(value);
            paramCount++;
        }
    });
    if (fields.length === 0) {
        return getCompanyById(id);
    }
    values.push(id);
    const db = getDatabase();
    const result = await db.query(`UPDATE companies SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);
    return result.rows[0] || null;
}
// Delete company (soft delete by setting is_active = false)
export async function deleteCompany(id) {
    const db = getDatabase();
    const result = await db.query('UPDATE companies SET is_active = FALSE WHERE id = $1', [id]);
    return result.rowCount ? result.rowCount > 0 : false;
}
// Verify company
export async function verifyCompany(id, verifiedBy) {
    const db = getDatabase();
    const result = await db.query(`UPDATE companies
     SET is_verified = TRUE, verified_at = CURRENT_TIMESTAMP, verified_by = $2
     WHERE id = $1
     RETURNING *`, [id, verifiedBy]);
    return result.rows[0] || null;
}
// Get companies count
export async function getCompaniesCount() {
    const db = getDatabase();
    const result = await db.query('SELECT COUNT(*) as count FROM companies WHERE is_active = TRUE');
    return parseInt(result.rows[0].count);
}

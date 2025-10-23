-- Migration: Update trip_documents to support all 5 document types
-- Date: 2025-10-23
-- Description: Adds support for advance_invoice, pod, and final_invoice document types

-- Drop the existing constraint
ALTER TABLE trip_documents DROP CONSTRAINT IF EXISTS trip_documents_document_type_check;

-- Add new constraint with all 5 document types
ALTER TABLE trip_documents ADD CONSTRAINT trip_documents_document_type_check
  CHECK(document_type IN ('bilty', 'ewaybill', 'advance_invoice', 'pod', 'final_invoice'));

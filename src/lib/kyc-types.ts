// KYC Types and Interfaces following Indian Regulatory Requirements

export type KYCStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'resubmission_required';

export type EntityType = 'individual' | 'company' | 'partnership' | 'llp' | 'trust';

export type DocumentType =
  | 'aadhaar'
  | 'pan'
  | 'passport'
  | 'voter_id'
  | 'driving_license'
  | 'nrega_job_card'
  | 'utility_bill'
  | 'bank_statement'
  | 'cancelled_cheque'
  | 'incorporation_certificate'
  | 'gst_certificate'
  | 'board_resolution'
  | 'partnership_deed'
  | 'photo';

export type ResidentialStatus = 'resident' | 'nri' | 'foreign_national';

export type IncomeRange =
  | 'below_1_lakh'
  | '1_to_5_lakh'
  | '5_to_10_lakh'
  | '10_to_25_lakh'
  | '25_to_1_crore'
  | 'above_1_crore';

export type OccupationType =
  | 'salaried'
  | 'self_employed'
  | 'business'
  | 'professional'
  | 'retired'
  | 'homemaker'
  | 'student'
  | 'others';

export interface PersonalInfo {
  fullName: string;
  dateOfBirth: string;
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  nationality: string;
  residentialStatus: ResidentialStatus;
  occupation: OccupationType;
  sourceOfFunds: string;
  annualIncome: IncomeRange;
  phone: string;
  email: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface AddressInfo {
  currentAddress: Address;
  permanentAddress: Address;
  isSameAddress: boolean;
}

export interface DocumentInfo {
  documentType: DocumentType;
  documentNumber: string;
  documentFile?: File | string; // File for upload, string for stored path
  issueDate?: string;
  expiryDate?: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  verificationDetails?: string;
  uploadedAt: string;
}

export interface IdentityDocuments {
  pan: DocumentInfo;
  aadhaar: DocumentInfo;
  photo: DocumentInfo;
  additionalDocs: DocumentInfo[];
}

export interface BankAccountInfo {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: 'savings' | 'current';
  cancelledCheque?: DocumentInfo;
  upiId?: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
}

export interface BusinessEntityInfo {
  entityName: string;
  entityType: Exclude<EntityType, 'individual'>;
  dateOfIncorporation: string;
  registrationNumber: string;
  panNumber: string;
  gstNumber?: string;
  incorporationCertificate: DocumentInfo;
  gstCertificate?: DocumentInfo;
  boardResolution?: DocumentInfo;
  partnershipDeed?: DocumentInfo;
  authorizedSignatories: AuthorizedSignatory[];
}

export interface AuthorizedSignatory {
  name: string;
  designation: string;
  pan: string;
  aadhaar: string;
  photo: DocumentInfo;
  kycCompleted: boolean;
}

export interface BiometricVerification {
  aadhaarXmlVerified: boolean;
  aadhaarOtpVerified: boolean;
  verificationTimestamp?: string;
}

export interface VideoKYC {
  completed: boolean;
  videoRecordingPath?: string;
  faceMatchScore?: number;
  livenessDetected?: boolean;
  geoLocation?: {
    latitude: number;
    longitude: number;
  };
  verificationTimestamp?: string;
  verifiedBy?: string;
}

export interface ComplianceChecks {
  pepScreening: {
    checked: boolean;
    isPEP: boolean;
    details?: string;
    checkedAt?: string;
  };
  sanctionScreening: {
    checked: boolean;
    onSanctionList: boolean;
    details?: string;
    checkedAt?: string;
  };
  fraudCheck: {
    checked: boolean;
    duplicateDetected: boolean;
    details?: string;
    checkedAt?: string;
  };
  amlScore?: number;
}

export interface ConsentDeclarations {
  kycConsent: boolean;
  dataStorageConsent: boolean;
  fatcaDeclaration?: boolean;
  crsDeclaration?: boolean;
  beneficialOwnershipDeclaration?: boolean;
  consentTimestamp: string;
  ipAddress?: string;
}

export interface KYCAuditLog {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  details: string;
  ipAddress?: string;
}

export interface KYCData {
  id: string;
  userId: string;
  entityType: EntityType;
  status: KYCStatus;

  // Personal/Entity Info
  personalInfo?: PersonalInfo;
  businessInfo?: BusinessEntityInfo;

  // Address
  addressInfo?: AddressInfo;

  // Documents
  identityDocuments?: IdentityDocuments;
  addressProofDocuments?: DocumentInfo[];

  // Bank Details
  bankAccount?: BankAccountInfo;

  // Verification
  biometricVerification?: BiometricVerification;
  videoKYC?: VideoKYC;

  // Compliance
  complianceChecks?: ComplianceChecks;

  // Consents
  consents?: ConsentDeclarations;

  // Review
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;
  reKycDueDate?: string;

  // Audit
  auditLogs: KYCAuditLog[];

  createdAt: string;
  updatedAt: string;
}

// API Verification Response Types
export interface PanVerificationResponse {
  valid: boolean;
  name?: string;
  category?: string;
  message?: string;
}

export interface AadhaarVerificationResponse {
  valid: boolean;
  name?: string;
  dateOfBirth?: string;
  address?: string;
  message?: string;
}

export interface BankVerificationResponse {
  valid: boolean;
  accountHolderName?: string;
  message?: string;
}

// Storage Keys
export const KYC_STORAGE_KEY = 'kyc_data';
export const KYC_AUDIT_LOG_KEY = 'kyc_audit_logs';

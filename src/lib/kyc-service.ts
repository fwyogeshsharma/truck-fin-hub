// KYC Service for managing KYC data in localStorage and cache
import {
  KYCData,
  KYCAuditLog,
  KYCStatus,
  DocumentInfo,
  PanVerificationResponse,
  AadhaarVerificationResponse,
  BankVerificationResponse,
  KYC_STORAGE_KEY,
  KYC_AUDIT_LOG_KEY,
} from './kyc-types';
import { auth } from './auth';

class KYCService {
  // Get KYC data for current user
  getCurrentUserKYC(): KYCData | null {
    const user = auth.getCurrentUser();
    if (!user) return null;

    const allKYCData = this.getAllKYCData();
    return allKYCData.find((kyc) => kyc.userId === user.id) || null;
  }

  // Get all KYC data (for admin)
  getAllKYCData(): KYCData[] {
    const data = localStorage.getItem(KYC_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Initialize KYC for user
  initializeKYC(entityType: KYCData['entityType']): KYCData {
    const user = auth.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const existingKYC = this.getCurrentUserKYC();
    if (existingKYC) return existingKYC;

    const newKYC: KYCData = {
      id: `kyc_${Date.now()}`,
      userId: user.id,
      entityType,
      status: 'in_progress',
      auditLogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.saveKYC(newKYC);
    this.addAuditLog(newKYC.id, 'KYC_INITIATED', 'User', `KYC process started for ${entityType}`);

    return newKYC;
  }

  // Save/Update KYC data
  saveKYC(kycData: KYCData): void {
    const allKYCData = this.getAllKYCData();
    const index = allKYCData.findIndex((kyc) => kyc.id === kycData.id);

    kycData.updatedAt = new Date().toISOString();

    if (index !== -1) {
      allKYCData[index] = kycData;
    } else {
      allKYCData.push(kycData);
    }

    localStorage.setItem(KYC_STORAGE_KEY, JSON.stringify(allKYCData));

    // Also cache in sessionStorage for quick access
    sessionStorage.setItem(`current_kyc_${kycData.userId}`, JSON.stringify(kycData));
  }

  // Update KYC status
  updateKYCStatus(kycId: string, status: KYCStatus, reason?: string): void {
    const allKYCData = this.getAllKYCData();
    const kyc = allKYCData.find((k) => k.id === kycId);

    if (!kyc) throw new Error('KYC data not found');

    kyc.status = status;
    kyc.updatedAt = new Date().toISOString();

    if (status === 'approved') {
      kyc.approvalDate = new Date().toISOString();
      // Set re-KYC due date (2 years from approval)
      const reKycDate = new Date();
      reKycDate.setFullYear(reKycDate.getFullYear() + 2);
      kyc.reKycDueDate = reKycDate.toISOString();
    }

    if (status === 'rejected' && reason) {
      kyc.rejectionReason = reason;
    }

    this.saveKYC(kyc);
    this.addAuditLog(kycId, 'STATUS_UPDATED', 'System', `Status changed to ${status}${reason ? ': ' + reason : ''}`);
  }

  // Submit KYC for review
  submitForReview(kycId: string): void {
    const kyc = this.getAllKYCData().find((k) => k.id === kycId);
    if (!kyc) throw new Error('KYC data not found');

    // Validate required fields before submission
    const validation = this.validateKYC(kyc);
    if (!validation.valid) {
      throw new Error(`KYC validation failed: ${validation.errors.join(', ')}`);
    }

    kyc.status = 'pending_review';
    kyc.submittedAt = new Date().toISOString();
    this.saveKYC(kyc);
    this.addAuditLog(kycId, 'SUBMITTED_FOR_REVIEW', 'User', 'KYC submitted for compliance review');
  }

  // Validate KYC completeness
  validateKYC(kyc: KYCData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (kyc.entityType === 'individual') {
      if (!kyc.personalInfo) errors.push('Personal information is required');
      if (!kyc.identityDocuments?.pan) errors.push('PAN card is required');
      if (!kyc.identityDocuments?.aadhaar) errors.push('Aadhaar card is required');
      if (!kyc.identityDocuments?.photo) errors.push('Photograph is required');
      if (!kyc.addressInfo) errors.push('Address information is required');
      if (!kyc.bankAccount) errors.push('Bank account details are required');
      if (!kyc.consents?.kycConsent || !kyc.consents?.dataStorageConsent) {
        errors.push('Required consents must be provided');
      }
    } else {
      if (!kyc.businessInfo) errors.push('Business information is required');
      if (!kyc.businessInfo?.incorporationCertificate) errors.push('Incorporation certificate is required');
      if (!kyc.businessInfo?.authorizedSignatories?.length) errors.push('At least one authorized signatory is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Add audit log entry
  addAuditLog(kycId: string, action: string, performedBy: string, details: string): void {
    const allKYCData = this.getAllKYCData();
    const kyc = allKYCData.find((k) => k.id === kycId);

    if (!kyc) return;

    const logEntry: KYCAuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      performedBy,
      details,
    };

    kyc.auditLogs.push(logEntry);
    this.saveKYC(kyc);
  }

  // Document upload simulation (in production, this would upload to cloud storage)
  async uploadDocument(file: File, documentType: string): Promise<string> {
    return new Promise((resolve) => {
      // Simulate upload delay
      setTimeout(() => {
        // In production, this would return the actual file path/URL
        const filePath = `documents/${documentType}_${Date.now()}_${file.name}`;
        resolve(filePath);
      }, 1000);
    });
  }

  // PAN Verification (Simulated - In production, integrate with NSDL/Income Tax API)
  async verifyPAN(panNumber: string): Promise<PanVerificationResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate PAN validation
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        const isValid = panRegex.test(panNumber);

        resolve({
          valid: isValid,
          name: isValid ? 'Sample Name' : undefined,
          category: isValid ? 'Individual' : undefined,
          message: isValid ? 'PAN verified successfully' : 'Invalid PAN format',
        });
      }, 1500);
    });
  }

  // Aadhaar Verification (Simulated - In production, integrate with UIDAI API)
  async verifyAadhaar(aadhaarNumber: string): Promise<AadhaarVerificationResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate Aadhaar validation
        const aadhaarRegex = /^[0-9]{12}$/;
        const isValid = aadhaarRegex.test(aadhaarNumber);

        resolve({
          valid: isValid,
          name: isValid ? 'Sample Name' : undefined,
          dateOfBirth: isValid ? '1990-01-01' : undefined,
          address: isValid ? 'Sample Address' : undefined,
          message: isValid ? 'Aadhaar verified successfully' : 'Invalid Aadhaar format',
        });
      }, 1500);
    });
  }

  // Bank Account Verification (Simulated - In production, integrate with Penny Drop API)
  async verifyBankAccount(accountNumber: string, ifscCode: string): Promise<BankVerificationResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const isValid = accountNumber.length >= 9 && ifscCode.length === 11;

        resolve({
          valid: isValid,
          accountHolderName: isValid ? 'Sample Account Holder' : undefined,
          message: isValid ? 'Bank account verified successfully' : 'Invalid account details',
        });
      }, 1500);
    });
  }

  // PEP Screening (Simulated - In production, integrate with compliance API)
  async performPEPScreening(name: string, dateOfBirth: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate PEP check - always returns false for demo
        resolve(false);
      }, 1000);
    });
  }

  // Sanction List Screening (Simulated)
  async performSanctionScreening(name: string, nationality: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate sanction check - always returns false for demo
        resolve(false);
      }, 1000);
    });
  }

  // Fraud/Duplicate Check
  async performFraudCheck(pan: string, aadhaar: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allKYCData = this.getAllKYCData();
        const duplicate = allKYCData.some(
          (kyc) =>
            kyc.identityDocuments?.pan?.documentNumber === pan ||
            kyc.identityDocuments?.aadhaar?.documentNumber === aadhaar
        );
        resolve(duplicate);
      }, 1000);
    });
  }

  // Get KYC statistics (for admin dashboard)
  getKYCStatistics() {
    const allKYCData = this.getAllKYCData();

    return {
      total: allKYCData.length,
      pending: allKYCData.filter((k) => k.status === 'pending_review').length,
      approved: allKYCData.filter((k) => k.status === 'approved').length,
      rejected: allKYCData.filter((k) => k.status === 'rejected').length,
      inProgress: allKYCData.filter((k) => k.status === 'in_progress').length,
      resubmissionRequired: allKYCData.filter((k) => k.status === 'resubmission_required').length,
    };
  }

  // Check if user can perform financial transactions
  canPerformTransactions(userId: string): boolean {
    const allKYCData = this.getAllKYCData();
    const userKYC = allKYCData.find((kyc) => kyc.userId === userId);

    return userKYC?.status === 'approved';
  }

  // Clear KYC cache
  clearCache(): void {
    const user = auth.getCurrentUser();
    if (user) {
      sessionStorage.removeItem(`current_kyc_${user.id}`);
    }
  }
}

export const kycService = new KYCService();

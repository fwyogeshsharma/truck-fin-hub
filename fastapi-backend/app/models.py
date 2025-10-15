from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime
from decimal import Decimal


# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: Literal['lender', 'shipper', 'super_admin']
    company_name: Optional[str] = None
    gst_number: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    gst_number: Optional[str] = None
    kyc_status: Optional[Literal['pending', 'submitted', 'approved', 'rejected']] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: str
    user_id: str
    kyc_status: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Auth Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Wallet Models
class WalletResponse(BaseModel):
    user_id: str
    balance: float
    locked_amount: float
    escrowed_amount: float
    total_invested: float
    total_returns: float
    updated_at: datetime

    class Config:
        from_attributes = True


class WalletUpdate(BaseModel):
    balance: Optional[float] = None
    locked_amount: Optional[float] = None
    escrowed_amount: Optional[float] = None
    total_invested: Optional[float] = None
    total_returns: Optional[float] = None


class AmountRequest(BaseModel):
    amount: float


class InvestRequest(BaseModel):
    amount: float
    tripId: Optional[str] = None


class ReturnInvestmentRequest(BaseModel):
    principal: float
    returns: float = 0


# Trip Models
class TripBid(BaseModel):
    id: str
    trip_id: str
    lender_id: str
    lender_name: str
    amount: float
    interest_rate: float
    created_at: datetime

    class Config:
        from_attributes = True


class TripBase(BaseModel):
    load_owner_id: str
    load_owner_name: str
    load_owner_logo: Optional[str] = None
    load_owner_rating: Optional[float] = None
    client_company: Optional[str] = None
    client_logo: Optional[str] = None
    origin: str
    destination: str
    distance: float
    load_type: str
    weight: float
    amount: float
    interest_rate: Optional[float] = None
    maturity_days: Optional[int] = 30
    risk_level: Optional[Literal['low', 'medium', 'high']] = 'low'
    insurance_status: bool = False


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    transporter_id: Optional[str] = None
    transporter_name: Optional[str] = None
    status: Optional[Literal['pending', 'escrowed', 'funded', 'in_transit', 'completed', 'cancelled']] = None
    lender_id: Optional[str] = None
    lender_name: Optional[str] = None


class TripResponse(TripBase):
    id: str
    transporter_id: Optional[str] = None
    transporter_name: Optional[str] = None
    status: str
    lender_id: Optional[str] = None
    lender_name: Optional[str] = None
    created_at: datetime
    funded_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    bids: Optional[list[TripBid]] = None
    documents: Optional[dict] = None

    class Config:
        from_attributes = True


class BidCreate(BaseModel):
    amount: float
    interest_rate: float


class DocumentUpload(BaseModel):
    documentType: Literal['bilty', 'ewaybill', 'invoice']
    documentData: str


# Investment Models
class InvestmentBase(BaseModel):
    lender_id: str
    trip_id: str
    amount: float
    interest_rate: float
    expected_return: float
    maturity_date: str


class InvestmentCreate(InvestmentBase):
    pass


class InvestmentResponse(InvestmentBase):
    id: str
    status: Literal['escrowed', 'active', 'completed', 'defaulted']
    invested_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InvestmentStatusUpdate(BaseModel):
    status: Literal['escrowed', 'active', 'completed', 'defaulted']


# Transaction Models
class TransactionBase(BaseModel):
    user_id: str
    type: Literal['credit', 'debit']
    amount: float
    category: Literal['investment', 'return', 'payment', 'refund', 'fee', 'withdrawal']
    description: str
    balance_after: float


class TransactionCreate(TransactionBase):
    pass


class TransactionResponse(TransactionBase):
    id: str
    timestamp: datetime

    class Config:
        from_attributes = True


# Bank Account Models
class BankAccountBase(BaseModel):
    account_holder_name: str
    account_number: str
    ifsc_code: str
    bank_name: str
    account_type: Literal['savings', 'current']
    is_primary: bool = False


class BankAccountCreate(BankAccountBase):
    user_id: str


class BankAccountUpdate(BaseModel):
    account_holder_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_name: Optional[str] = None
    account_type: Optional[Literal['savings', 'current']] = None
    is_verified: Optional[bool] = None
    is_primary: Optional[bool] = None


class BankAccountResponse(BankAccountBase):
    id: str
    user_id: str
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Notification Models
class NotificationBase(BaseModel):
    user_id: str
    title: str
    message: str
    type: Literal['info', 'success', 'warning', 'error']


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    id: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# KYC Models
class UserKycBase(BaseModel):
    user_id: str
    pan_number: str
    aadhar_number: str
    gst_number: Optional[str] = None
    business_name: Optional[str] = None
    business_address: Optional[str] = None


class UserKycCreate(UserKycBase):
    pass


class UserKycUpdate(BaseModel):
    status: Optional[Literal['pending', 'submitted', 'approved', 'rejected']] = None
    rejection_reason: Optional[str] = None


class UserKycResponse(UserKycBase):
    id: str
    status: str
    rejection_reason: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

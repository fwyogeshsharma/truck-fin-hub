import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";
import { Search, HelpCircle, TruckIcon, Wallet, UserCircle, IndianRupee, FileText, Shield, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const faqCategories = {
    general: {
      title: "General Questions",
      icon: HelpCircle,
      color: "blue",
      questions: [
        {
          q: "How do I reset my password?",
          a: "If you've forgotten your password, click the 'Forgot Password' link on the login page. Enter your registered email address, and we'll send you a secure password reset link. Follow the instructions in the email to create a new password. If you don't receive the email within 5 minutes, check your spam folder or contact our support team at support@rollingradius.com."
        },
        {
          q: "How long does account approval take?",
          a: "Account approval typically takes 1-2 business days. Our admin team manually reviews all new registrations to ensure platform security and compliance. During the review process, we verify your submitted documents, contact information, and business details. You'll receive an email notification once your account is approved. If your application is pending for more than 2 business days, please contact our support team for an update."
        },
        {
          q: "Can I have multiple roles on the platform?",
          a: "No, each account is assigned one primary role (Load Owner, Lender, Transporter, or Load Agent) during registration. This ensures clear accountability and streamlined operations. If you need to perform activities across multiple roles, you'll need to create separate accounts for each role using different email addresses. Each account will have its own verification process and dashboard tailored to that specific role."
        },
        {
          q: "Is my personal and financial information secure?",
          a: "Yes, absolutely. LogiFin takes security very seriously. We use industry-standard encryption (SSL/TLS) for all data transmission, secure database storage, and regular security audits. Your financial information, documents, and personal details are protected with multi-layer security protocols. We never share your information with third parties without your explicit consent, except as required by law. All payment transactions are processed through secure, verified payment gateways."
        },
        {
          q: "Can I delete my account?",
          a: "Yes, you can request account deletion by contacting our support team at support@rollingradius.com. Please note that account deletion is permanent and cannot be reversed. Before deletion, ensure that: (1) You have no active trips or pending investments, (2) All outstanding payments are settled, (3) Your wallet balance is zero. We'll retain certain transaction records as required by law and regulatory compliance, but your personal information will be permanently removed from our active systems."
        },
        {
          q: "What are the platform fees?",
          a: "LogiFin charges a small service fee to maintain the platform and ensure smooth operations. The fee structure varies by role: Lenders pay a 1-2% fee on investment returns, Load Owners/Transporters pay a processing fee on financed trips, and the platform charges no fees for basic account operations like registration, profile updates, or browsing opportunities. Detailed fee information is available in your dashboard under 'Settings > Billing & Fees'."
        }
      ]
    },
    loadOwner: {
      title: "Load Owner / Borrower Questions",
      icon: TruckIcon,
      color: "green",
      questions: [
        {
          q: "What if I can't repay my loan on time?",
          a: "If you anticipate difficulty in making timely repayment, contact your lender immediately through the platform's messaging system. Open communication is crucial. Late payments typically incur penalty charges as specified in your loan agreement (usually 2-3% additional interest). Continued non-payment may result in: (1) Additional late fees and compounding penalties, (2) Negative impact on your credit rating within the platform, (3) Restriction from future borrowing, (4) Legal action by the lender. It's always better to communicate proactively and work out a revised payment plan with your lender rather than defaulting silently."
        },
        {
          q: "How is interest calculated on my loan?",
          a: "Interest is calculated using the simple daily interest formula:\n\nInterest = (Principal × Interest Rate × Actual Days) / (365 × 100)\n\nFor example, if you borrow ₹1,00,000 at 12% annual interest for 30 days:\nInterest = (1,00,000 × 12 × 30) / (365 × 100) = ₹986.30\n\nTotal Repayment = Principal + Interest = ₹1,00,000 + ₹986.30 = ₹1,00,986.30\n\nImportant notes:\n• Interest is calculated on actual days, not months\n• Early repayment may save you interest costs\n• Late payments incur additional penalty charges\n• All calculations are transparent and shown in your dashboard before confirmation"
        },
        {
          q: "Can I cancel a trip request after creating it?",
          a: "Yes, you can cancel a trip request, but only under certain conditions:\n\n• Before Funding: If no lender has invested yet, you can cancel freely without any penalties\n• After Funding but Before Acceptance: If a lender has funded but the transporter hasn't accepted yet, you'll need to coordinate with the lender. Cancellation may incur a small processing fee\n• After Transporter Acceptance: Cancellation at this stage is not recommended and requires approval from both lender and transporter. May result in penalties\n• In Transit: Cannot be cancelled. You must complete the trip\n\nTo cancel, go to 'My Trips' in your dashboard, select the trip, and click 'Request Cancellation'. Provide a valid reason for review."
        },
        {
          q: "What documents do I need for trip financing?",
          a: "To request trip financing, you'll need to provide:\n\nMandatory Documents:\n• Valid government-issued ID (Aadhaar, PAN Card, or Driving License)\n• Business registration documents (if applicable)\n• GST certificate (for trips above ₹50,000)\n• Trip details: Origin, destination, load type, weight, and value\n\nAdditional Documents (may be required):\n• Previous trip records or invoices\n• Transporter agreement or booking confirmation\n• Load/cargo insurance details\n• E-Way Bill (generated after funding approval)\n\nAll documents can be uploaded in PDF, JPEG, or PNG format (max 5MB per file). Ensure all documents are clear, valid, and not expired."
        },
        {
          q: "Can I repay my loan early?",
          a: "Yes! Early repayment is encouraged and will save you interest costs. When you repay before the maturity date:\n\n• Interest is calculated only for actual days the loan was active\n• No prepayment penalties are charged\n• Savings are automatically reflected in your final payment amount\n• Your credit rating within the platform improves\n\nExample: If you borrowed ₹1,00,000 at 12% for 30 days but repaid after 20 days, you'll only pay interest for 20 days instead of 30, saving approximately ₹328.\n\nTo make early repayment, go to 'Loan Closure' in your dashboard and click 'Close Loan' on the active trip. Review the calculated amount and confirm payment."
        }
      ]
    },
    lender: {
      title: "Lender / Investor Questions",
      icon: Wallet,
      color: "purple",
      questions: [
        {
          q: "What happens if the borrower doesn't repay?",
          a: "In the unfortunate event of non-payment, LogiFin has several recovery mechanisms:\n\n1. Automated Reminders: The borrower receives automated payment reminders starting 3 days before the due date\n\n2. Late Payment Penalties: Additional interest (2-3%) is charged after the due date, increasing your overall returns\n\n3. Defaulter Listing: Chronic defaulters are listed on the 'Defaulters' page, visible to all platform users, which impacts their ability to secure future financing\n\n4. Platform Mediation: Our support team will mediate between you and the borrower to negotiate a repayment plan\n\n5. Legal Support: For significant defaults, we can provide legal documentation to support your recovery efforts\n\nImportant: LogiFin acts as a facilitator. While we support the recovery process, the loan agreement is directly between you and the borrower. We recommend diversifying your investments across multiple trips to minimize risk."
        },
        {
          q: "Can I withdraw my bid after placing it?",
          a: "Bid withdrawal depends on the current status:\n\n• Before Borrower Acceptance (Pending Bids): Yes, you can withdraw freely. Your escrowed funds will be returned to your wallet within 24 hours. Go to 'My Investments' > 'Pending Bids' and click 'Withdraw Bid'.\n\n• After Borrower Acceptance but Before Trip Start: Withdrawal requires borrower approval and may incur a 1% processing fee due to the inconvenience caused.\n\n• After Trip Starts (In Transit): Cannot be withdrawn. Your investment is now locked until trip completion and loan repayment.\n\nBest Practice: Carefully review all trip details, borrower ratings, and terms before placing your bid to avoid withdrawal situations."
        },
        {
          q: "How are my returns calculated?",
          a: "Your investment returns are calculated using the same interest formula as the borrower's loan:\n\nExpected Return = Investment Amount × (Interest Rate / 365) × Maturity Days / 100\n\nExample Investment Scenarios:\n\n1. ₹50,000 at 12% for 30 days:\n   Return = 50,000 × (12/365) × 30 / 100 = ₹493.15\n   Total Received = ₹50,493.15\n\n2. ₹1,00,000 at 15% for 45 days:\n   Return = 1,00,000 × (15/365) × 45 / 100 = ₹1,849.32\n   Total Received = ₹1,01,849.32\n\nKey Points:\n• Returns are credited to your wallet upon successful loan repayment\n• Annual Return Rate (ARR) is calculated and displayed for easy comparison\n• Early repayment reduces returns proportionally (you receive interest for actual days only)\n• Late payments may increase your returns due to penalty charges\n• Platform fee (1-2%) is deducted from your returns"
        },
        {
          q: "What is the financial questionnaire for?",
          a: "The financial questionnaire is a one-time assessment that helps us understand your investment profile, risk appetite, and experience level. This information is used to:\n\n• Provide personalized investment recommendations\n• Match you with suitable trip financing opportunities\n• Ensure compliance with investment guidelines\n• Help you diversify your portfolio effectively\n• Protect less experienced investors from high-risk opportunities\n\nYou only need to complete it once after your first login as a lender. The questionnaire covers:\n• Your investment experience and knowledge\n• Financial goals and objectives\n• Risk tolerance level\n• Available investment capital\n• Diversification preferences\n\nBased on your responses, we'll assign you an investor category (Conservative, Moderate, or Aggressive) and recommend suitable opportunities. You can update your profile anytime from 'Settings > Investment Profile'."
        },
        {
          q: "How do I choose the right investment opportunity?",
          a: "When evaluating investment opportunities, consider these factors:\n\n1. Borrower Rating: Check their star rating (1-5 stars) based on previous repayment history, completion rate, and platform activity. Higher ratings indicate lower risk.\n\n2. Interest Rate: Typically ranges from 8-20% annually. Higher rates often indicate higher risk. Compare with market standards.\n\n3. Maturity Period: Shorter durations (15-30 days) mean faster returns but require more active management. Longer periods (45-90 days) offer less frequent reinvestment.\n\n4. Trip Details: Review the route, cargo type, and distance. Familiar or shorter routes may be lower risk.\n\n5. Loan Amount: Start with smaller amounts (₹25,000 - ₹50,000) until you're comfortable with the platform.\n\n6. Diversification: Spread your investments across multiple trips rather than putting all funds in one opportunity.\n\n7. Borrower History: Check their past trips, repayment punctuality, and total completed transactions.\n\nBest Practice: Maintain a balanced portfolio with 60-70% in low-risk (high-rated borrowers) and 30-40% in higher-return opportunities."
        },
        {
          q: "When will I receive my returns?",
          a: "Returns are credited to your wallet immediately upon successful loan repayment by the borrower. The typical timeline is:\n\n1. Trip Completion: Borrower marks trip as completed\n2. Confirmation: Transporter confirms delivery (if applicable)\n3. Loan Repayment: Borrower initiates repayment from 'Loan Closure' section\n4. Platform Processing: Payment is verified (usually instant)\n5. Credit to Wallet: Your principal + interest is credited to your wallet within minutes\n\nMaturity Date: This is the expected repayment date agreed in the loan contract. Most borrowers repay on or before this date.\n\nEarly Repayment: Borrowers can repay early (you'll receive proportional interest)\nLate Repayment: You'll receive additional penalty charges along with your returns\n\nAfter receiving returns in your wallet, you can:\n• Reinvest in new opportunities immediately\n• Withdraw to your bank account (processed in 1-2 business days)\n• Keep in wallet for future investments"
        }
      ]
    },
    transporter: {
      title: "Transporter Questions",
      icon: TruckIcon,
      color: "orange",
      questions: [
        {
          q: "How do I get paid for completed trips?",
          a: "Your payment process is straightforward and secure:\n\n1. Trip Acceptance: When you accept a funded trip, the payment amount is already secured in escrow by the platform.\n\n2. Trip Completion: Once you complete the delivery, mark the trip as 'Completed' in your dashboard under 'Active Trips'.\n\n3. Borrower Confirmation: The load owner/borrower will verify and confirm the successful delivery. This confirmation is usually done within 24-48 hours.\n\n4. Automatic Payment: Upon confirmation, your payment is automatically credited to your LogiFin wallet within minutes. No need to chase payments or wait for checks!\n\n5. Withdrawal: You can withdraw your earnings to your bank account anytime from the 'Wallet' section. Bank transfers typically take 1-2 business days.\n\nPayment Amount Includes:\n• Base freight charges as agreed\n• Any additional charges (toll, loading/unloading)\n• Fuel surcharges (if applicable)\n\nNote: Ensure all required documents (E-Way Bill, POD, Bilty) are properly maintained as they may be requested for verification."
        },
        {
          q: "Can I reject a trip after accepting it?",
          a: "While we strongly discourage trip rejection after acceptance, we understand that emergencies happen. Here's what you need to know:\n\nWithin 2 Hours of Acceptance:\n• You can cancel without penalty through your dashboard\n• The trip will be returned to the 'Available Trips' pool\n• Your acceptance rate will not be affected\n\nAfter 2 Hours but Before Trip Start:\n• Contact LogiFin support immediately at support@rollingradius.com or +91 90248-22434\n• Provide a valid reason (vehicle breakdown, driver unavailability, etc.)\n• A cancellation fee (5-10% of trip value) may be charged\n• Your acceptance rate and rating will be impacted\n\nAfter Trip Has Started:\n• Cancellation is not permitted\n• You must complete the delivery or arrange a replacement transporter\n• Failure to deliver may result in account suspension and legal action\n\nBest Practice: Only accept trips you're confident you can complete. Check your vehicle availability, driver schedules, and route feasibility before clicking 'Accept'."
        },
        {
          q: "What documents do I need to provide?",
          a: "As a transporter, you need to maintain and provide several documents for compliance and tracking:\n\nInitial Registration Documents:\n• Valid Driving License\n• Vehicle Registration Certificate (RC)\n• PAN Card\n• GST Registration (if applicable)\n• Insurance documents for your vehicle\n• Bank account details for payments\n\nFor Each Trip (Generated/Required):\n• E-Way Bill: Generated for GST compliance (required for interstate transport)\n• Bilty / Consignment Note: Transport receipt issued to the consignor\n• Proof of Delivery (POD): Signed document confirming successful delivery\n• Gate Pass / Weighment Slips: If loading/unloading at warehouses\n• Freight Invoice: Your invoice for the transportation service\n\nDocument Upload:\n• Upload clear, legible copies in PDF, JPEG, or PNG format\n• Maximum file size: 5MB per document\n• Documents can be uploaded during trip progress or after completion\n• Some documents may be auto-generated by the platform\n\nKeep physical copies with you during transport for verification at checkpoints."
        },
        {
          q: "How are routes and distances calculated?",
          a: "LogiFin uses advanced mapping technology to calculate the most efficient routes and accurate distances:\n\nRoute Calculation:\n• Uses Google Maps API for real-time route mapping\n• Considers fastest/shortest route based on current conditions\n• Accounts for highway availability and toll routes\n• Provides alternative route options when available\n\nDistance Calculation:\n• Distance shown in kilometers (km) is the estimated travel distance\n• Updated periodically based on road network changes\n• May include detours for loading/unloading points\n• Displayed during trip browsing for transparency\n\nPayment Consideration:\n• Your freight charges are calculated based on the displayed distance\n• If actual distance varies significantly (more than 10%), contact support\n• Toll charges may be reimbursed separately (if agreed in contract)\n• Fuel consumption estimates are based on displayed distance\n\nNote: Always verify the route before accepting the trip to ensure it matches your operational capabilities and preferred routes."
        }
      ]
    },
    wallet: {
      title: "Wallet & Payments",
      icon: Wallet,
      color: "emerald",
      questions: [
        {
          q: "How do I add money to my wallet?",
          a: "Adding money to your LogiFin wallet is simple and secure:\n\nSupported Payment Methods:\n• UPI: Google Pay, PhonePe, Paytm, BHIM, etc.\n• Net Banking: All major Indian banks\n• Debit/Credit Cards: Visa, Mastercard, RuPay\n• Mobile Wallets: Paytm, Mobikwik (coming soon)\n\nSteps to Add Money:\n1. Go to 'Wallet' section in your dashboard\n2. Click 'Add Money' button\n3. Enter the amount you want to add (minimum ₹500, maximum ₹5,00,000 per transaction)\n4. Select your preferred payment method\n5. Complete the payment through secure payment gateway\n6. Money is credited instantly upon successful payment\n\nImportant Points:\n• No charges for adding money to wallet (payment gateway charges may apply)\n• Transaction history is available in 'Wallet > Transactions'\n• Failed transactions are automatically refunded within 24-48 hours\n• For security, large transactions (above ₹2,00,000) may require additional verification"
        },
        {
          q: "How do I withdraw money from my wallet?",
          a: "Withdrawing your earnings is quick and straightforward:\n\nWithdrawal Process:\n1. Navigate to 'Wallet' in your dashboard\n2. Ensure your bank account is verified (one-time setup)\n3. Click 'Withdraw' button\n4. Enter withdrawal amount (minimum ₹100, maximum is your available balance)\n5. Verify the bank account details displayed\n6. Confirm withdrawal request\n7. Funds are transferred via NEFT/IMPS\n\nProcessing Time:\n• IMPS (for amounts up to ₹2,00,000): Instant to 30 minutes\n• NEFT (for amounts above ₹2,00,000): 2-4 hours during banking hours\n• Bank transfers initiated after 5 PM are processed next business day\n\nWithdrawal Limits:\n• Minimum: ₹100\n• Maximum per transaction: ₹10,00,000\n• Maximum per day: ₹25,00,000\n• No limit on number of withdrawals\n\nNote: Ensure your available balance is sufficient (escrowed and locked amounts cannot be withdrawn). Small processing fee may apply (typically ₹5-10 per transaction)."
        },
        {
          q: "What is 'Locked Amount' and 'Escrowed Amount' in my wallet?",
          a: "Your wallet balance is divided into three categories for transparency and security:\n\n1. Available Balance:\n• Money you can freely use for new investments or withdraw to bank\n• Not committed to any pending transaction\n• Can be used immediately\n\n2. Escrowed Amount (For Lenders):\n• Money you've committed to pending investment bids\n• Held securely until borrower accepts/rejects your bid\n• If bid is rejected or withdrawn, amount returns to 'Available Balance'\n• If bid is accepted, amount moves to 'Locked Amount'\n• Cannot be withdrawn or used for other investments while escrowed\n\n3. Locked Amount:\n• For Lenders: Your active investments that are currently funding ongoing trips. Will be returned with interest upon loan repayment.\n• For Load Owners: Advance payments or security deposits for active trips\n• Cannot be withdrawn until the associated transaction completes\n• Released automatically upon trip completion or loan repayment\n\nTotal Wallet Balance = Available + Escrowed + Locked\n\nYou can view the detailed breakdown in your Wallet dashboard with transaction-wise details."
        },
        {
          q: "Are there any transaction fees?",
          a: "LogiFin maintains a transparent fee structure with minimal charges:\n\nWallet Operations:\n• Adding money: No platform fee (payment gateway may charge 0-2%)\n• Withdrawals: ₹5-10 per transaction (varies by amount and method)\n• Wallet maintenance: No charges\n\nFor Lenders:\n• Investment platform fee: 1-2% of returns earned\n• No fees on principal amount\n• No fees for browsing or bidding\n• Example: Earn ₹1,000 as interest → Platform fee ₹10-20 → You receive ₹980-990\n\nFor Load Owners/Borrowers:\n• Loan processing fee: 1-2% of loan amount (one-time)\n• Late payment penalty: 2-3% additional interest (if applicable)\n• No fees for early repayment\n• Example: Borrow ₹1,00,000 → Processing fee ₹1,000-2,000\n\nFor Transporters:\n• No platform fees on earnings\n• Standard payment processing charges apply (already factored)\n• Cancellation penalty: 5-10% (only if you reject after accepting trip)\n\nAll fees are clearly displayed before you confirm any transaction. No hidden charges."
        }
      ]
    },
    currency: {
      title: "Currency Display & Calculations",
      icon: IndianRupee,
      color: "yellow",
      questions: [
        {
          q: "Why do amounts display differently across the platform?",
          a: "LogiFin uses smart currency formatting to improve readability and optimize screen space while maintaining accuracy:\n\nCurrency Display Formats:\n\n1. Full Amount (Below ₹1,00,000):\n   • Shows complete number with Indian comma formatting\n   • Examples: ₹5,000 | ₹25,500 | ₹95,000\n   • Used for smaller transactions and detailed views\n\n2. K Notation (₹1,00,000 to ₹99,99,999):\n   • K stands for 'Thousand'\n   • Examples: ₹100K (₹1,00,000) | ₹500K (₹5,00,000) | ₹1500K (₹15,00,000)\n   • Used in cards, tables, and mobile views\n\n3. L Notation (₹1,00,00,000 to ₹9,99,99,999):\n   • L stands for 'Lakh' (traditional Indian notation)\n   • Examples: ₹50L (₹50,00,000) | ₹150L (₹1,50,00,000)\n   • Used in summary views and statistics\n\n4. Cr Notation (₹10,00,00,000 and above):\n   • Cr stands for 'Crore'\n   • Examples: ₹5Cr (₹5,00,00,000) | ₹100Cr (₹100,00,00,000)\n   • Used for very large amounts in analytics\n\nWhy Different Formats?\n• Improves readability on mobile devices\n• Makes large numbers easier to comprehend quickly\n• Follows Indian numbering conventions (Lakh, Crore)\n• Maintains precision in calculations regardless of display\n\nImportant: Hover over any amount to see the exact full value. All calculations use precise amounts, never rounded display values."
        },
        {
          q: "How accurate are the interest and return calculations?",
          a: "All calculations on LogiFin are precise to the paisa (₹0.01) level:\n\nCalculation Method:\n• Uses standardized simple interest formula\n• Interest = (Principal × Rate × Days) / (365 × 100)\n• No rounding during calculation - only for final display\n• Accounts for actual calendar days (not 30-day months)\n• Leap years are handled correctly (366 days)\n\nTransparency Features:\n• Calculation breakdown shown before confirmation\n• Formula and values displayed step-by-step\n• Real-time updates as you change rate or period\n• No hidden charges added to calculations\n\nExample Detailed Calculation:\nLoan: ₹1,25,000 at 14.5% for 38 days\n\nStep 1: Interest = (1,25,000 × 14.5 × 38) / (365 × 100)\nStep 2: Interest = (68,875,000) / (36,500)\nStep 3: Interest = ₹1,886.99 (precise)\nStep 4: Total = ₹1,25,000 + ₹1,886.99 = ₹1,26,886.99\n\nAll amounts shown in your dashboard reflect these precise calculations. You can verify using the formula displayed in the 'Repayment Calculator' or 'Investment Calculator' tools."
        }
      ]
    },
    security: {
      title: "Security & Privacy",
      icon: Shield,
      color: "red",
      questions: [
        {
          q: "How does LogiFin protect my financial information?",
          a: "LogiFin employs multiple layers of security to protect your sensitive information:\n\nData Encryption:\n• All data transmission uses 256-bit SSL/TLS encryption (bank-level security)\n• Passwords are hashed using industry-standard bcrypt algorithm\n• Financial data encrypted at rest in secure databases\n• No plain-text storage of sensitive information\n\nSecure Payment Processing:\n• All payments processed through PCI-DSS compliant gateways\n• We never store your complete card details\n• Two-factor authentication for large transactions\n• Real-time fraud detection systems\n\nAccess Controls:\n• Multi-factor authentication options available\n• Session timeout after 30 minutes of inactivity\n• Login alerts via email for new device access\n• Role-based access control (you only see what's relevant)\n\nRegular Security Audits:\n• Quarterly security assessments\n• Vulnerability scanning and penetration testing\n• Compliance with data protection regulations\n• Incident response plan in place\n\nYour Responsibility:\n• Use strong, unique passwords\n• Enable two-factor authentication (Settings > Security)\n• Never share your login credentials\n• Log out from shared devices\n• Report suspicious activity immediately"
        },
        {
          q: "What happens to my data if I delete my account?",
          a: "When you request account deletion, here's what happens to your data:\n\nImmediately Upon Deletion:\n• Your active login credentials are deactivated\n• Profile information removed from public view\n• Your name removed from searchable user lists\n• Access to dashboard and features terminated\n\nPersonal Data Removal (Within 30 days):\n• Contact information (email, phone) deleted\n• Identity documents removed from storage\n• Bank details permanently erased\n• Profile pictures and uploaded documents deleted\n\nData Retained for Legal/Regulatory Compliance:\n• Transaction history (required for 7 years as per Indian law)\n• Financial records and GST documents\n• Contract documents for completed transactions\n• Anonymized analytics data (with no personally identifiable information)\n\nWhat's NOT deleted:\n• Ratings and reviews you've given/received (anonymized)\n• Public forum posts or comments (attributed to 'Deleted User')\n• Transaction records involving other active users\n\nBefore requesting deletion, ensure:\n• All active trips/investments are completed\n• Outstanding payments are settled\n• Wallet balance is withdrawn\n• No pending disputes or legal matters\n\nTo request deletion: Email support@rollingradius.com with subject 'Account Deletion Request' and include your registered email and reason for leaving."
        }
      ]
    },
    documents: {
      title: "Documents & Verification",
      icon: FileText,
      color: "indigo",
      questions: [
        {
          q: "What documents are required for account verification?",
          a: "Document requirements vary by your role on the platform:\n\nAll Users (Mandatory):\n• Government-issued Photo ID: Aadhaar Card, PAN Card, Driving License, or Passport\n• PAN Card: Required for all financial transactions\n• Bank Account Proof: Cancelled cheque or bank statement (last 3 months)\n• Selfie/Photo: For identity verification\n\nLoad Owners/Borrowers (Additional):\n• Business Registration: GST certificate, Shop Act, or MSME registration\n• Address Proof: Utility bill or rental agreement (not older than 3 months)\n• Previous Transport Records: Invoices or bilty from past shipments (if available)\n\nLenders/Investors (Additional):\n• Income Proof: Salary slips, ITR, or bank statements (last 6 months)\n• PAN Card: Mandatory for investment activities\n• Financial Questionnaire: One-time investment profile assessment\n\nTransporters (Additional):\n• Vehicle Registration Certificate (RC): For all vehicles\n• Driving License: Valid and not expired\n• Vehicle Insurance: Valid policy copy\n• Pollution Certificate: Current PUC\n• Permit Documents: If operating interstate/nationally\n\nDocument Upload Guidelines:\n• Accepted formats: PDF, JPEG, PNG (max 5MB per file)\n• Documents must be clear, complete, and legible\n• Ensure documents are valid (not expired)\n• Aadhaar masking: You can mask last 4 digits if desired\n• Processing time: 24-48 hours after submission"
        },
        {
          q: "How long does document verification take?",
          a: "Document verification timelines vary based on document type and accuracy:\n\nVerification Timeline:\n\n1. Instant Verification (5-10 minutes):\n   • Aadhaar authentication via OTP\n   • PAN verification through government database\n   • Bank account verification via penny drop\n\n2. Manual Review (24-48 hours):\n   • Business registration documents\n   • Vehicle papers and insurance\n   • Income proof and financial documents\n   • Address proof verification\n   • ID photo matching\n\n3. Re-verification (if documents rejected):\n   • Resubmit corrected documents\n   • Additional 24 hours review time\n   • Common rejection reasons: Blurry images, expired documents, name mismatch\n\nVerification Status:\n• Check status in 'Profile > Documents'\n• Email notifications at each stage\n• Green checkmark = Verified\n• Yellow pending = Under review\n• Red cross = Rejected (hover for reason)\n\nQuick Verification Tips:\n• Upload all required documents at once\n• Ensure name matches exactly across all documents\n• Use clear, high-resolution scans or photos\n• Ensure documents are not expired\n• Double-check for completeness before uploading\n\nIf verification is taking longer than 48 hours, contact support with your application reference number."
        }
      ]
    }
  };

  // Filter FAQs based on search query
  const filterFAQs = (category: any) => {
    if (!searchQuery) return category.questions;
    return category.questions.filter((faq: any) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const totalQuestions = Object.values(faqCategories).reduce(
    (total, category) => total + category.questions.length,
    0
  );

  return (
    <DashboardLayout role="transporter">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
          <p className="text-muted-foreground mt-1">
            Find answers to common questions about LogiFin platform
          </p>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search FAQs... (e.g., 'how to reset password', 'interest calculation')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {totalQuestions} questions available across all categories
            </p>
          </CardContent>
        </Card>

        {/* FAQ Categories Tabs */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 h-auto">
            {Object.entries(faqCategories).slice(0, 8).map(([key, category]) => {
              const Icon = category.icon;
              const filteredCount = filterFAQs(category).length;
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex items-center gap-2 justify-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.title.split(' ')[0]}</span>
                  {searchQuery && <Badge variant="secondary" className="ml-1">{filteredCount}</Badge>}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(faqCategories).map(([key, category]) => {
            const filteredQuestions = filterFAQs(category);
            const Icon = category.icon;

            return (
              <TabsContent key={key} value={key} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className={`h-6 w-6 text-${category.color}-600`} />
                      {category.title}
                    </CardTitle>
                    <CardDescription>
                      {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''} in this category
                      {searchQuery && ` matching "${searchQuery}"`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredQuestions.length > 0 ? (
                      <Accordion type="single" collapsible className="w-full">
                        {filteredQuestions.map((faq: any, index: number) => (
                          <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-left hover:no-underline">
                              <div className="flex items-start gap-3">
                                <Badge variant="outline" className="mt-1">Q{index + 1}</Badge>
                                <span>{faq.q}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="pl-12 pr-4 pt-2">
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                  {faq.a.split('\n\n').map((paragraph: string, pIndex: number) => (
                                    <p key={pIndex} className="mb-3 whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                                      {paragraph}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <HelpCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No questions found matching "{searchQuery}"</p>
                        <p className="text-xs mt-1">Try different keywords or browse other categories</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Still Need Help Section */}
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <HelpCircle className="h-12 w-12 mx-auto text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Still need help?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Our support team is here to assist you
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="mailto:support@rollingradius.com"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Email Support
                </a>
                <a
                  href="tel:+919024822434"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  Call: +91 90248-22434
                </a>
              </div>
              <p className="text-xs text-muted-foreground">
                Support Hours: Mon-Fri (9 AM - 6 PM IST) | Sat (10 AM - 4 PM IST)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FAQ;

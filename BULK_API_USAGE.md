# Bulk Trip Creation API

## Endpoint
```
POST http://localhost:3001/api/trips/bulk
```

## Business Logic
- **Receiver (Consignee)** = Load Owner (the company receiving goods - they need the loan)
- **Sender (Consignor)** = Client Company (the company sending goods) - OPTIONAL
- **Transporter** = Vehicle Owner (transporting the goods)

## Request Example (cURL)
```bash
curl -X POST http://localhost:3001/api/trips/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "ewayBillNumber": "123456789012",
      "pickup": "Mumbai, Maharashtra",
      "destination": "Delhi, NCR",
      "sender": "ABC Company Pvt Ltd",
      "receiver": "XYZ Industries Ltd",
      "transporter": "Fast Transport Services",
      "loanAmount": 50000,
      "loanInterestRate": 12,
      "maturityDays": 30,
      "distance": 1400,
      "loadType": "Electronics",
      "weight": 15000
    },
    {
      "ewayBillNumber": "987654321098",
      "pickup": "Bangalore, Karnataka",
      "destination": "Chennai, Tamil Nadu",
      "receiver": "ABC Logistics Ltd",
      "transporter": "Quick Transport Ltd",
      "loanAmount": 75000,
      "loanInterestRate": 10,
      "maturityDays": 45,
      "distance": 350,
      "loadType": "Machinery",
      "weight": 25000
    }
  ]'
```

## Request Example (Postman)
1. Method: `POST`
2. URL: `http://localhost:3001/api/trips/bulk`
3. Headers:
   - `Content-Type: application/json`
4. Body (raw JSON):
```json
[
  {
    "ewayBillNumber": "123456789012",
    "pickup": "Mumbai, Maharashtra",
    "destination": "Delhi, NCR",
    "sender": "ABC Company Pvt Ltd",
    "receiver": "XYZ Industries Ltd",
    "transporter": "Fast Transport Services",
    "loanAmount": 50000,
    "loanInterestRate": 12,
    "maturityDays": 30,
    "distance": 1400,
    "loadType": "Electronics",
    "weight": 15000
  }
]
```

## Required Fields
- `ewayBillNumber`
- `pickup`
- `destination`
- `receiver` (consignee/load owner - will be looked up in database by name/company)
- `transporter` (will be looked up in database by name/company)
- `loanAmount`
- `loanInterestRate`
- `maturityDays`
- `distance`
- `loadType`
- `weight`

## Optional Fields
- `sender` (consignor/client company name)

## Important Notes
1. **Receiver (Consignee) must exist** in the database with `role='load_owner'`
2. **Transporter must exist** in the database with `role='vehicle_owner'`
3. The API matches names **case-insensitively** against both `name` and `company` fields
4. If any trip fails, other trips will still be created (partial success)

## Response Examples

### All Success
```json
{
  "success": true,
  "message": "Successfully created 2 trips",
  "created": 2,
  "failed": 0
}
```

### Partial Success
```json
{
  "success": false,
  "message": "Partially successful: 1 created, 1 failed",
  "created": 1,
  "failed": 1,
  "errors": [
    {
      "index": 1,
      "data": {
        "ewayBillNumber": "987654321098",
        "receiver": "NonExistent Company",
        ...
      },
      "error": "Load owner (consignee) \"NonExistent Company\" not found in database"
    }
  ]
}
```

### All Failed
```json
{
  "success": false,
  "message": "Failed to create any trips",
  "created": 0,
  "failed": 1,
  "errors": [
    {
      "index": 0,
      "data": {...},
      "error": "Transporter \"Unknown Transport\" not found in database"
    }
  ]
}
```

## DO NOT USE
❌ `POST http://localhost:3001/api/trips` - This is for the form-based single trip creation, not bulk!

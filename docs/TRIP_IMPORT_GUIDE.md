# Trip Import Guide

This guide explains the three different ways to create trips in the Load Agent Dashboard.

## 1. Single Trip Form

Create trips one at a time using a simple form interface.

**Steps:**
1. Click "Create Trip" button
2. Select the "Single Trip" tab
3. Fill in the trip details:
   - Trip Date
   - Maturity Days (1-180)
   - Origin & Destination
   - Distance (km)
   - Load Type
   - Weight (kg)
   - Trip Value (₹20,000 - ₹80,000)
4. Click "Create Trip"

**Best for:** Creating individual trips with full control over each field.

---

## 2. Bulk Upload (Excel/CSV)

Upload multiple trips at once using an Excel or CSV file.

**Steps:**
1. Click "Create Trip" button
2. Select the "Bulk Upload" tab
3. Click "Download Sample Template" to get the CSV format
4. Fill the CSV with your trip data
5. Upload the completed file

**CSV Format:**
```csv
Origin,Destination,Distance (km),Load Type,Weight (kg),Amount (₹),Maturity Days,Date
Mumbai, Maharashtra,Delhi, NCR,1400,Electronics,15000,50000,30,2025-10-06
Bangalore, Karnataka,Chennai, Tamil Nadu,350,FMCG,12000,35000,25,2025-10-07
```

**Requirements:**
- CSV format with comma-separated values
- First row must be headers (will be skipped)
- Trip amount must be between ₹20,000 and ₹80,000
- All required fields must be present

**Best for:** Creating multiple trips quickly from existing data or systems.

---

## 3. API Import

Fetch trips automatically from an external API endpoint.

**Steps:**
1. Click "Create Trip" button
2. Select the "API Import" tab
3. Enter your API endpoint URL
4. Click "Fetch & Import Trips"

**API Response Format:**

Your API should return a JSON array of trips:

```json
[
  {
    "origin": "Mumbai, Maharashtra",
    "destination": "Delhi, NCR",
    "distance": 1400,
    "loadType": "Electronics",
    "weight": 15000,
    "amount": 50000,
    "maturityDays": 30
  }
]
```

Or an object with a "trips" or "data" field:

```json
{
  "trips": [
    { /* trip data */ }
  ]
}
```

**Supported Field Names:**

The API import is flexible and supports multiple field naming conventions:

| Field | Supported Names |
|-------|----------------|
| Origin | `origin`, `from`, `source` |
| Destination | `destination`, `to`, `target` |
| Distance | `distance`, `distanceKm`, `distance_km` |
| Load Type | `loadType`, `load_type`, `cargoType` |
| Weight | `weight`, `weightKg`, `weight_kg` |
| Amount | `amount`, `value`, `price` |
| Maturity Days | `maturityDays`, `maturity_days`, `paymentTerm` |
| Risk Level | `riskLevel` (optional: low/medium/high) |
| Insurance | `insuranceStatus` (optional: boolean) |

**Validation:**
- Origin and destination are required
- Amount must be between ₹20,000 and ₹80,000
- Invalid trips will be skipped with error count shown

**Best for:** Integrating with external systems, ERP platforms, or other logistics software.

---

## Testing the API Import

A sample API endpoint is available for testing:

```
http://localhost:8081/sample-api-response.json
```

This will import 5 sample trips to test the functionality.

---

## Error Handling

All three methods provide feedback on success and failure:

- ✅ **Success:** Shows count of trips created
- ❌ **Errors:** Shows count of failed imports
- 📋 **Details:** Check browser console for specific error messages

---

## Tips

1. **Validation:** All trips must have amounts between ₹20,000 and ₹80,000
2. **Refresh:** Trip list automatically refreshes after successful import
3. **Progress:** Watch the loading indicators during bulk operations
4. **Testing:** Use the sample template/API to test before importing real data

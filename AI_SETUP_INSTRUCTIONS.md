# AI Investment Advisor Setup Instructions

This document explains how to set up and configure the Gemini AI-powered investment advisor feature for the Lender dashboard.

## Features

The AI Investment Advisor provides:
- **Portfolio Health Assessment** - 1-10 rating with detailed explanation
- **Personalized Recommendations** - Top 3 actionable steps to improve returns
- **Risk Analysis** - Identifies current risks in the portfolio
- **Diversification Strategy** - How to spread investments better
- **Growth Opportunities** - Sectors or borrowers to focus on

## Prerequisites

- Node.js and npm installed
- Google Gemini API key

## Installation Steps

### 1. Install Required npm Packages

```bash
# Install Google Generative AI package (for backend)
npm install @google/generative-ai

# Install React Markdown (for frontend)
npm install react-markdown
```

### 2. Configure Environment Variables

Add your Gemini API key to your `.env` file:

```bash
# AI Configuration
GEMINI_API_KEY=AIzaSyBNZIq7FskEtkRHqfn_X4eXN-FIx0occtM
```

**For Production (.env.production):**
```bash
GEMINI_API_KEY=your_production_gemini_api_key_here
```

### 3. Restart Your Server

After adding the API key, restart your backend server:

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

## Usage

### For Lenders

1. Log in to your Lender dashboard
2. Once you have made at least one investment, the **AI Investment Advisor** card will appear
3. Click the **"Generate Insights"** button
4. The AI will analyze your portfolio and provide personalized recommendations
5. Click **"Refresh"** to get updated suggestions based on new data

### API Endpoints

#### POST `/api/ai-suggestions/investment-analysis`

Generates comprehensive investment analysis and suggestions.

**Request Body:**
```json
{
  "totalInvested": 100000,
  "totalReturns": 5000,
  "activeInvestments": 5,
  "completedInvestments": 3,
  "portfolioDistribution": [
    { "name": "Company A", "value": 60, "amount": 60000 },
    { "name": "Company B", "value": 40, "amount": 40000 }
  ],
  "monthlyReturns": [
    { "month": "Jan", "returns": 1500 },
    { "month": "Feb", "returns": 1800 }
  ],
  "walletBalance": 50000,
  "escrowedAmount": 10000,
  "riskAppetite": "moderate",
  "investmentExperience": "intermediate"
}
```

**Response:**
```json
{
  "success": true,
  "suggestions": "# Portfolio Health Assessment...",
  "timestamp": "2025-10-30T18:30:00.000Z",
  "metrics": {
    "totalROI": "5.00",
    "avgReturnPerInvestment": "1000.00",
    "portfolioConcentration": 60
  }
}
```

#### GET `/api/ai-suggestions/quick-tip`

Gets a quick investment tip (under 50 words).

**Response:**
```json
{
  "success": true,
  "tip": "Diversify your portfolio across multiple borrowers to reduce concentration risk. Aim for no single borrower to exceed 25% of your total investment."
}
```

## Component Integration

The AI suggestions component is automatically shown in the Lender dashboard when:
- User has at least one investment
- All required data is available

### Component Props

```typescript
interface AIInvestmentSuggestionsProps {
  totalInvested: number;
  totalReturns: number;
  activeInvestments: number;
  completedInvestments: number;
  portfolioDistribution: Array<{
    name: string;
    value: number;
    amount: number;
  }>;
  monthlyReturns: Array<{
    month: string;
    returns: number;
  }>;
  walletBalance: number;
  escrowedAmount: number;
  riskAppetite?: string;
  investmentExperience?: string;
}
```

## Troubleshooting

### API Key Issues

If you see: `"Gemini API key not configured"`

**Solution:** Ensure your `.env` file contains `GEMINI_API_KEY=your_key_here` and restart the server.

### Rate Limiting

Gemini API has rate limits. If you hit them:
- Wait a few minutes before trying again
- Consider implementing request caching
- Upgrade your Gemini API plan if needed

### Component Not Showing

If the AI Advisor card doesn't appear:
1. Check that you have at least one investment
2. Ensure `myInvestments.length > 0`
3. Check browser console for errors
4. Verify the backend API is running

## Security Best Practices

1. **Never commit API keys to Git**
   - Use `.env` files (already in `.gitignore`)
   - Use environment variables in production

2. **Rotate Keys Regularly**
   - Change your Gemini API key periodically
   - Monitor API usage in Google Cloud Console

3. **Rate Limiting**
   - Consider adding rate limiting to prevent abuse
   - Cache AI responses when appropriate

## Cost Considerations

- Gemini API has free tier limits
- Each analysis request consumes API quota
- Monitor usage in [Google AI Studio](https://makersuite.google.com/)
- Consider caching suggestions for a few hours

## Future Enhancements

Potential improvements:
- [ ] Cache AI suggestions for 1-6 hours
- [ ] Add ability to save favorite suggestions
- [ ] Implement A/B testing different prompts
- [ ] Add voice-to-text for asking custom questions
- [ ] Create a chat interface for follow-up questions
- [ ] Generate visual charts from suggestions

## Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Verify API key is valid in [Google AI Studio](https://makersuite.google.com/)
3. Review the [Gemini API Documentation](https://ai.google.dev/docs)

---

**Last Updated:** October 30, 2025
**Version:** 1.0.0

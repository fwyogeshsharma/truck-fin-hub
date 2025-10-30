import express, { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// POST /api/ai-suggestions/investment-analysis - Get AI investment suggestions
router.post('/investment-analysis', async (req: Request, res: Response) => {
  try {
    const {
      totalInvested,
      totalReturns,
      activeInvestments,
      completedInvestments,
      portfolioDistribution,
      monthlyReturns,
      walletBalance,
      escrowedAmount,
      riskAppetite,
      investmentExperience
    } = req.body;

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini API key not configured',
        message: 'Please configure GEMINI_API_KEY in environment variables'
      });
    }

    // Calculate additional metrics
    const totalROI = totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(2) : '0';
    const avgReturnPerInvestment = activeInvestments > 0 ? (totalReturns / activeInvestments).toFixed(2) : '0';
    const portfolioConcentration = portfolioDistribution && portfolioDistribution.length > 0
      ? portfolioDistribution[0].value
      : 0;

    // Create detailed prompt for Gemini
    const prompt = `You are an expert financial advisor specializing in logistics and transportation financing. Analyze the following investment portfolio and provide personalized recommendations:

**Investment Portfolio Summary:**
- Total Amount Invested: ₹${totalInvested.toLocaleString()}
- Total Returns Earned: ₹${totalReturns.toLocaleString()}
- Return on Investment (ROI): ${totalROI}%
- Active Investments: ${activeInvestments}
- Completed Investments: ${completedInvestments}
- Available Balance: ₹${walletBalance.toLocaleString()}
- Escrowed Amount: ₹${escrowedAmount.toLocaleString()}

**Portfolio Distribution:**
${portfolioDistribution && portfolioDistribution.length > 0
  ? portfolioDistribution.slice(0, 5).map((p: any, i: number) =>
      `${i + 1}. ${p.name}: ${p.value}% (₹${p.amount.toLocaleString()})`
    ).join('\n')
  : 'No investments yet'
}

**Top Portfolio Concentration:** ${portfolioConcentration}% in single borrower

**Recent Performance:**
${monthlyReturns && monthlyReturns.length > 0
  ? monthlyReturns.slice(-3).map((m: any) =>
      `- ${m.month}: ₹${m.returns.toLocaleString()} returns`
    ).join('\n')
  : 'No recent returns data'
}

**Investor Profile:**
- Risk Appetite: ${riskAppetite || 'Not specified'}
- Investment Experience: ${investmentExperience || 'Not specified'}

Based on this data, provide:

1. **Portfolio Health Assessment** (Rate 1-10 and explain)
2. **Top 3 Specific Recommendations** (Actionable steps to improve returns)
3. **Risk Analysis** (Identify current risks in the portfolio)
4. **Diversification Strategy** (How to spread investments better)
5. **Growth Opportunities** (Sectors or borrowers to focus on)

Format your response in clear sections with bullet points. Be specific with numbers and percentages. Keep recommendations practical and actionable for logistics financing.`;

    console.log('🤖 [GEMINI] Generating investment suggestions...');

    // Generate content using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const suggestions = response.text();

    console.log('✅ [GEMINI] Suggestions generated successfully');

    res.json({
      success: true,
      suggestions,
      timestamp: new Date().toISOString(),
      metrics: {
        totalROI,
        avgReturnPerInvestment,
        portfolioConcentration
      }
    });

  } catch (error: any) {
    console.error('❌ [GEMINI] Error generating suggestions:', error);
    res.status(500).json({
      error: 'Failed to generate AI suggestions',
      message: error.message
    });
  }
});

// GET /api/ai-suggestions/quick-tip - Get a quick investment tip
router.get('/quick-tip', async (req: Request, res: Response) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini API key not configured'
      });
    }

    const prompt = `Provide one quick, actionable investment tip for someone investing in logistics and transportation financing. Keep it under 50 words. Be specific and practical.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const tip = response.text();

    res.json({
      success: true,
      tip
    });

  } catch (error: any) {
    console.error('Error generating quick tip:', error);
    res.status(500).json({
      error: 'Failed to generate tip',
      message: error.message
    });
  }
});

export default router;

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/api/client';
import ReactMarkdown from 'react-markdown';

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

const AIInvestmentSuggestions = ({
  totalInvested,
  totalReturns,
  activeInvestments,
  completedInvestments,
  portfolioDistribution,
  monthlyReturns,
  walletBalance,
  escrowedAmount,
  riskAppetite,
  investmentExperience,
}: AIInvestmentSuggestionsProps) => {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const generateSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/ai-suggestions/investment-analysis', {
        totalInvested,
        totalReturns,
        activeInvestments,
        completedInvestments,
        portfolioDistribution,
        monthlyReturns,
        walletBalance,
        escrowedAmount,
        riskAppetite,
        investmentExperience,
      });

      setSuggestions(response.suggestions);
      setLastUpdated(new Date());

      toast({
        title: 'AI Analysis Complete',
        description: 'Investment suggestions generated successfully',
      });
    } catch (error: any) {
      console.error('Failed to generate AI suggestions:', error);
      toast({
        variant: 'destructive',
        title: 'AI Analysis Failed',
        description: error.response?.data?.message || 'Failed to generate suggestions. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalROI = totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(2) : '0';

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                AI Investment Advisor
                <span className="text-xs font-normal px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                  Powered by Gemini
                </span>
              </CardTitle>
              <CardDescription>
                Personalized recommendations based on your portfolio analytics
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={generateSuggestions}
            disabled={isLoading}
            className="bg-gradient-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                {suggestions ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Insights
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!suggestions && !isLoading && (
          <div className="text-center py-8 space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Get AI-Powered Investment Insights</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Our AI analyzes your investment portfolio, returns, and risk profile to provide
                personalized recommendations for maximizing your returns.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-6">
              <div className="p-3 bg-background rounded-lg border">
                <p className="text-xs text-muted-foreground">Total Invested</p>
                <p className="font-semibold">₹{(totalInvested / 1000).toFixed(0)}K</p>
              </div>
              <div className="p-3 bg-background rounded-lg border">
                <p className="text-xs text-muted-foreground">Returns</p>
                <p className="font-semibold text-green-600">₹{(totalReturns / 1000).toFixed(0)}K</p>
              </div>
              <div className="p-3 bg-background rounded-lg border">
                <p className="text-xs text-muted-foreground">ROI</p>
                <p className="font-semibold text-primary">{totalROI}%</p>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-semibold">Analyzing Your Portfolio...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Our AI is reviewing your investment patterns and generating personalized insights
              </p>
            </div>
          </div>
        )}

        {suggestions && !isLoading && (
          <div className="space-y-4">
            {lastUpdated && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                <AlertCircle className="h-3 w-3" />
                <span>Last updated: {lastUpdated.toLocaleString()}</span>
              </div>
            )}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h2 className="text-xl font-bold mt-6 mb-3 text-primary" {...props} />,
                  h2: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
                  h3: ({ node, ...props }) => <h4 className="text-base font-semibold mt-3 mb-2" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-6 space-y-1" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-6 space-y-1" {...props} />,
                  li: ({ node, ...props }) => <li className="text-sm" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-3 text-sm" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-semibold text-primary" {...props} />,
                }}
              >
                {suggestions}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInvestmentSuggestions;

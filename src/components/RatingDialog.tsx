import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/api/client';
import { toTitleCase } from '@/lib/utils';

interface RatingDialogProps {
  open: boolean;
  onClose: () => void;
  onRatingSubmitted?: () => void;
  tripId: string;
  lenderId: string;
  lenderName: string;
  borrowerId: string;
  borrowerName: string;
  loanAmount: number;
  interestRate: number;
  mode?: 'lender-rates-borrower' | 'borrower-rates-lender'; // New prop to determine who is rating whom
  canDismiss?: boolean; // Whether the dialog can be dismissed without rating
}

const RatingDialog = ({
  open,
  onClose,
  onRatingSubmitted,
  tripId,
  lenderId,
  lenderName,
  borrowerId,
  borrowerName,
  loanAmount,
  interestRate,
  mode = 'borrower-rates-lender',
  canDismiss = true,
}: RatingDialogProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        variant: 'destructive',
        title: 'Rating Required',
        description: 'Please select a star rating before submitting',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post('/ratings', {
        trip_id: tripId,
        lender_id: lenderId,
        lender_name: lenderName,
        borrower_id: borrowerId,
        borrower_name: borrowerName,
        rating,
        review_text: reviewText.trim() || null,
        loan_amount: loanAmount,
        interest_rate: interestRate,
      });

      const ratedPersonName = mode === 'lender-rates-borrower' ? borrowerName : lenderName;
      toast({
        title: 'Rating Submitted',
        description: `Thank you for rating ${toTitleCase(ratedPersonName)}!`,
      });

      // Reset form
      setRating(0);
      setReviewText('');

      if (onRatingSubmitted) {
        onRatingSubmitted();
      }

      onClose();
    } catch (error: any) {
      console.error('Rating submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.response?.data?.message || 'Failed to submit rating. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && canDismiss) {
      setRating(0);
      setReviewText('');
      onClose();
    } else if (!canDismiss) {
      toast({
        variant: 'destructive',
        title: 'Rating Required',
        description: 'Please rate the borrower before continuing. This helps maintain trust in our community.',
      });
    }
  };

  const isLenderRating = mode === 'lender-rates-borrower';
  const ratedPersonName = isLenderRating ? borrowerName : lenderName;
  const ratedPersonLabel = isLenderRating ? 'Borrower' : 'Lender';

  return (
    <Dialog open={open} onOpenChange={canDismiss ? handleClose : undefined}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => !canDismiss && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isLenderRating ? 'Rate Your Borrower' : 'Rate Your Lender'}
          </DialogTitle>
          <DialogDescription>
            Share your experience with {toTitleCase(ratedPersonName)}
            {!canDismiss && (
              <span className="block mt-1 text-orange-600 font-medium">
                * Rating is required before you can continue
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Loan Details */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{ratedPersonLabel}:</span>
              <span className="font-semibold">{toTitleCase(ratedPersonName)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Loan Amount:</span>
              <span className="font-semibold">₹{(loanAmount / 1000).toFixed(2)}K</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Interest Rate:</span>
              <span className="font-semibold">{interestRate}%</span>
            </div>
          </div>

          {/* Star Rating */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Your Rating *</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="transition-transform hover:scale-110 focus:outline-none"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  disabled={isSubmitting}
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-lg font-semibold text-yellow-600">
                  {rating} {rating === 1 ? 'Star' : 'Stars'}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {rating === 0 && 'Click on a star to rate'}
              {rating === 1 && 'Poor - Not satisfied'}
              {rating === 2 && 'Fair - Below expectations'}
              {rating === 3 && 'Good - Met expectations'}
              {rating === 4 && 'Very Good - Exceeded expectations'}
              {rating === 5 && 'Excellent - Outstanding experience'}
            </p>
          </div>

          {/* Review Text */}
          <div className="space-y-3">
            <Label htmlFor="review" className="text-base font-semibold">
              Review (Optional)
            </Label>
            <Textarea
              id="review"
              placeholder={`Share details about your experience with this ${ratedPersonLabel.toLowerCase()}...`}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              maxLength={500}
              disabled={isSubmitting}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 text-right">
              {reviewText.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          {canDismiss && (
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Skip for Now
            </Button>
          )}
          {!canDismiss && (
            <p className="text-xs text-muted-foreground flex-1">
              Please submit your rating to continue
            </p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog;

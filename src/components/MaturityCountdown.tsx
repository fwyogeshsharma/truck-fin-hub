import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface MaturityCountdownProps {
  maturityDate: string; // ISO date string
  className?: string;
}

export const MaturityCountdown = ({ maturityDate, className = '' }: MaturityCountdownProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const maturity = new Date(maturityDate).getTime();
      const difference = maturity - now;

      const isNegative = difference < 0;
      const absDifference = Math.abs(difference);

      // Calculate days, hours, minutes
      const days = Math.floor(absDifference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((absDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((absDifference % (1000 * 60 * 60)) / (1000 * 60));

      setIsOverdue(isNegative);

      // Format the display
      if (days > 0) {
        return `${isNegative ? '-' : ''}${days}d ${hours}h`;
      } else if (hours > 0) {
        return `${isNegative ? '-' : ''}${hours}h ${minutes}m`;
      } else {
        return `${isNegative ? '-' : ''}${minutes}m`;
      }
    };

    // Initial calculation
    const time = calculateTimeRemaining();
    setTimeRemaining(time);

    // Update every minute
    const interval = setInterval(() => {
      const time = calculateTimeRemaining();
      setTimeRemaining(time);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [maturityDate]);

  return (
    <div
      className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-600' : 'text-blue-600'} ${className}`}
    >
      {isOverdue ? (
        <AlertCircle className="h-3.5 w-3.5" />
      ) : (
        <Clock className="h-3.5 w-3.5" />
      )}
      <span className="text-xs font-medium">
        {isOverdue ? 'Overdue: ' : 'Matures in: '}
        {timeRemaining}
      </span>
    </div>
  );
};

export default MaturityCountdown;

import { CheckCircle2, Circle, FileText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DocumentProgressProps {
  documents?: {
    ewaybill?: string;
    bilty?: string;
    advance_invoice?: string;
    advanceInvoice?: string;
    pod?: string;
    final_invoice?: string;
    finalInvoice?: string;
  };
  showSteps?: boolean;
  className?: string;
}

const DOCUMENT_STEPS = [
  { key: 'ewaybill', label: 'E-Way Bill', step: 1 },
  { key: 'bilty', label: 'Bilty', step: 2 },
  { key: 'advance_invoice', camelKey: 'advanceInvoice', label: 'Advance Invoice', step: 3 },
  { key: 'pod', label: 'POD', step: 4 },
  { key: 'final_invoice', camelKey: 'finalInvoice', label: 'Final Invoice', step: 5 },
];

export const DocumentProgress = ({ documents = {}, showSteps = false, className = '' }: DocumentProgressProps) => {
  // Helper to check if document exists (check both snake_case and camelCase)
  const hasDocument = (step: typeof DOCUMENT_STEPS[0]) => {
    const docsAny = documents as any;
    return docsAny[step.key] || (step.camelKey && docsAny[step.camelKey]);
  };

  // Calculate completion percentage (each document = 20%)
  const completedDocs = DOCUMENT_STEPS.filter(step => hasDocument(step));
  const completionPercentage = (completedDocs.length / DOCUMENT_STEPS.length) * 100;

  if (showSteps) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Document Completion
          </h4>
          <span className="text-sm font-bold text-primary">
            {completionPercentage.toFixed(0)}%
          </span>
        </div>

        <Progress value={completionPercentage} className="h-2" />

        <div className="grid grid-cols-5 gap-2 mt-3">
          {DOCUMENT_STEPS.map((step) => {
            const isComplete = hasDocument(step);
            return (
              <div
                key={step.key}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border ${
                  isComplete
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20'
                    : 'bg-muted/50 border-muted'
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-[10px] font-medium text-center leading-tight">
                  {step.step}. {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          {completedDocs.length} of {DOCUMENT_STEPS.length} documents uploaded
        </p>
      </div>
    );
  }

  // Compact view - just progress bar
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Documents</span>
        <span className="text-xs font-semibold">
          {completedDocs.length}/{DOCUMENT_STEPS.length}
        </span>
      </div>
      <Progress value={completionPercentage} className="h-1.5" />
      <span className="text-[10px] text-muted-foreground">
        {completionPercentage.toFixed(0)}% complete
      </span>
    </div>
  );
};

export default DocumentProgress;

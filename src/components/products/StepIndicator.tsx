'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, idx) => {
        const completed = idx < currentStep;
        const current = idx === currentStep;
        return (
          <div key={idx} className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                completed && 'bg-primary text-white',
                current && 'bg-primary text-white ring-2 ring-primary/20',
                !completed && !current && 'bg-muted text-muted-foreground'
              )}
            >
              {completed ? <Check className="w-4 h-4" /> : idx + 1}
            </div>
            <span className={cn('text-xs hidden sm:inline', current ? 'font-medium text-foreground' : 'text-muted-foreground')}>
              {step}
            </span>
            {idx < steps.length - 1 && <div className={cn('h-0.5 w-6 rounded-full', completed ? 'bg-primary' : 'bg-muted')} />}
          </div>
        );
      })}
    </div>
  );
}
import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number; // 1-indexed
  onStepClick?: (step: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-slate-200 dark:bg-slate-800 -z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand-600 transition-all duration-300 -z-0"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={index}
              onClick={() => onStepClick && isCompleted && onStepClick(stepNumber)}
              className={`flex flex-col items-center relative z-10 ${
                isCompleted && onStepClick ? 'cursor-pointer' : ''
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-200 ${
                  isCompleted
                    ? 'bg-brand-600 text-white shadow-sm ring-4 ring-white dark:ring-slate-900'
                    : isCurrent
                    ? 'bg-white dark:bg-slate-900 border-2 border-brand-600 text-brand-600 dark:text-brand-400 ring-4 ring-brand-50 dark:ring-brand-950'
                    : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-400 ring-4 ring-white dark:ring-slate-900'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : stepNumber}
              </div>
              <span
                className={`mt-2 text-xs font-medium text-center hidden md:block max-w-[90px] leading-tight ${
                  isCurrent
                    ? 'text-brand-600 dark:text-brand-400 font-semibold'
                    : isCompleted
                    ? 'text-slate-800 dark:text-slate-200'
                    : 'text-slate-400'
                }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

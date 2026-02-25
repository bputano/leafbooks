"use client";

import { Check } from "lucide-react";

interface Step {
  id: number;
  label: string;
}

interface StepSidebarProps {
  steps: Step[];
  currentStep: number;
  completedStep: number;
  onStepClick: (step: number) => void;
}

export function StepSidebar({
  steps,
  currentStep,
  completedStep,
  onStepClick,
}: StepSidebarProps) {
  return (
    <nav className="space-y-1">
      {steps.map((step) => {
        const isComplete = step.id < completedStep;
        const isCurrent = step.id === currentStep;
        const isAccessible = step.id <= completedStep + 1;

        return (
          <button
            key={step.id}
            onClick={() => isAccessible && onStepClick(step.id)}
            disabled={!isAccessible}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isCurrent
                ? "bg-leaf-50 text-leaf-700"
                : isComplete
                  ? "text-gray-700 hover:bg-gray-50"
                  : isAccessible
                    ? "text-gray-500 hover:bg-gray-50"
                    : "cursor-not-allowed text-gray-300"
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                isComplete
                  ? "bg-leaf-600 text-white"
                  : isCurrent
                    ? "border-2 border-leaf-600 text-leaf-600"
                    : "border-2 border-gray-300 text-gray-400"
              }`}
            >
              {isComplete ? <Check className="h-3.5 w-3.5" /> : step.id}
            </span>
            {step.label}
          </button>
        );
      })}
    </nav>
  );
}

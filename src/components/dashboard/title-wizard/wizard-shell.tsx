"use client";

import { Suspense, useEffect } from "react";
import { useTitleWizard, WIZARD_STEPS } from "@/hooks/use-title-wizard";
import { StepSidebar } from "./step-sidebar";
import { UploadFiles } from "./steps/upload-files";
import { TitleDetails } from "./steps/title-details";
import { SetupFormats } from "./steps/setup-formats";
import { Review } from "./steps/review";
import { Launch } from "./steps/launch";
import type { Book } from "@/hooks/use-title-wizard";

interface WizardShellProps {
  book: Book;
}

function WizardContent({ book }: WizardShellProps) {
  const wizard = useTitleWizard(book);

  // Step 1 is "Get Started" — auto-advance to step 2
  useEffect(() => {
    if (wizard.currentStep === 1) {
      wizard.goToStep(2);
    }
  }, [wizard.currentStep]);

  function renderStep() {
    switch (wizard.currentStep) {
      case 1:
        return null;
      case 2:
        return <UploadFiles wizard={wizard} />;
      case 3:
        return <TitleDetails wizard={wizard} />;
      case 4:
        return <SetupFormats wizard={wizard} />;
      case 5:
        return <Review wizard={wizard} />;
      case 6:
        return <Launch wizard={wizard} />;
      default:
        return <UploadFiles wizard={wizard} />;
    }
  }

  return (
    <div className="flex gap-8">
      <div className="w-56 shrink-0">
        <StepSidebar
          steps={WIZARD_STEPS}
          currentStep={wizard.currentStep}
          completedStep={wizard.bookData.wizardStep}
          onStepClick={wizard.goToStep}
        />
        {wizard.saving && (
          <p className="mt-4 text-xs text-gray-400">Saving...</p>
        )}
      </div>
      <div className="min-w-0 flex-1">{renderStep()}</div>
    </div>
  );
}

export function WizardShell({ book }: WizardShellProps) {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading wizard...</div>}>
      <WizardContent book={book} />
    </Suspense>
  );
}

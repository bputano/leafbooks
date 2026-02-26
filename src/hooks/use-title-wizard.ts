"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Book {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  slug: string;
  isbn: string | null;
  keywords: string[];
  bisacCodes: string[];
  wizardStep: number;
  manuscriptFileUrl: string | null;
  manuscriptFileType: string | null;
  coverFileUrl: string | null;
  coverImageUrl: string | null;
  launchDate: string | null;
  preOrderDate: string | null;
  isPreOrder: boolean;
  status: string;
  authorSlug: string | null;
  formats: Format[];
}

interface Format {
  id: string;
  type: "HARDCOVER" | "PAPERBACK" | "EBOOK" | "LEAF_EDITION";
  price: number;
  isActive: boolean;
  trimSize: string | null;
  paperType: string | null;
  bindingType: string | null;
  interiorColor: string | null;
  printQuality: string | null;
  coverFinish: string | null;
  pageCount: number | null;
  printingCostCents: number | null;
  shippingEstimateCents: number | null;
  isbn: string | null;
}

export type { Book, Format };

const WIZARD_STEPS = [
  { id: 1, label: "Get Started" },
  { id: 2, label: "Upload Files" },
  { id: 3, label: "Title Details" },
  { id: 4, label: "Set up Formats" },
  { id: 5, label: "Review" },
  { id: 6, label: "Launch" },
];

export { WIZARD_STEPS };

export function useTitleWizard(book: Book) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const [currentStep, setCurrentStep] = useState(
    stepParam ? parseInt(stepParam) : book.wizardStep
  );
  const [bookData, setBookData] = useState<Book>(book);
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<Partial<Book> | null>(null);

  // Save book data with debounce
  const saveBook = useCallback(
    async (data: Partial<Book>) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/books/${bookData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const { book: updated } = await res.json();
          setBookData(updated);
        }
      } finally {
        setSaving(false);
      }
    },
    [bookData.id]
  );

  const debouncedSave = useCallback(
    (data: Partial<Book>) => {
      pendingSaveRef.current = { ...pendingSaveRef.current, ...data };
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (pendingSaveRef.current) {
          saveBook(pendingSaveRef.current);
          pendingSaveRef.current = null;
        }
      }, 1000);
    },
    [saveBook]
  );

  // Update a field and trigger debounced save
  const updateField = useCallback(
    (field: string, value: unknown) => {
      setBookData((prev) => ({ ...prev, [field]: value }));
      debouncedSave({ [field]: value });
    },
    [debouncedSave]
  );

  const goToStep = useCallback(
    (step: number) => {
      setCurrentStep(step);
      // Update wizard step in DB if advancing
      if (step > bookData.wizardStep) {
        saveBook({ wizardStep: step });
      }
      router.push(`?step=${step}`, { scroll: false });
    },
    [bookData.wizardStep, saveBook, router]
  );

  const nextStep = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (pendingSaveRef.current) {
        // Fire and forget — component is unmounting
        saveBook(pendingSaveRef.current);
        pendingSaveRef.current = null;
      }
    };
  }, [saveBook]);

  return {
    currentStep,
    bookData,
    saving,
    steps: WIZARD_STEPS,
    goToStep,
    nextStep,
    prevStep,
    updateField,
    saveBook,
    setBookData,
  };
}

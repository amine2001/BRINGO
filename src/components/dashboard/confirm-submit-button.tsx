"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type ConfirmSubmitButtonProps = {
  children: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  className: string;
  confirmClassName?: string;
  disabled?: boolean;
};

export function ConfirmSubmitButton({
  children,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  className,
  confirmClassName,
  disabled = false,
}: ConfirmSubmitButtonProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleConfirm() {
    const form = triggerRef.current?.form;
    setOpen(false);
    form?.requestSubmit();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={className}
      >
        {children}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-md"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-white/18 bg-white/10 p-6 text-white shadow-[0_35px_120px_rgba(15,23,42,0.6)] backdrop-blur-2xl"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))]" />

            <div className="relative space-y-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-amber-200 shadow-[0_0_30px_rgba(251,191,36,0.15)]">
                <FontAwesomeIcon icon={faTriangleExclamation} />
              </div>

              <div className="space-y-2">
                <h2 id={titleId} className="text-xl font-semibold tracking-tight text-white">
                  {title}
                </h2>
                <p id={descriptionId} className="text-sm leading-6 text-slate-200/85">
                  {description}
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={
                    confirmClassName ??
                    "rounded-full border border-rose-300/25 bg-rose-400/18 px-4 py-2.5 text-sm font-medium text-rose-50 transition hover:bg-rose-400/24"
                  }
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

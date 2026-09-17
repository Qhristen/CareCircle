import type { ReactNode } from "react";

export function FormSection({
  letter,
  title,
  description,
  symbol,
  id,
  children,
}: {
  letter: string;
  title: string;
  description: string;
  symbol: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <section
      className="scroll-mt-28 space-y-6 rounded-2xl bg-white p-5 shadow-soft sm:p-8"
      id={id}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-container text-sm font-extrabold text-primary">
            {letter}
          </span>
          <div>
            <h2 className="text-lg font-bold leading-7 text-on-surface">{title}</h2>
            <p className="mt-0.5 text-sm leading-6 text-on-surface-variant">
              {description}
            </p>
          </div>
        </div>
        <span aria-hidden="true" className="text-2xl">
          {symbol}
        </span>
      </div>
      {children}
    </section>
  );
}

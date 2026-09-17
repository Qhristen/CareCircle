import { Icon } from "@/components/ui/icon";
import { wizardSteps } from "@/lib/create-circle-data";

export function WizardStepper({
  currentStep,
  onStepChange,
}: {
  currentStep: number;
  onStepChange: (step: number) => void;
}) {
  return (
    <section aria-label="Circle creation progress" className="mb-8 rounded-2xl bg-white p-6 shadow-soft">
      <ol className="grid grid-cols-2 gap-5 md:grid-cols-5">
        {wizardSteps.map((step, index) => {
          const number = index + 1;
          const complete = number < currentStep;
          const current = number === currentStep;

          return (
            <li key={step}>
              <button
                aria-current={current ? "step" : undefined}
                className="group flex w-full items-center gap-2.5 rounded-xl text-left focus-visible:outline-offset-4"
                onClick={() => onStepChange(number)}
                type="button"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-extrabold transition group-hover:scale-105 ${
                  complete
                    ? "bg-secondary text-white shadow-sm"
                    : current
                      ? "bg-primary text-white shadow-md ring-4 ring-primary-fixed"
                      : "bg-surface-container-highest text-on-surface-variant"
                  }`}
                >
                  {complete ? <Icon name="check" size={20} /> : number}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-[11px] font-extrabold uppercase tracking-wider ${
                    complete
                      ? "text-secondary"
                      : current
                        ? "text-primary"
                        : "text-on-surface-variant"
                    }`}
                  >
                    Step {number}
                    {complete ? " • Completed" : current ? " • Current" : ""}
                  </span>
                  <span className="block truncate text-[13px] font-bold text-on-surface">
                    {step}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-container">
        <div
          className="h-full rounded-full bg-gradient-to-r from-secondary via-primary to-primary-container transition-[width] duration-300"
          style={{ width: `${currentStep * 20}%` }}
        />
      </div>
    </section>
  );
}

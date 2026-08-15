"use client";

type CustomerTrainingActionsProps = {
  dogName: string;
  primaryGoal: string;
  hasDog: boolean;
  hasCurrentPlan: boolean;
  hasClientAccess: boolean;
  homeworkAvailable: boolean;
  onStartTraining: () => void;
  onCheckProgress: () => void;
  onAskAi: () => void;
  onViewHomework: () => void;
};

const ActionIcon = ({ type }: { type: "start" | "progress" | "coach" | "homework" }) => {
  const paths = {
    start: <path d="m6 3 6 5-6 5V3Z" />,
    progress: <path d="M3 12.5V9m3.3 3.5V6m3.4 6.5V3.5M13 12.5V8" />,
    coach: <path d="M3 3.5h10v7H7l-3.3 2.4.5-2.4H3v-7Z" />,
    homework: <path d="M4 2.8h5l3 3v7.4H4V2.8Zm2 5.1h4M6 10.4h3" />,
  };

  return (
    <svg viewBox="0 0 16 16" className="h-5 w-5 fill-none stroke-current stroke-[1.6]" aria-hidden="true">
      {paths[type]}
    </svg>
  );
};

export default function CustomerTrainingActions({
  dogName,
  primaryGoal,
  hasDog,
  hasCurrentPlan,
  hasClientAccess,
  homeworkAvailable,
  onStartTraining,
  onCheckProgress,
  onAskAi,
  onViewHomework,
}: CustomerTrainingActionsProps) {
  const actions = [
    {
      label: hasCurrentPlan ? "Open Today’s Session" : "Start Training",
      description: hasCurrentPlan
        ? "Open the structured session already prepared for your dog."
        : "Generate a focused 10-20 minute training session.",
      icon: "start" as const,
      onClick: onStartTraining,
      primary: true,
    },
    {
      label: "Check Progress",
      description: "Review sessions, milestones, and your dog’s current phase.",
      icon: "progress" as const,
      onClick: onCheckProgress,
    },
    {
      label: "Ask AI",
      description: "Get support when a step needs troubleshooting.",
      icon: "coach" as const,
      onClick: onAskAi,
    },
    ...(hasClientAccess
      ? [
          {
            label: "View Homework",
            description: homeworkAvailable
              ? "Review your trainer-approved homework before you begin."
              : "See the latest approved guidance from your trainer.",
            icon: "homework" as const,
            onClick: onViewHomework,
          },
        ]
      : []),
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 pb-2 sm:px-6 sm:pb-3" aria-label="Training actions">
      <div className="rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-400/10 via-neutral-950 to-black p-4 shadow-[0_16px_40px_rgba(0,0,0,0.2)] sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Training control panel</p>
            <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
              {hasDog ? `What do you want to work on with ${dogName} today?` : "Choose your next training action"}
            </h2>
          </div>
          {hasDog && primaryGoal && (
            <p className="text-sm text-neutral-300">Current focus: <span className="font-semibold text-amber-200">{primaryGoal}</span></p>
          )}
        </div>
        <div className={`mt-4 grid gap-3 ${hasClientAccess ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-3"}`}>
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={`min-h-32 rounded-lg border p-4 text-left transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-neutral-950 ${
                action.primary
                  ? "border-amber-400 bg-amber-400 text-black shadow-[0_10px_24px_rgba(251,191,36,0.16)] hover:bg-amber-300"
                  : "border-neutral-700 bg-black/35 text-white hover:border-amber-500/50 hover:bg-neutral-900"
              }`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-md ${action.primary ? "bg-black/10" : "bg-amber-400/10 text-amber-200"}`}>
                <ActionIcon type={action.icon} />
              </span>
              <span className="mt-3 block text-sm font-bold uppercase tracking-[0.08em]">{action.label}</span>
              <span className={`mt-1 block text-sm leading-5 ${action.primary ? "text-black/75" : "text-neutral-400"}`}>{action.description}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

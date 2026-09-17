import { Icon } from "@/components/ui/icon";
import type { WishlistItem } from "@/lib/create-circle-data";

function naira(value: number) {
  return `₦${new Intl.NumberFormat("en-NG").format(value)}`;
}

const allocationColors = [
  "#a63412",
  "#306855",
  "#825100",
  "#2563eb",
  "#9333ea",
  "#db2777",
];

export function GoalSummary({
  items,
  recipientName,
  title,
  flexBuffer,
  onFlexBufferChange,
}: {
  items: WishlistItem[];
  recipientName: string;
  title: string;
  flexBuffer: boolean;
  onFlexBufferChange: (checked: boolean) => void;
}) {
  const subtotal = items.reduce((total, item) => total + item.price, 0);
  const buffer = flexBuffer ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal + buffer;
  const allocations = [
    ...items
      .filter((item) => item.price > 0)
      .map((item, index) => ({
        id: String(item.id),
        label: item.name.trim() || "Untitled item",
        value: item.price,
        color: allocationColors[index % allocationColors.length],
      })),
    ...(buffer > 0
      ? [{
          id: "flex-buffer",
          label: "Logistics / Flex Cash",
          value: buffer,
          color: "#6b7280",
        }]
      : []),
  ];
  let allocationCursor = 0;
  const allocationGradient = allocations.length > 0 && total > 0
    ? `conic-gradient(${allocations.map((allocation) => {
        const start = allocationCursor;
        allocationCursor += (allocation.value / total) * 100;
        return `${allocation.color} ${start}% ${allocationCursor}%`;
      }).join(", ")})`
    : "#e4e2de";
  const initials = recipientName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "GC";

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-4">
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">
            Dynamic Goal Breakdown
          </span>
          <span className="rounded-full bg-secondary-fixed px-2.5 py-1 text-[11px] font-extrabold text-on-secondary-fixed">
            Auto-Sync
          </span>
        </div>

        <div className="rounded-xl bg-surface-container-low p-4">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
            Total Target Funding
          </span>
          <div className="mt-1 text-[32px] font-extrabold tracking-tight text-primary">
            {naira(total)}
          </div>
          <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-secondary">
            <span aria-hidden="true">🏦</span>
            Includes {items.length} curated wishlist item{items.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="space-y-1 text-sm">
          {items.map((item) => (
            <div className="flex justify-between gap-3 py-1 text-on-surface-variant" key={item.id}>
              <span className="truncate">{item.name}</span>
              <span className="shrink-0 font-bold text-on-surface">{naira(item.price)}</span>
            </div>
          ))}
          {items.length === 0 && (
            <p className="py-2 text-on-surface-variant">No wishlist items added yet.</p>
          )}
          {flexBuffer && (
            <div className="flex justify-between gap-3 py-1 text-on-surface-variant">
              <span>Logistics / Flex Cash</span>
              <span className="font-bold text-on-surface">{naira(buffer)}</span>
            </div>
          )}
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-surface-container p-2.5 text-sm font-bold text-on-surface">
          <span>Add 5% Logistics / Flex Cash</span>
          <input
            checked={flexBuffer}
            className="h-4 w-4 accent-primary"
            onChange={(event) => onFlexBufferChange(event.target.checked)}
            type="checkbox"
          />
        </label>

        <div className="flex items-center gap-4 rounded-xl bg-surface-container-low p-4">
          <div
            aria-label="Wishlist allocation visualization"
            className="h-16 w-16 shrink-0 rounded-full p-2"
            style={{ background: allocationGradient }}
          >
            <div className="h-full w-full rounded-full bg-surface-container-low" />
          </div>
          <div className="space-y-1 text-sm text-on-surface-variant">
            {allocations.map((allocation) => (
              <div className="flex items-center gap-2" key={allocation.id}>
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: allocation.color }}
                />
                <span className="min-w-0 truncate">
                  {allocation.label} ({Math.round((allocation.value / total) * 100)}%)
                </span>
              </div>
            ))}
            {allocations.length === 0 && (
              <p>Add an item and target amount to see the allocation.</p>
            )}
          </div>
        </div>

        {/* <div className="flex items-start gap-2 rounded-lg bg-secondary-fixed p-3 text-sm leading-6 text-on-secondary-fixed">
          <Icon className="mt-0.5 shrink-0 text-secondary" name="shield" size={17} />
          <span>
            <strong>Fidelity Escrow:</strong> Funds are locked in micro-clearing
            vaults and disbursed strictly for merchant items. Zero hidden cuts.
          </span>
        </div> */}
      </div>

      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-on-surface">Contributor Preview</span>
          <Icon className="text-outline" name="eye" size={18} />
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-surface-container-low p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-fixed text-xs font-extrabold text-on-primary-fixed">
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-on-surface">
              {title || `${recipientName || "Your recipient"}'s GiftCircle`}
            </span>
            <span className="block truncate text-sm text-on-surface-variant">
              Organized by You • {items.length} Items
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}

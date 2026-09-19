"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import type { WishlistItem } from "@/lib/create-circle-data";

const accentStyles = {
  primary: "bg-primary-fixed text-on-primary-fixed",
  secondary: "bg-secondary-fixed text-on-secondary-fixed",
  tertiary: "bg-tertiary-fixed text-on-tertiary-fixed",
};

function naira(value: number) {
  return `₦${new Intl.NumberFormat("en-NG").format(value)}`;
}

export function WishlistBuilder({
  mode,
  items,
  cashGoal,
  onModeChange,
  onCashGoalChange,
  onAdd,
  onDelete,
  onUpdate,
}: {
  mode: "cash" | "itemized";
  items: WishlistItem[];
  cashGoal: number;
  onModeChange: (mode: "cash" | "itemized") => void;
  onCashGoalChange: (value: number) => void;
  onAdd: () => number;
  onDelete: (id: number) => void;
  onUpdate: (id: number, updates: Pick<WishlistItem, "name" | "price">) => void;
}) {
  const [editing, setEditing] = useState<{
    id: number;
    name: string;
    price: number;
  } | null>(null);

  function saveEdit() {
    if (!editing || !editing.name.trim() || editing.price < 1000) return;
    onUpdate(editing.id, {
      name: editing.name.trim(),
      price: editing.price,
    });
    setEditing(null);
  }

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-container text-sm font-extrabold text-primary">
            C
          </span>
          <div>
            <h2 className="text-lg font-bold text-on-surface">Target & Wishlist Bundle Builder</h2>
            <p className="mt-0.5 text-sm leading-6 text-on-surface-variant">
              Donors can sponsor single items or chip in small amounts.
            </p>
          </div>
        </div>
        <div className="flex self-start rounded-full bg-surface-container-high p-2">
          {[
            ["cash", "Cash Pool Only"],
            ["itemized", "Itemized Bundle + Flex"],
          ].map(([value, label]) => (
            <button
              className={`whitespace-nowrap rounded-full px-3 py-4 text-xs transition ${
                mode === value
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              key={value}
              onClick={() => onModeChange(value as "cash" | "itemized")}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === "cash" ? (
        <div className="rounded-xl bg-surface-container-low p-5">
          <label className="mb-2 block text-[13px] font-bold text-on-surface" htmlFor="cash-goal">
            Flexible Cash Goal
          </label>
          <div className="relative max-w-sm">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-extrabold text-primary">₦</span>
            <input
              className="w-full rounded-lg bg-white py-3 pl-10 pr-4 text-lg font-bold text-on-surface outline-none ring-primary/20 focus:ring-4"
              id="cash-goal"
              min={1000}
              onChange={(event) => onCashGoalChange(Number(event.target.value))}
              type="number"
              value={cashGoal}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                className="flex flex-col items-start justify-between gap-4 rounded-xl bg-surface-container-low p-4 transition hover:bg-surface-container sm:flex-row sm:items-center"
                key={item.id}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-surface-container-highest text-2xl">
                    {item.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    {editing?.id === item.id ? (
                      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_130px]">
                        <label>
                          <span className="sr-only">Item name</span>
                          <input
                            autoFocus
                            className="w-full rounded-lg bg-white px-3 py-2 text-sm font-bold text-on-surface outline-none ring-primary/20 focus:ring-4"
                            onChange={(event) =>
                              setEditing({ ...editing, name: event.target.value })
                            }
                            value={editing.name}
                          />
                        </label>
                        <label className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-primary">₦</span>
                          <span className="sr-only">Item price</span>
                          <input
                            className="w-full rounded-lg bg-white py-2 pl-7 pr-3 text-sm font-bold text-on-surface outline-none ring-primary/20 focus:ring-4"
                            min={1000}
                            onChange={(event) =>
                              setEditing({
                                ...editing,
                                price: Number(event.target.value),
                              })
                            }
                            type="number"
                            value={editing.price}
                          />
                        </label>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-on-surface">{item.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${accentStyles[item.accent]}`}>
                            {item.category}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm leading-5 text-on-surface-variant">{item.description}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-primary">{naira(item.price)}</span>
                    <div className="text-[11px] text-outline">{item.priceNote}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {editing?.id === item.id ? (
                      <>
                        <button
                          aria-label={`Save changes to ${item.name}`}
                          className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-white transition hover:bg-[#285b49]"
                          onClick={saveEdit}
                          type="button"
                        >
                          <Icon name="check" size={15} />
                        </button>
                        <button
                          aria-label="Cancel editing"
                          className="grid h-8 w-8 place-items-center rounded-full text-on-surface-variant transition hover:bg-white"
                          onClick={() => setEditing(null)}
                          type="button"
                        >
                          <Icon name="close" size={15} />
                        </button>
                      </>
                    ) : (
                      <button
                        aria-label={`Edit ${item.name}`}
                        className="grid h-8 w-8 place-items-center rounded-full text-on-surface-variant transition hover:bg-white"
                        onClick={() =>
                          setEditing({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                          })
                        }
                        type="button"
                      >
                        <Icon name="edit" size={15} />
                      </button>
                    )}
                    <button
                      aria-label={`Remove ${item.name}`}
                      className="grid h-8 w-8 place-items-center rounded-full text-red-700 transition hover:bg-red-100"
                      onClick={() => {
                        onDelete(item.id);
                        if (editing?.id === item.id) setEditing(null);
                      }}
                      type="button"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container px-4 py-3 text-sm font-bold text-primary transition hover:bg-surface-container-high"
            onClick={() => {
              const id = onAdd();
              setEditing({ id, name: "", price: 0 });
            }}
            type="button"
          >
            <Icon name="plus" size={19} />
            Add Another Item or Custom Wish
          </button>
        </>
      )}
    </>
  );
}

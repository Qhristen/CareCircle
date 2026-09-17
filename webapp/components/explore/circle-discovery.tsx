"use client";

import { useDeferredValue, useState } from "react";
import { CircleCard } from "@/components/explore/circle-card";
import { Icon } from "@/components/ui/icon";
import {
  categories,
  type CircleCategory,
} from "@/lib/explore-data";
import { getApiErrorMessage } from "@/lib/api-error";
import { presentOccasion } from "@/lib/circle-presenters";
import { useGetCirclesQuery } from "@/lib/store/api/circleApi";

type SortOption = "active" | "ending" | "recent";

export function CircleDiscovery({ initialQuery = "" }: { initialQuery?: string }) {
  const [category, setCategory] = useState<"all" | CircleCategory>("all");
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<SortOption>("active");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [almostFunded, setAlmostFunded] = useState(false);
  const [limit, setLimit] = useState(12);
  const deferredQuery = useDeferredValue(query.trim());
  const { data, error, isFetching, isLoading, refetch } = useGetCirclesQuery({
    q: deferredQuery || undefined,
    sort,
    minFundedPercent: almostFunded ? 80 : undefined,
    limit: category === "all" ? limit : 100,
  });
  console.log("CircleDiscovery data:", data);


  return (
    <section
      aria-labelledby="active-circles-heading"
      className="mx-auto w-full max-w-[1240px] scroll-mt-24 px-4 pt-10 sm:px-6"
      id="active-circles"
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary">
            Find your community
          </p>
          <h2
            className="text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl"
            id="active-circles-heading"
          >
            Active circles
          </h2>
        </div>
        <span aria-live="polite" className="text-xs text-on-surface-variant">
          {isFetching ? "Updating…" : `${data?.data.length} result${data?.data.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {/* <div className="hide-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        {categories.map((item) => {
          const active = category === item.value;
          return (
            <button
              aria-pressed={active}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition ${
                active
                  ? "bg-primary text-white"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
              key={item.value}
              onClick={() => setCategory(item.value)}
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </div> */}

      <div className="relative mt-4 rounded-2xl bg-white p-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="relative w-full md:max-w-sm">
            <label className="sr-only" htmlFor="circle-search">
              Search circles
            </label>
            <Icon
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline"
              name="search"
              size={18}
            />
            <input
              className="w-full rounded-full bg-surface-container-low py-2.5 pl-10 pr-4 text-xs text-on-surface outline-none ring-primary/20 placeholder:text-outline focus:bg-white focus:ring-4"
              id="circle-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, recipient, or city..."
              type="search"
              value={query}
            />
          </div>

          <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto">
            <label className="inline-flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                Sort
              </span>
              <select
                className="cursor-pointer rounded-full bg-surface-container-low px-4 py-2 text-xs font-bold text-on-surface outline-none"
                onChange={(event) => setSort(event.target.value as SortOption)}
                value={sort}
              >
                <option value="active">Most Active</option>
                <option value="ending">Ending Soon</option>
                <option value="recent">Recently Created</option>
              </select>
            </label>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-2 text-[11px] font-bold text-on-surface-variant">
              <Icon className="text-secondary" name="lock-open" size={14} />
              Public Circles
            </span>
            <button
              aria-expanded={filtersOpen}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold text-on-surface-variant transition hover:bg-surface-container-low hover:text-primary"
              onClick={() => setFiltersOpen((open) => !open)}
              type="button"
            >
              <Icon name="tune" size={15} />
              Filters
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-on-surface/[0.08] pt-4">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-on-surface-variant">
              <input
                checked={almostFunded}
                className="h-4 w-4 accent-primary"
                onChange={(event) => setAlmostFunded(event.target.checked)}
                type="checkbox"
              />
              Show circles at least 80% funded
            </label>
            {(category !== "all" || query || almostFunded) && (
              <button
                className="text-xs font-bold text-primary hover:underline"
                onClick={() => {
                  setCategory("all");
                  setQuery("");
                  setAlmostFunded(false);
                }}
                type="button"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading circles">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="h-[520px] animate-pulse rounded-2xl bg-surface-container" key={index} />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl bg-red-50 px-6 py-14 text-center">
          <h3 className="text-lg font-bold text-red-800">We couldn&apos;t load circles</h3>
          <p className="mt-1 text-sm text-red-700">{getApiErrorMessage(error, "Check that the GiftCircle API is running, then try again.")}</p>
          <button className="mt-5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white" onClick={refetch} type="button">Try again</button>
        </div>
      ) : data && data?.data.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((circle) => (
            <CircleCard circle={circle} key={circle.id} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-surface-container-low px-6 py-16 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-white text-primary">
            <Icon name="search" size={21} />
          </div>
          <h3 className="text-lg font-bold text-on-surface">No circles found</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Try another search or clear your filters.
          </p>
          <button
            className="mt-5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white"
            onClick={() => {
              setCategory("all");
              setQuery("");
              setAlmostFunded(false);
            }}
            type="button"
          >
            Reset discovery
          </button>
        </div>
      )}

      {data && data.data.length > 0 && data?.meta.hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-surface-container px-7 py-3 text-[13px] font-bold text-on-surface transition hover:bg-surface-container-high"
            disabled={isFetching}
            onClick={() => setLimit((current) => Math.min(current + 12, 100))}
            type="button"
          >
            {isFetching ? "Loading…" : "Load More Circles"}
            <Icon name="chevron-down" size={15} />
          </button>
        </div>
      )}
    </section>
  );
}

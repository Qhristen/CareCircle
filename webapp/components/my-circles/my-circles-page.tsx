"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/icon";
import { getApiErrorMessage } from "@/lib/api-error";
import { daysUntil, presentOccasion } from "@/lib/circle-presenters";
import { useGetMyCirclesQuery } from "@/lib/store/api/circleApi";
import { useAppSelector } from "@/lib/store/hooks";
import type { CircleOccasion, CircleStatus, MyCircle } from "@/types";

const occasionOptions: CircleOccasion[] = ["BIRTHDAY", "WEDDING", "NEW_BABY", "GRADUATION", "BEREAVEMENT", "RECOVERY", "HOUSEWARMING", "COMMUNITY_SUPPORT", "EMERGENCY_ASSISTANCE", "OTHER"];

const statusOptions: CircleStatus[] = ["DRAFT", "ACTIVE", "FUNDED", "FULFILLING", "COMPLETED", "CANCELLED", "EXPIRED"];

const statusStyles: Record<string, string> = {
  DRAFT: "bg-surface-container-high text-on-surface-variant",
  ACTIVE: "bg-secondary-fixed text-secondary",
  FUNDED: "bg-primary-fixed text-primary",
  FULFILLING: "bg-tertiary-fixed text-tertiary",
  COMPLETED: "bg-secondary text-white",
  CANCELLED: "bg-red-100 text-red-700",
  EXPIRED: "bg-surface-container-highest text-on-surface-variant",
};

function formatCurrency(value: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency || "NGN"} ${new Intl.NumberFormat(locale).format(value)}`;
  }
}

function MyCircleCard({ circle }: { circle: MyCircle }) {
  const { i18n, t } = useTranslation();
  const normalizedOccasion = circle.occasion.toLowerCase().replaceAll("_", "-");
  const presentation = presentOccasion(normalizedOccasion);
  const progress = Math.min(Math.max(Number(circle.progress) || 0, 0), 100);
  const daysLeft = daysUntil(circle.deadline);
  const status = circle.status.toUpperCase();
  const location = [circle.recipientCity, circle.recipientCountryCode]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="group flex min-h-full flex-col overflow-hidden rounded-2xl bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card">
      <div className="relative h-48 overflow-hidden bg-surface-container">
        <Image
          alt={circle.coverAlt || t("myCircles.coverAlt", { title: circle.title })}
          className="object-cover transition duration-500 group-hover:scale-105"
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
          src={circle.coverImageUrl || "/onbording_image.png"}
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#211b18]/85 via-transparent to-black/15" />
        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-on-surface shadow-sm backdrop-blur-sm">
            <span aria-hidden="true">{presentation.emoji}</span>
            {t(`myCircles.occasionNames.${normalizedOccasion}`, { defaultValue: presentation.label })}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${statusStyles[status] || statusStyles.DRAFT}`}>
            {t(`myCircles.statuses.${status.toLowerCase()}`)}
          </span>
        </div>
        <div className="absolute inset-x-4 bottom-4">
          <h2 className="line-clamp-2 text-xl font-extrabold tracking-tight text-white">
            {circle.title}
          </h2>
          <p className="mt-1 truncate text-xs font-semibold text-primary-fixed">
            {t("myCircles.forRecipient", { name: circle.recipientName })}{location ? ` • ${location}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-5 p-5">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xl font-extrabold tracking-tight text-on-surface">
              {formatCurrency(circle.amountRaised, circle.currency, i18n.resolvedLanguage || "en")}
            </p>
            <span className="shrink-0 text-xs font-extrabold text-primary">
              {t("myCircles.funded", { percent: Math.round(progress) })}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            {t("myCircles.goal", { amount: formatCurrency(circle.targetAmount, circle.currency, i18n.resolvedLanguage || "en") })}
          </p>
          <div
            aria-label={`${Math.round(progress)}% funded`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.round(progress)}
            className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container-highest"
            role="progressbar"
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between gap-3 text-xs text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="users" size={14} />
              {t("myCircles.supporterCount", { count: circle.supporterCount || 0 })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name={daysLeft === null ? "check" : "calendar"} size={14} />
              {daysLeft === null ? t("myCircles.closed") : t("common.dayLeft", { count: daysLeft })}
            </span>
          </div>
          <Link
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-primary-container active:scale-[0.98]"
            href={`/organizer/circles/${circle.id}`}
          >
            {t("myCircles.openDashboard")} <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function MyCirclesPage() {
  const { t } = useTranslation();
  const { authChecked, isAuthenticated } = useAppSelector((state) => state.auth);
  const [query, setQuery] = useState("");
  const [occasion, setOccasion] = useState<CircleOccasion | "">("");
  const [status, setStatus] = useState<CircleStatus | "">("");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query.trim());
  const shouldFetch = authChecked && isAuthenticated;
  const { data, error, isFetching, isLoading, refetch } = useGetMyCirclesQuery(
    {
      page,
      limit: 9,
      search: deferredQuery || undefined,
      occasion: occasion || undefined,
      status: status || undefined,
    },
    { skip: !shouldFetch },
  );

  if (!authChecked) {
    return (
      <main className="grid min-h-[65vh] place-items-center bg-surface px-4">
        <div className="text-center">
          <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-primary-fixed border-t-primary" />
          <p className="mt-4 text-sm font-semibold text-on-surface-variant">{t("myCircles.checking")}</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="grid min-h-[65vh] place-items-center bg-surface px-4 py-16">
        <section className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-card">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-fixed text-primary">
            <Icon name="lock" size={25} />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-on-surface">{t("myCircles.signInTitle")}</h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            {t("myCircles.signInBody")}
          </p>
          <Link className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-white hover:bg-primary-container" href="/sign-in?next=/my-circles">
            {t("myCircles.signInContinue")} <Icon name="arrow-right" size={17} />
          </Link>
          <p className="mt-4 text-xs text-on-surface-variant">
            {t("myCircles.new")} <Link className="font-bold text-primary hover:underline" href="/sign-up">{t("myCircles.createAccount")}</Link>
          </p>
        </section>
      </main>
    );
  }

  const hasFilters = Boolean(query || occasion || status);
  const totalPages = data?.meta.totalPages || 1;

  function resetFilters() {
    setQuery("");
    setOccasion("");
    setStatus("");
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-surface px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary">{t("myCircles.workspace")}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">{t("myCircles.title")}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
              {t("myCircles.description")}
            </p>
          </div>
          <Link className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-primary-container" href="/create-circle">
            <Icon name="plus" size={17} /> {t("myCircles.start")}
          </Link>
        </div>

        <section aria-label={t("myCircles.filtersLabel")} className="mt-8 rounded-2xl bg-white p-4 shadow-soft">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_180px]">
            <div className="relative">
              <label className="sr-only" htmlFor="my-circle-search">{t("myCircles.searchLabel")}</label>
              <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline" name="search" size={17} />
              <input
                className="w-full rounded-full bg-surface-container-low py-3 pl-10 pr-4 text-sm text-on-surface outline-none ring-primary/20 placeholder:text-outline focus:bg-white focus:ring-4"
                id="my-circle-search"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder={t("myCircles.searchPlaceholder")}
                type="search"
                value={query}
              />
            </div>
            <label>
              <span className="sr-only">{t("myCircles.occasionFilter")}</span>
              <select
                className="w-full cursor-pointer rounded-full bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface outline-none ring-primary/20 focus:bg-white focus:ring-4"
                onChange={(event) => {
                  setOccasion(event.target.value as CircleOccasion | "");
                  setPage(1);
                }}
                value={occasion}
              >
                <option value="">{t("myCircles.allOccasions")}</option>
                {occasionOptions.map((option) => <option key={option} value={option}>{t(`myCircles.occasionNames.${option.toLowerCase().replaceAll("_", "-")}`)}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">{t("myCircles.statusFilter")}</span>
              <select
                className="w-full cursor-pointer rounded-full bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface outline-none ring-primary/20 focus:bg-white focus:ring-4"
                onChange={(event) => {
                  setStatus(event.target.value as CircleStatus | "");
                  setPage(1);
                }}
                value={status}
              >
                <option value="">{t("myCircles.allStatuses")}</option>
                {statusOptions.map((option) => <option key={option} value={option}>{t(`myCircles.statuses.${option.toLowerCase()}`)}</option>)}
              </select>
            </label>
          </div>
        </section>

        <div className="mt-6 flex items-center justify-between gap-4">
          <p aria-live="polite" className="text-xs font-semibold text-on-surface-variant">
            {isFetching ? t("common.updating") : data ? t("myCircles.circleCount", { count: data.meta.total }) : t("myCircles.yourCircles")}
          </p>
          {hasFilters && <button className="text-xs font-extrabold text-primary hover:underline" onClick={resetFilters} type="button">{t("myCircles.clearFilters")}</button>}
        </div>

        {isLoading ? (
          <div aria-label={t("myCircles.loading")} className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => <div className="h-[440px] animate-pulse rounded-2xl bg-surface-container" key={index} />)}
          </div>
        ) : error ? (
          <section className="mt-4 rounded-2xl bg-red-50 px-6 py-14 text-center">
            <h2 className="text-lg font-extrabold text-red-800">{t("myCircles.loadError")}</h2>
            <p className="mt-2 text-sm text-red-700">{getApiErrorMessage(error, t("myCircles.loadErrorBody"))}</p>
            <button className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-white" onClick={refetch} type="button">{t("common.tryAgain")}</button>
          </section>
        ) : data && data.data.length > 0 ? (
          <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.data.map((circle) => <MyCircleCard circle={circle} key={circle.id} />)}
          </div>
        ) : (
          <section className="mt-4 rounded-2xl bg-surface-container-low px-6 py-16 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-primary shadow-sm"><Icon name={hasFilters ? "search" : "heart"} size={23} /></span>
            <h2 className="mt-5 text-xl font-extrabold text-on-surface">{hasFilters ? t("myCircles.noMatches") : t("myCircles.firstCircle")}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
              {hasFilters ? t("myCircles.noMatchesBody") : t("myCircles.firstCircleBody")}
            </p>
            {hasFilters ? (
              <button className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-white" onClick={resetFilters} type="button">{t("myCircles.clearFilters")}</button>
            ) : (
              <Link className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-white" href="/create-circle"><Icon name="plus" size={16} /> {t("myCircles.start")}</Link>
            )}
          </section>
        )}

        {data && data.data.length > 0 && totalPages > 1 && (
          <nav aria-label={t("myCircles.pages")} className="mt-8 flex items-center justify-center gap-3">
            <button
              className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-on-surface shadow-sm transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              {t("myCircles.previous")}
            </button>
            <span className="text-xs font-bold text-on-surface-variant">{t("myCircles.page", { page: data.meta.page, total: totalPages })}</span>
            <button
              className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-on-surface shadow-sm transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              type="button"
            >
              {t("myCircles.next")}
            </button>
          </nav>
        )}
      </div>
    </main>
  );
}

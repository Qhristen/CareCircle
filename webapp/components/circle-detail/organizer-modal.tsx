"use client";

import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/icon";

export function OrganizerModal({
  circleTitle,
  organizerName,
  open,
  message,
  replyEmail,
  sending,
  onMessageChange,
  onReplyEmailChange,
  onClose,
  onSend,
}: {
  circleTitle: string;
  organizerName: string;
  open: boolean;
  message: string;
  replyEmail: string;
  sending: boolean;
  onMessageChange: (message: string) => void;
  onReplyEmailChange: (email: string) => void;
  onClose: () => void;
  onSend: () => Promise<void>;
}) {
  const { t } = useTranslation();
  if (!open) return null;

  const organizerInitials = organizerName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div aria-labelledby="organizer-modal-title" aria-modal="true" className="fixed inset-0 z-[70] grid place-items-center bg-[#1b1c1a]/60 p-4 backdrop-blur-sm" role="dialog">
      <div className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-container pb-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-fixed text-xs font-extrabold text-primary">{organizerInitials}</span>
            <div>
              <h2 className="text-base font-bold text-on-surface" id="organizer-modal-title">{t("circle.modal.title", { name: organizerName })}</h2>
              <p className="text-xs text-on-surface-variant">{t("circle.modal.subtitle", { title: circleTitle })}</p>
            </div>
          </div>
          <button aria-label={t("circle.modal.close")} className="grid h-8 w-8 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container" onClick={onClose} type="button">
            <Icon name="close" size={17} />
          </button>
        </div>
        <p className="text-sm leading-6 text-on-surface-variant">{t("circle.modal.description", { name: organizerName })}</p>
        <label className="block text-xs font-semibold text-on-surface-variant">
          <span className="mb-1 block">{t("circle.modal.email")}</span>
          <input autoComplete="email" className="w-full rounded-lg border border-surface-container-high bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-secondary" onChange={(event) => onReplyEmailChange(event.target.value)} placeholder="you@example.com" required type="email" value={replyEmail} />
        </label>
        <textarea
          autoFocus
          className="w-full resize-none rounded-lg border border-surface-container-high bg-surface-container-low p-4 text-sm leading-6 text-on-surface outline-none focus:border-secondary"
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder={t("circle.modal.placeholder", { name: organizerName })}
          rows={4}
          value={message}
        />
        <div className="flex justify-end gap-2">
          <button className="rounded-full px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container" onClick={onClose} type="button">{t("common.cancel")}</button>
          <button className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-white transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50" disabled={!message.trim() || !replyEmail.trim() || sending} onClick={onSend} type="button">{sending ? t("circle.modal.sending") : t("circle.modal.send")}</button>
        </div>
      </div>
    </div>
  );
}

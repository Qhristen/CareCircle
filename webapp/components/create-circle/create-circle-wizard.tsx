"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormSection } from "@/components/create-circle/form-section";
import { GoalSummary } from "@/components/create-circle/goal-summary";
import { WishlistBuilder } from "@/components/create-circle/wishlist-builder";
import { WizardStepper } from "@/components/create-circle/wizard-stepper";
import { Icon } from "@/components/ui/icon";
import {
  occasions,
  type WishlistItem,
} from "@/lib/create-circle-data";
import { getApiErrorMessage } from "@/lib/api-error";
import { useCreateCircleMutation, usePolishStoryMutation, usePublishCircleMutation } from "@/lib/store/api/circleApi";
import { useUploadWithCloudinaryMutation } from "@/lib/store/api/uploadApi";
import type { CreateCircleDto, PublishedCircle } from "@/types";

const fieldClass =
  "w-full rounded-lg bg-surface-container-low px-4 py-3 text-sm text-on-surface shadow-inner outline-none ring-primary/20 transition focus:bg-white focus:ring-4";

function naira(value: number) {
  return `₦${new Intl.NumberFormat("en-NG").format(value)}`;
}

export function CreateCircleWizard() {
  const router = useRouter();
  const [recipientName, setRecipientName] = useState("");
  const [relationship, setRelationship] = useState<CreateCircleDto["recipient"]["relationship"] | "">("");
  const [occasion, setOccasion] = useState("");
  const [customOccasion, setCustomOccasion] = useState("");
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [tonePolished, setTonePolished] = useState(false);
  const [mode, setMode] = useState<"cash" | "itemized">("itemized");
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [cashGoal, setCashGoal] = useState(0);
  const [flexBuffer, setFlexBuffer] = useState(false);
  const [status, setStatus] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [privacy, setPrivacy] = useState("link");
  const [delivery, setDelivery] = useState("ask");
  const [deadline, setDeadline] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryState, setDeliveryState] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverName, setCoverName] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [dialog, setDialog] = useState<"preview" | "published" | null>(null);
  const [copied, setCopied] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [publishedCircle, setPublishedCircle] = useState<PublishedCircle["data"] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const storyRef = useRef<HTMLTextAreaElement>(null);
  const [createCircle] = useCreateCircleMutation();
  const [publishCircle] = usePublishCircleMutation();
  const [polishStory, { isLoading: isPolishing }] = usePolishStoryMutation();
  const [uploadCover] = useUploadWithCloudinaryMutation();
  const canUploadCover = Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  );

  const summaryItems = useMemo<WishlistItem[]>(
    () =>
      mode === "itemized"
        ? items
        : [
            {
              id: 0,
              emoji: "💛",
              name: "Flexible Community Cash Pool",
              category: "Flexible Goal",
              description: "Recipient-directed support",
              price: cashGoal,
              priceNote: "Organizer Goal",
              accent: "primary",
            },
          ],
    [cashGoal, items, mode],
  );

  const goalTotal = useMemo(() => {
    const subtotal = summaryItems.reduce((total, item) => total + item.price, 0);
    return subtotal + (flexBuffer ? Math.round(subtotal * 0.05) : 0);
  }, [flexBuffer, summaryItems]);

  useEffect(() => {
    return () => {
      if (coverImage.startsWith("blob:")) URL.revokeObjectURL(coverImage);
    };
  }, [coverImage]);

  function goToStep(step: number) {
    setCurrentStep(step);
    if (step === 5) {
      setDialog("preview");
      return;
    }

    const targetIds = ["recipient-section", "story-section", "bundle-section", "privacy-section"];
    document.getElementById(targetIds[step - 1])?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function formatStory(opening: string, closing = opening) {
    const textarea = storyRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = story.slice(start, end) || "your message";
    const formatted = `${story.slice(0, start)}${opening}${selected}${closing}${story.slice(end)}`;
    setStory(formatted);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + opening.length,
        start + opening.length + selected.length,
      );
    });
  }

  async function copyShareLink() {
    const link = publishedCircle?.shareUrl;
    if (!link) {
      setStatus("Publish the circle before copying its share link.");
      return;
    }
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(link);
    } catch {
      const temporaryInput = document.createElement("textarea");
      temporaryInput.value = link;
      temporaryInput.style.position = "fixed";
      temporaryInput.style.opacity = "0";
      document.body.appendChild(temporaryInput);
      temporaryInput.select();
      document.execCommand("copy");
      temporaryInput.remove();
    }
    setCopied(true);
    setStatus("Shareable link copied to your clipboard.");
  }

  async function shareCircle() {
    if (!publishedCircle?.shareUrl) return;
    const shareData = {
      title,
      text: `Join ${recipientName}'s GiftCircle`,
      url: publishedCircle.shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyShareLink();
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setStatus("Sharing is unavailable here. Copy the link instead.");
      }
    }
  }

  function addWishlistItem() {
    const id = Math.max(0, ...items.map((item) => item.id)) + 1;
    setItems((current) => [
      ...current,
      {
        id,
        emoji: "🎁",
        name: "",
        category: "Custom",
        description: "",
        price: 0,
        priceNote: "Organizer estimate",
        accent: "primary",
      },
    ]);
    return id;
  }

  function validateCircle() {
    if (!recipientName.trim()) throw new Error("Enter the recipient's name.");
    if (!relationship) throw new Error("Choose your relationship to the recipient.");
    if (!occasion) throw new Error("Choose an occasion.");
    if (occasion === "other" && !customOccasion.trim()) throw new Error("Describe the custom occasion.");
    if (!title.trim()) throw new Error("Enter a circle title.");
    if (!story.trim()) throw new Error("Write a short story for the circle.");
    if (!coverImage) throw new Error("Upload a cover image before saving the circle.");
    if (!deadline) throw new Error("Choose a deadline.");
    if (mode === "cash" && cashGoal < 1000) throw new Error("Enter a cash goal of at least ₦1,000.");
    if (mode === "itemized" && !items.length) throw new Error("Add at least one wishlist item.");
    if (mode === "itemized" && items.some((item) => !item.name.trim() || item.price < 1000)) {
      throw new Error("Complete every wishlist item with a name and target of at least ₦1,000.");
    }
    if (delivery === "now" && (!deliveryAddress.trim() || !deliveryCity.trim() || !deliveryState.trim())) {
      throw new Error("Complete the recipient's delivery address.");
    }
  }

  function circlePayload(coverImageUrl: string): CreateCircleDto {
    const occasionAliases: Record<string, string> = { baby: "new-baby", aid: "community-support" };
    const storyWithCustomOccasion = occasion === "other"
      ? `Occasion: ${customOccasion.trim()}\n\n${story.trim()}`
      : story.trim();
    return {
      title: title.trim(),
      occasion: occasion === "other" ? "other" : occasionAliases[occasion] ?? occasion,
      privacy: privacy as CreateCircleDto["privacy"],
      recipient: {
        fullName: recipientName.trim(),
        relationship: relationship || "other",
        city: deliveryCity.trim() || undefined,
        countryCode: "NG",
      },
      storyMarkdown: storyWithCustomOccasion,
      coverImageUrl,
      coverAlt: `${recipientName}'s GiftCircle cover`,
      funding: {
        mode,
        currency: "NGN",
        cashGoalKobo: mode === "cash" ? Math.round(cashGoal * 100) : undefined,
        flexBufferPercent: flexBuffer ? 5 : 0,
      },
      wishlist: mode === "itemized" ? items.map((item) => ({
        clientReference: String(item.id),
        emoji: item.emoji,
        name: item.name,
        description: item.description,
        targetAmountKobo: Math.round(item.price * 100),
      })) : [],
      closesAt: new Date(`${deadline}T23:59:59`).toISOString(),
      delivery: {
        collectionMode: delivery === "now" ? "provide_now" : "request_when_funded",
        address: delivery === "now" ? {
          line1: deliveryAddress.trim(),
          city: deliveryCity.trim(),
          state: deliveryState.trim(),
          country: "Nigeria",
        } : null,
      },
    };
  }

  async function saveDraft() {
    validateCircle();
    if (draftId) return draftId;
    setStatus(coverFile ? "Uploading cover image…" : "Saving your circle draft…");
    const coverUrl = coverFile ? await uploadCover(coverFile).unwrap() : coverImage;
    const draft = await createCircle(circlePayload(coverUrl)).unwrap();
    setDraftId(draft.data.id);
    if (coverFile) setCoverImage(coverUrl);
    setStatus("Draft saved securely. You can publish it when ready.");
    return draft.data.id;
  }

  async function handlePublish() {
    setSubmitting(true);
    setStatus("");
    try {
      const id = await saveDraft();
      setStatus("Publishing your GiftCircle…");
      const published = await publishCircle({ id, idempotencyKey: crypto.randomUUID() }).unwrap();
      setPublishedCircle(published.data);
      setStatus("Circle published — opening its organizer dashboard…");
      router.push(`/organizer/circles/${published.data.id}`);
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Your circle could not be published."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePolishStory() {
    if (!occasion || !story.trim()) {
      setStatus("Choose an occasion and write a story before polishing it.");
      return;
    }
    try {
      const result = await polishStory({ occasion: occasion === "other" ? customOccasion : occasion, tone: "warm", text: story }).unwrap();
      setStory(result.data.polishedText);
      setTonePolished(true);
    } catch (error) {
      setStatus(getApiErrorMessage(error, "The story could not be polished."));
    }
  }

  return (
    <main className="relative min-h-screen bg-surface">
      <div className="pointer-events-none absolute -left-20 -top-12 h-96 w-96 rounded-full bg-primary-fixed/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-secondary-fixed/30 blur-3xl" />

      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await handlePublish();
        }}
      >
        <div className="relative mx-auto max-w-[1240px] px-4 py-8 sm:px-6">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-primary">
                <Icon name="wand" size={15} />
                Organizer Creation Suite
              </div>
              <h1 className="max-w-4xl text-3xl font-extrabold leading-tight tracking-[-0.03em] text-on-surface sm:text-4xl">
                Create a GiftCircle for Someone Special
              </h1>
              <p className="mt-2 max-w-2xl text-base leading-7 text-on-surface-variant">
                Honor life&apos;s milestones with collective warmth. Replace fragmented
                account numbers and coordination chaos with an itemized bundle wishlist.
              </p>
            </div>
            <span className="inline-flex self-start items-center gap-2 rounded-full bg-secondary-fixed px-3 py-1.5 text-xs font-extrabold text-on-secondary-fixed md:self-auto">
              <span className={`h-2 w-2 rounded-full ${draftId ? "bg-secondary" : "bg-outline"}`} />
              {draftId ? "Draft saved" : "Unsaved draft"}
            </span>
          </div>

          <WizardStepper currentStep={currentStep} onStepChange={goToStep} />

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-8">
              <FormSection
                description="Set the recipient identity and cultural vibe for the collective gift pool."
                id="recipient-section"
                letter="A"
                symbol="👥"
                title="Who are you celebrating or supporting?"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-[13px] font-bold text-on-surface">
                    <span>Recipient Full Name <span className="text-primary">*</span></span>
                    <div className="relative">
                      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" name="user" size={17} />
                      <input
                        className={`${fieldClass} pl-10`}
                        onChange={(event) => setRecipientName(event.target.value)}
                        placeholder="Enter recipient's full name"
                        required
                        type="text"
                        value={recipientName}
                      />
                    </div>
                  </label>
                  <label className="space-y-2 text-[13px] font-bold text-on-surface">
                    <span>Your Relationship <span className="text-primary">*</span></span>
                    <select className={fieldClass} onChange={(event) => setRelationship(event.target.value as typeof relationship)} required value={relationship}>
                      <option disabled value="">Select relationship</option>
                      <option value="friend">Friend / Colleague</option>
                      <option value="family">Family / Sibling</option>
                      <option value="partner">Partner / Spouse</option>
                      <option value="organizer">Community Organizer / Mentor</option>
                      <option value="faith">Fellow Church / Mosque Member</option>
                    </select>
                  </label>
                </div>

                <fieldset>
                  <legend className="mb-3 text-[13px] font-bold text-on-surface">
                    Select Celebration or Solidarity Occasion
                  </legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {occasions.map((item) => {
                      const selected = item.id === occasion;
                      return (
                        <button
                          aria-pressed={selected}
                          className={`flex min-h-24 flex-col items-center justify-center rounded-xl p-3 text-center transition active:scale-95 ${
                            selected
                              ? "bg-primary text-white shadow-md"
                              : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                          }`}
                          key={item.id}
                          onClick={() => setOccasion(item.id)}
                          type="button"
                        >
                          <span className="mb-1 text-2xl">{item.emoji}</span>
                          <span className="text-xs font-extrabold">{item.label}</span>
                          <span className={`text-[11px] ${selected ? "text-white/80" : "text-on-surface-variant"}`}>
                            {item.note}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {occasion === "other" && (
                    <label className="mt-4 block space-y-2 text-[13px] font-bold text-on-surface">
                      <span>Describe the occasion <span className="text-primary">*</span></span>
                      <input
                        autoFocus
                        className={fieldClass}
                        maxLength={80}
                        onChange={(event) => setCustomOccasion(event.target.value)}
                        placeholder="e.g. Retirement celebration"
                        required
                        value={customOccasion}
                      />
                    </label>
                  )}
                </fieldset>
              </FormSection>

              <FormSection
                description="Write the narrative that moves friends and family to give generously."
                id="story-section"
                letter="B"
                symbol="❝"
                title="The Story & Motivation"
              >
                <label className="block space-y-2">
                  <span className="flex items-center justify-between gap-3 text-[13px] font-bold text-on-surface">
                    <span>Circle Campaign Title</span>
                    <span className="text-xs font-normal text-outline">{title.length} / 80 characters</span>
                  </span>
                  <input
                    className={`${fieldClass} text-base font-bold`}
                    maxLength={80}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Give your circle a clear title"
                    required
                    value={title}
                  />
                </label>

                <div className="space-y-2">
                  <label className="block text-[13px] font-bold text-on-surface" htmlFor="circle-story">
                    Heartfelt Story
                  </label>
                  <div className="overflow-hidden rounded-lg bg-surface-container-low">
                    {/* <div className="flex items-center gap-1 bg-surface-container-high p-1.5">
                      <button
                        aria-label="Format selected story text as bold"
                        className="rounded px-2 py-1 text-sm font-extrabold text-on-surface-variant hover:bg-white"
                        onClick={() => formatStory("**")}
                        type="button"
                      >
                        B
                      </button>
                      <button
                        aria-label="Format selected story text as italic"
                        className="rounded px-2 py-1 text-sm italic text-on-surface-variant hover:bg-white"
                        onClick={() => formatStory("_")}
                        type="button"
                      >
                        I
                      </button>
                      <span className="mx-1 h-4 w-px bg-outline/30" />
                      <button
                        className="inline-flex items-center gap-1 rounded bg-primary-fixed px-2 py-1 text-xs font-extrabold text-on-primary-fixed"
                        disabled={isPolishing}
                        onClick={handlePolishStory}
                        type="button"
                      >
                        <Icon name="sparkles" size={13} />
                        {isPolishing ? "Polishing…" : tonePolished ? "Tone Polished ✓" : "AI Polish Tone"}
                      </button>
                    </div> */}
                    <textarea
                      className="w-full resize-none bg-transparent p-4 text-sm leading-6 text-on-surface outline-none"
                      id="circle-story"
                      onChange={(event) => setStory(event.target.value)}
                      placeholder="Tell contributors who this is for, why it matters, and how their support will help."
                      ref={storyRef}
                      required
                      rows={5}
                      value={story}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[13px] font-bold text-on-surface">Campaign Cover Visual</span>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="group relative h-48 overflow-hidden rounded-xl bg-surface-container-low shadow-inner md:col-span-8">
                      {coverImage ? (
                        <>
                          <Image alt="Selected GiftCircle cover" className="object-cover transition duration-700 group-hover:scale-105" fill sizes="(max-width: 767px) 100vw, 55vw" src={coverImage} unoptimized={coverImage.startsWith("blob:")} />
                          <div className="absolute inset-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/70 via-transparent to-transparent p-4">
                            <p className="truncate text-sm font-bold text-white">{coverName}</p>
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-primary"><Icon name="image" size={16} /></span>
                          </div>
                        </>
                      ) : (
                        <div className="grid h-full place-items-center p-6 text-center text-on-surface-variant">
                          <div><Icon className="mx-auto text-outline" name="image" size={32} /><p className="mt-2 text-sm font-bold">No cover image selected</p><p className="mt-1 text-xs">Upload an image that represents this circle.</p></div>
                        </div>
                      )}
                    </div>
                    <label className={`flex h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline/30 bg-surface-container-low p-4 text-center transition md:col-span-4 ${canUploadCover ? "cursor-pointer hover:bg-surface-container" : "cursor-not-allowed opacity-60"}`}>
                      <Icon className="mb-2 text-primary" name="image" size={30} />
                      <span className="text-[13px] font-bold text-on-surface">Upload Custom File</span>
                      <span className="mt-1 text-xs text-on-surface-variant">{canUploadCover ? "PNG, JPG or WebP up to 10MB" : "Configure Cloudinary to upload a custom cover"}</span>
                      <input
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        disabled={!canUploadCover}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          if (file.size > 10 * 1024 * 1024) {
                            setStatus("Please select an image smaller than 10MB.");
                            return;
                          }
                          setCoverImage(URL.createObjectURL(file));
                          setCoverName(file.name);
                          setCoverFile(file);
                          setStatus("Campaign cover updated.");
                        }}
                        type="file"
                      />
                    </label>
                  </div>
                </div>
              </FormSection>

              <section
                className="scroll-mt-28 space-y-6 rounded-2xl bg-white p-5 shadow-soft sm:p-8"
                id="bundle-section"
              >
                <WishlistBuilder
                  cashGoal={cashGoal}
                  items={items}
                  mode={mode}
                  onAdd={addWishlistItem}
                  onCashGoalChange={setCashGoal}
                  onDelete={(id) => setItems((current) => current.filter((item) => item.id !== id))}
                  onModeChange={setMode}
                  onUpdate={(id, updates) =>
                    setItems((current) =>
                      current.map((item) =>
                        item.id === id ? { ...item, ...updates } : item,
                      ),
                    )
                  }
                />
              </section>

              <FormSection
                description="Keep it confidential as a surprise or open for broad diaspora participation."
                id="privacy-section"
                letter="D"
                symbol="🔒"
                title="Privacy, Deadline & Fulfillment Setup"
              >
                <fieldset>
                  <legend className="mb-3 text-[13px] font-bold text-on-surface">Circle Privacy Mode</legend>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[
                      ["link", "🔗", "Link-Only Circle", "Anyone with your private link can view & give."],
                      ["invite", "🔑", "Private Invite Only", "Organizer manually approves donor access"],
                      ["public", "🌍", "Public Community", "Searchable on GiftCircle Explore for open mutual aid."],
                    ].map(([value, emoji, label, description], index) => (
                      <label
                        className={`flex cursor-pointer flex-col rounded-xl border p-4 transition ${
                          privacy === value
                            ? "border-primary bg-primary-fixed/45 shadow-sm"
                            : "border-transparent bg-surface-container-low hover:bg-surface-container"
                        }`}
                        key={value}
                      >
                        <span className="mb-2 flex items-center justify-between">
                          <span className="text-xl">{emoji}</span>
                          <input
                            checked={privacy === value}
                            className="h-4 w-4 accent-primary"
                            name="privacy"
                            onChange={() => setPrivacy(value)}
                            type="radio"
                            value={value}
                          />
                        </span>
                        <span className="text-[15px] font-bold text-on-surface">{label}</span>
                        <span className="mt-1 text-sm leading-6 text-on-surface-variant">{description}</span>
                        {index === 0 && <span className="mt-2 w-max rounded-full bg-primary-fixed px-2 py-0.5 text-[11px] font-extrabold text-on-primary-fixed">Recommended</span>}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <label className="space-y-2 text-[13px] font-bold text-on-surface">
                    <span>Target Deadline Date</span>
                    <div className="relative">
                      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" name="calendar" size={17} />
                      <input className={`${fieldClass} pl-10`} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setDeadline(event.target.value)} required type="date" value={deadline} />
                    </div>
                    <span className="block text-xs font-normal leading-5 text-on-surface-variant">Choose when contributions should close.</span>
                  </label>
                  <fieldset>
                    <legend className="mb-2 text-[13px] font-bold text-on-surface">Recipient Delivery & Address</legend>
                    <label className="flex cursor-pointer items-start gap-2 text-sm leading-6 text-on-surface">
                      <input
                        checked={delivery === "now"}
                        className="mt-1 h-4 w-4 accent-secondary"
                        name="delivery"
                        onChange={() => setDelivery("now")}
                        type="radio"
                      />
                      I will provide {recipientName || "the recipient"}&apos;s delivery address now
                    </label>
                    {delivery === "now" && (
                      <>
                      <input
                        aria-label="Recipient delivery address"
                        className={`${fieldClass} mt-2`}
                        onChange={(event) => setDeliveryAddress(event.target.value)}
                        placeholder="Enter delivery address"
                        required
                        type="text"
                        value={deliveryAddress}
                      />
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <input aria-label="Delivery city" className={fieldClass} onChange={(event) => setDeliveryCity(event.target.value)} placeholder="City" required value={deliveryCity} />
                        <input aria-label="Delivery state" className={fieldClass} onChange={(event) => setDeliveryState(event.target.value)} placeholder="State" required value={deliveryState} />
                      </div>
                      </>
                    )}
                    <label className="mt-2 flex cursor-pointer items-start gap-2 text-sm font-bold leading-6 text-secondary">
                      <input
                        checked={delivery === "ask"}
                        className="mt-1 h-4 w-4 accent-secondary"
                        name="delivery"
                        onChange={() => setDelivery("ask")}
                        type="radio"
                      />
                      Ask {recipientName || "the recipient"} privately when the goal is reached
                    </label>
                    <p className="mt-2 text-xs leading-5 text-on-surface-variant">Preserves the surprise without spoiling the gift reveal.</p>
                  </fieldset>
                </div>
              </FormSection>
            </div>

            <GoalSummary
              flexBuffer={flexBuffer}
              items={summaryItems}
              onFlexBufferChange={setFlexBuffer}
              recipientName={recipientName}
              title={title}
            />
          </div>
        </div>

        <div className="sticky bottom-0 z-40 border-t border-black/[0.05] bg-surface/95 p-4 shadow-[0_-8px_28px_rgba(58,25,10,0.10)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-4 px-0 sm:flex-row sm:px-2">
            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
              <button className="inline-flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-on-surface" onClick={() => goToStep(1)} type="button">
                <Icon name="arrow-left" size={15} /> Back to Step 1
              </button>
              <span className="hidden items-center gap-1.5 text-xs text-on-surface-variant md:inline-flex"><Icon name="cloud" size={14} /> {draftId ? "Draft saved to GiftCircle" : "Changes are only on this device"}</span>
            </div>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <button className="rounded-full bg-surface-container px-5 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-60" disabled={submitting || Boolean(draftId)} onClick={async () => { setSubmitting(true); try { await saveDraft(); } catch (error) { setStatus(getApiErrorMessage(error, "Your draft could not be saved.")); } finally { setSubmitting(false); } }} type="button">{draftId ? "Draft Saved" : "Save Draft"}</button>
              <button className="hidden items-center gap-1.5 rounded-full bg-surface-container px-4 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container-high md:inline-flex" onClick={() => { setCurrentStep(5); setDialog("preview"); }} type="button"><Icon name="eye" size={15} /> Preview</button>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-lg transition hover:bg-primary-container active:scale-95 disabled:cursor-wait disabled:opacity-70 sm:flex-initial" disabled={submitting} type="submit">{submitting ? "Publishing…" : "Publish Circle & Get Shareable Link"} {!submitting && <Icon name="arrow-right" size={16} />}</button>
            </div>
          </div>
          {status && <p aria-live="polite" className="mx-auto mt-2 max-w-[1240px] text-center text-xs font-bold text-secondary">{status}</p>}
        </div>
      </form>

      {dialog && (
        <div
          aria-labelledby="circle-dialog-title"
          aria-modal="true"
          className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-[#1b1c1a]/55 p-4 backdrop-blur-sm"
          role="dialog"
        >
          <div className="relative my-8 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
            <button
              aria-label="Close dialog"
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-on-surface shadow-sm hover:bg-white"
              onClick={() => setDialog(null)}
              type="button"
            >
              <Icon name="close" size={17} />
            </button>

            <div className="relative h-44 bg-surface-container">
              {coverImage ? (
                <Image alt="GiftCircle campaign cover preview" className="object-cover" fill sizes="512px" src={coverImage} unoptimized={coverImage.startsWith("blob:")} />
              ) : (
                <div className="grid h-full place-items-center text-on-surface-variant"><Icon name="image" size={30} /></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
              <span className="absolute bottom-4 left-5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                {occasions.find((item) => item.id === occasion)?.emoji}{" "}
                {occasion === "other" ? customOccasion || "Other occasion" : occasions.find((item) => item.id === occasion)?.label || "Occasion not selected"}
              </span>
            </div>

            <div className="p-6 sm:p-7">
              {dialog === "published" && (
                <div className="mb-5 flex items-center gap-3 rounded-xl bg-secondary-fixed p-3 text-secondary">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-white">
                    <Icon name="check" size={19} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold">Your GiftCircle is live</p>
                    <p className="text-xs text-on-secondary-fixed">Share the link and start gathering support.</p>
                  </div>
                </div>
              )}

              <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
                {dialog === "published" ? "Published Circle" : "Contributor Preview"}
              </p>
              <h2 className="mt-1 pr-8 text-2xl font-extrabold leading-tight text-on-surface" id="circle-dialog-title">
                {title}
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                For {recipientName} • {privacy === "link" ? "Link-only" : privacy === "invite" ? "Private invite" : "Public community"}
              </p>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-on-surface-variant">{story}</p>

              <div className="mt-5 flex items-end justify-between gap-4 rounded-xl bg-surface-container-low p-4">
                <div>
                  <p className="text-xs font-bold text-on-surface-variant">Funding goal</p>
                  <p className="text-2xl font-extrabold text-primary">{naira(goalTotal)}</p>
                </div>
                <p className="text-sm font-bold text-secondary">{summaryItems.length} wishlist item{summaryItems.length === 1 ? "" : "s"}</p>
              </div>

              {dialog === "published" ? (
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-on-surface/10 px-3 py-2.5 text-sm">
                    <span className="truncate text-on-surface-variant">{publishedCircle?.shareUrl}</span>
                    <button className="shrink-0 font-bold text-primary" onClick={copyShareLink} type="button">
                      {copied ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-white hover:bg-primary-container" onClick={shareCircle} type="button">Share Circle</button>
                    <button className="rounded-full bg-surface-container px-5 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-high" onClick={() => setDialog(null)} type="button">Done</button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex gap-2">
                  <button className="flex-1 rounded-full bg-surface-container px-5 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-high" onClick={() => { setCurrentStep(2); setDialog(null); }} type="button">Keep Editing</button>
                  <button className="flex-1 rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-white hover:bg-primary-container disabled:opacity-70" disabled={submitting} onClick={handlePublish} type="button">{submitting ? "Publishing…" : "Publish Circle"}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

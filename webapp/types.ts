export type UserDto = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  currency: string;
  phone?: string | null;
  country?: string;
  role?: string;
  createdAt?: string;
};

export type LoginResponseDto = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserDto;
};

export type CookieLoginResponseDto = Pick<LoginResponseDto, "expiresIn" | "user">;

export type LoginDto = {
  email: string;
  password: string;
  platform?: "web" | "mobile";
};

export type RegisterDto = {
  name: string;
  email: string;
  password: string;
  platform?: "web" | "mobile";
};

export type ApiEnvelope<T> = { data: T };

export type CursorMeta = {
  nextCursor: string | null;
  hasMore: boolean;
};

export type ExploreCircle = {
  id: string;
  slug: string;
  title: string;
  occasion: string;
  city: string | null;
  countryCode: string;
  organizer: {
    displayName: string;
    verified: boolean;
  };
  cover: {
    url: string | null;
    alt: string;
  };
  wishlistPreview: Array<{
    id: string;
    name: string;
    emoji: string | null;
  }>;
  funding: {
    currency: string;
    goalKobo: number;
    raisedKobo: number;
    percent: number;
    supporterCount: number;
    closesAt: string;
  };
  status: string;
  shareUrl: string;
};

export type ExploreCirclesResponse = {
  data: ExploreCircle[];
  meta: CursorMeta;
};

export type CircleOccasion =
  | "BIRTHDAY"
  | "WEDDING"
  | "NEW_BABY"
  | "GRADUATION"
  | "BEREAVEMENT"
  | "RECOVERY"
  | "HOUSEWARMING"
  | "COMMUNITY_SUPPORT"
  | "EMERGENCY_ASSISTANCE"
  | "OTHER";

export type CircleStatus =
  | "DRAFT"
  | "ACTIVE"
  | "FUNDED"
  | "FULFILLING"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export type MyCircle = {
  id: string;
  slug: string;
  title: string;
  occasion: CircleOccasion | string;
  recipientName: string;
  recipientCity: string | null;
  recipientCountryCode: string | null;
  coverImageUrl: string | null;
  coverAlt: string | null;
  privacy: string;
  status: CircleStatus | string;
  targetAmount: number;
  amountRaised: number;
  currency: string;
  supporterCount: number;
  deadline: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
};

export type PageMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type MyCirclesResponse = {
  data: MyCircle[];
  meta: PageMeta;
};

export type CircleWishlistItem = {
  id: string;
  emoji: string | null;
  name: string;
  description: string | null;
  targetAmountKobo: number;
  fundedAmountKobo: number;
  remainingAmountKobo: number;
  status: "open" | "partially_funded" | "funded" | string;
  suggestedContributionKobo: number;
};

export type CircleDetail = {
  id: string;
  slug: string;
  status: string;
  privacy: "link" | "invite" | "public";
  occasion: string;
  title: string;
  storyMarkdown: string | null;
  recipient: {
    displayName: string;
    city: string | null;
    countryCode: string;
  };
  organizer: {
    id: string;
    displayName: string;
    verified: boolean;
  };
  cover: {
    url: string | null;
    alt: string;
  };
  funding: {
    currency: string;
    goalKobo: number;
    raisedKobo: number;
    percent: number;
    supporterCount: number;
    closesAt: string;
    acceptsContributions: boolean;
  };
  wishlist: CircleWishlistItem[];
  fulfillment: {
    stage: string;
    publicLabel: string;
  };
  viewer: {
    canView: boolean;
    canContribute: boolean;
    canManage: boolean;
  };
  updatedAt: string;
};

export type PublicContribution = {
  id: string;
  displayName: string;
  initials: string;
  amountKobo: number | null;
  message: string | null;
  wishlistItem: { id: string; name: string } | null;
  anonymous: boolean;
  createdAt: string;
};

export type PublicContributionsResponse = {
  data: PublicContribution[];
  meta: CursorMeta;
};

export type CreateContributionDto = {
  amount: number;
  amountKobo: number;
  currency: string;
  wishlistItemId?: string;
  message?: string;
  privacy?: {
    anonymous?: boolean;
    hideAmount?: boolean;
  };
  returnUrl: string;
};

export type ContributionIntent = ApiEnvelope<{
  contribution: {
    id: string;
    reference: string;
    status: string;
    amountKobo: number;
    currency: string;
    wishlistItemId: string | null;
    createdAt: string;
  };
  checkout: {
    type: "redirect";
    url: string | null;
    expiresAt: string;
  };
}>;

export type DeliveryAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  instructions?: string;
};

export type CreateCircleDto = {
  title: string;
  occasion: string;
  privacy: "link" | "invite" | "public";
  recipient: {
    fullName: string;
    relationship: "friend" | "family" | "partner" | "organizer" | "faith" | "other";
    city?: string;
    countryCode?: string;
  };
  storyMarkdown: string;
  coverImageUrl: string;
  coverAlt: string;
  funding: {
    mode: "cash" | "itemized";
    currency: string;
    cashGoalKobo?: number;
    flexBufferPercent: number;
  };
  wishlist: Array<{
    clientReference?: string;
    emoji?: string;
    name: string;
    description?: string;
    targetAmountKobo: number;
  }>;
  closesAt: string;
  delivery: {
    collectionMode: "provide_now" | "request_when_funded";
    address?: DeliveryAddress | null;
  };
};

export type CircleDraft = ApiEnvelope<{
  id: string;
  slug: string;
  status: string;
  version: number;
  currency: string;
  subtotalKobo: number;
  flexBufferKobo: number;
  goalKobo: number;
  createdAt: string;
  updatedAt: string;
}>;

export type PublishedCircle = ApiEnvelope<{
  id: string;
  slug: string;
  status: string;
  publishedAt: string;
  shareUrl: string;
  organizerUrl: string;
}>;

export type OrganizerDashboardResponse = ApiEnvelope<{
  circle: {
    id: string;
    title: string;
    status: string;
    privacy: string;
    createdAt: string;
  };
  metrics: {
    currency: string;
    goalKobo: number;
    raisedKobo: number;
    remainingKobo: number;
    fundedPercent: number;
    supporterCount: number;
    averageContributionKobo: number;
    blessingCount: number;
    claimedItemCount: number;
  };
  escrow: {
    status: string;
    heldAmountKobo: number;
    accountNumberMasked: string;
    partnerName: string;
    disbursementMode: string;
  };
  fulfillment: {
    stage: string;
    addressStatus: string;
    purchaseOrderStatus: string;
    vendor: { id: string; name: string };
  };
  updatedAt: string;
}>;

export type ManagedCircle = {
  id: string;
  slug: string;
  title: string;
  occasion: string;
  recipientName: string;
  recipientCity?: string | null;
  coverImageUrl?: string | null;
  privacy: string;
  status: string;
  targetAmount: number;
  amountRaised: number;
  supporterCount?: number;
  deadline: string;
  createdAt: string;
  items: Array<{
    id: string;
    emoji: string | null;
    name: string;
    description: string | null;
    targetAmount: number | string;
    fundedAmount: number | string;
    status: string;
  }>;
};

export type OrganizerContribution = {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  amountKobo: number;
  currency: string;
  status: string;
  paymentMethod: string;
  paymentReference: string;
  allocation: { id: string; name: string } | null;
  note: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type OrganizerContributionsResponse = {
  data: OrganizerContribution[];
  meta: CursorMeta;
};

export type GeneratePresignedUrlsDto = {
  files: Array<{ fileName: string; contentType: string }>;
};

export type PresignedUrlsResponseDto = {
  urls: Array<{ uploadUrl: string; fileUrl: string }>;
};

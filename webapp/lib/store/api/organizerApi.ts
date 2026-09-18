import { baseApi } from "./baseApi";
import type {
  Circle,
  OrganizerContributionsResponse,
  OrganizerDashboardResponse,
} from "@/types";

export const organizerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrganizerDashboard: builder.query<OrganizerDashboardResponse, string>({
      query: (circleId) => `/api/v1/organizer/circles/${circleId}/dashboard`,
      providesTags: (_result, _error, circleId) => [{ type: "Circle", id: circleId }],
    }),
    getManagedCircle: builder.query<Circle, string>({
      query: (circleId) => `/api/v1/circles/${circleId}`,
      providesTags: (_result, _error, circleId) => [{ type: "Circle", id: circleId }],
    }),
    getOrganizerContributions: builder.query<OrganizerContributionsResponse, string>({
      query: (circleId) => ({
        url: `/api/v1/organizer/circles/${circleId}/contributions`,
        params: { limit: 100 },
      }),
      providesTags: (_result, _error, circleId) => [{ type: "Contribution", id: circleId }],
    }),
    exportOrganizerContributions: builder.mutation<string, string>({
      query: (circleId) => ({
        url: `/api/v1/organizer/circles/${circleId}/contributions/export`,
        params: { format: "csv" },
        responseHandler: "text",
      }),
    }),
    addOrganizerWishlistItem: builder.mutation<
      { data: { id: string; emoji: string | null; name: string; description: string | null; targetAmountKobo: number; fundedAmountKobo: number; goalKobo: number } },
      { circleId: string; name: string; description?: string; emoji?: string; targetAmountKobo: number }
    >({
      query: ({ circleId, ...body }) => ({ url: `/api/v1/organizer/circles/${circleId}/wishlist-items`, method: "POST", body }),
      invalidatesTags: (_result, _error, { circleId }) => [{ type: "Circle", id: circleId }],
    }),
    thankOrganizerContributor: builder.mutation<unknown, { circleId: string; contributionId: string; message: string }>({
      query: ({ circleId, contributionId, message }) => ({
        url: `/api/v1/organizer/circles/${circleId}/contributions/${contributionId}/thank`,
        method: "POST",
        body: { message },
      }),
    }),
    sendOrganizerBroadcast: builder.mutation<unknown, { circleId: string; message: string; channels: Array<"whatsapp" | "in_app" | "email"> }>({
      query: ({ circleId, ...body }) => ({ url: `/api/v1/organizer/circles/${circleId}/broadcasts`, method: "POST", body }),
    }),
    createOrganizerPurchaseOrder: builder.mutation<unknown, { circleId: string; wishlistItemIds: string[] }>({
      query: ({ circleId, wishlistItemIds }) => ({
        url: `/api/v1/organizer/circles/${circleId}/purchase-orders`,
        method: "POST",
        body: { type: "early", wishlistItemIds },
      }),
      invalidatesTags: (_result, _error, { circleId }) => [{ type: "Circle", id: circleId }],
    }),
    confirmOrganizerAddress: builder.mutation<unknown, string>({
      query: (circleId) => ({ url: `/api/v1/organizer/circles/${circleId}/delivery-address/confirm`, method: "POST" }),
      invalidatesTags: (_result, _error, circleId) => [{ type: "Circle", id: circleId }],
    }),
    updateOrganizerSettings: builder.mutation<unknown, { circleId: string; privacy: "link" | "invite" | "public" }>({
      query: ({ circleId, ...body }) => ({ url: `/api/v1/organizer/circles/${circleId}/settings`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { circleId }) => [{ type: "Circle", id: circleId }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetOrganizerDashboardQuery,
  useGetManagedCircleQuery,
  useGetOrganizerContributionsQuery,
  useExportOrganizerContributionsMutation,
  useAddOrganizerWishlistItemMutation,
  useThankOrganizerContributorMutation,
  useSendOrganizerBroadcastMutation,
  useCreateOrganizerPurchaseOrderMutation,
  useConfirmOrganizerAddressMutation,
  useUpdateOrganizerSettingsMutation,
} = organizerApi;

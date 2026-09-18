import { baseApi } from "./baseApi";
import type {
  ApiEnvelope,
  Circle,
  CircleDraft,
  CircleOccasion,
  CircleStatus,
  CreateCircleDto,
  ExploreCirclesResponse,
  MyCirclesResponse,
  PublishedCircle,
} from "@/types";

export type ExploreCirclesParams = {
  q?: string;
  sort?: "active" | "ending" | "recent" | "funded";
  minFundedPercent?: number;
  limit?: number;
  cursor?: string;
};

export type MyCirclesParams = {
  page?: number;
  limit?: number;
  search?: string;
  occasion?: CircleOccasion;
  status?: CircleStatus;
};

export const circleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCircles: builder.query<ExploreCirclesResponse, ExploreCirclesParams | void>({
      query: (params) => ({ url: "/api/v1/circles", params: params || undefined }),
      providesTags: (result) => [
        { type: "Circle", id: "LIST" },
        ...(result?.data.map(({ id }) => ({ type: "Circle" as const, id })) ?? []),
      ],
    }),
    getCircle: builder.query<ApiEnvelope<Circle>, string>({
      query: (circleId) => `/api/v1/circles/${encodeURIComponent(circleId)}`,
      providesTags: (result) => result ? [{ type: "Circle", id: result?.data?.id }] : [],
    }),
    getMyCircles: builder.query<MyCirclesResponse, MyCirclesParams | void>({
      query: (params) => ({
        url: "/api/v1/circles/mine",
        params: params || undefined,
      }),
      providesTags: (result) => [
        { type: "Circle", id: "MINE" },
        ...(result?.data.map(({ id }) => ({ type: "Circle" as const, id })) ?? []),
      ],
    }),
    createCircle: builder.mutation<CircleDraft, CreateCircleDto>({
      query: (body) => ({ url: "/api/v1/circles", method: "POST", body }),
      invalidatesTags: [
        { type: "Circle", id: "LIST" },
        { type: "Circle", id: "MINE" },
      ],
    }),
    publishCircle: builder.mutation<PublishedCircle, { id: string; idempotencyKey: string }>({
      query: ({ id, idempotencyKey }) => ({
        url: `/api/v1/circles/${id}/publish`,
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Circle", id },
        { type: "Circle", id: "LIST" },
        { type: "Circle", id: "MINE" },
      ],
    }),
    polishStory: builder.mutation<
      ApiEnvelope<{ polishedText: string; moderation: { allowed: boolean } }>,
      { occasion: string; tone: "warm" | "formal" | "joyful" | "gentle"; text: string }
    >({
      query: (body) => ({
        url: "/api/v1/writing/polish",
        method: "POST",
        body: { purpose: "circle-story", ...body },
      }),
    }),
    messageOrganizer: builder.mutation<
      ApiEnvelope<{ id: string; status: string; createdAt: string }>,
      { circleId: string; message: string; replyEmail: string }
    >({
      query: ({ circleId, ...body }) => ({
        url: `/api/v1/circles/${circleId}/messages`,
        method: "POST",
        body,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetCirclesQuery,
  useGetCircleQuery,
  useGetMyCirclesQuery,
  useCreateCircleMutation,
  usePublishCircleMutation,
  usePolishStoryMutation,
  useMessageOrganizerMutation,
} = circleApi;

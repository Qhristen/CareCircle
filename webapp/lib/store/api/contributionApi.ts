import { baseApi } from "./baseApi";
import type {
  ContributionIntent,
  CreateContributionDto,
  PublicContributionsResponse,
} from "@/types";

export const contributionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicContributions: builder.query<
      PublicContributionsResponse,
      { circleId: string; limit?: number; hasMessage?: boolean }
    >({
      query: ({ circleId, ...params }) => ({
        url: `/api/v1/circles/${circleId}/contributions`,
        params,
      }),
      providesTags: (_result, _error, { circleId }) => [
        { type: "Contribution", id: circleId },
      ],
    }),
    createContributionIntent: builder.mutation<
      ContributionIntent,
      {
        circleId: string;
        idempotencyKey: string;
        body: CreateContributionDto;
      }
    >({
      query: ({ circleId, idempotencyKey, body }) => ({
        url: `/api/v1/circles/${circleId}/contribution-intents`,
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetPublicContributionsQuery,
  useCreateContributionIntentMutation,
} = contributionApi;

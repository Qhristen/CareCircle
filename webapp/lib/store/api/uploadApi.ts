import { baseApi } from './baseApi';
import type { GeneratePresignedUrlsDto, PresignedUrlsResponseDto } from '@/types';

export const uploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    generatePresignedUrls: builder.mutation<PresignedUrlsResponseDto, GeneratePresignedUrlsDto>({
      query: (body) => ({
        url: `/api/v1/upload/presigned-urls`,
        method: 'POST',
        body,
      }),
    }),
    uploadWithCloudinary: builder.mutation<string, File>({
      queryFn: async (file) => {
        try {
          const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
          const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

          if (!cloudName || !uploadPreset) {
            return { error: { status: 500, data: { message: 'Cloudinary configuration is missing' } } };
          }

          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', uploadPreset);

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
              method: 'POST',
              body: formData,
            }
          );

          const data = await response.json();

          if (!response.ok) {
            return {
              error: {
                status: response.status,
                data: { message: data.error?.message || 'Failed to upload image to Cloudinary' }
              }
            };
          }

          return { data: data.secure_url };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred during upload';
          return {
            error: {
              status: 'FETCH_ERROR',
              error: errorMessage,
            }
          };
        }
      },
    }),
  }),
  overrideExisting: true
});

export const {
  useGeneratePresignedUrlsMutation,
  useUploadWithCloudinaryMutation,
} = uploadApi;

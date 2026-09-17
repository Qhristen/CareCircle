import { baseApi } from './baseApi';
import type {
  UserDto,
  LoginDto,
  RegisterDto,
  LoginResponseDto,
  CookieLoginResponseDto,
} from '@/types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<LoginResponseDto | CookieLoginResponseDto, RegisterDto>({
      query: (body) => ({
        url: '/api/v1/auth/register',
        method: 'POST',
        body: { ...body, platform: body.platform ?? 'web' },
      }),
      invalidatesTags: ['User'],
    }),
    login: builder.mutation<LoginResponseDto | CookieLoginResponseDto, LoginDto>({
      query: (body) => ({
        url: '/api/v1/auth/login',
        method: 'POST',
        body: { ...body, platform: body.platform ?? 'web' },
      }),
      invalidatesTags: ['User'],
    }),
    googleLogin: builder.mutation<LoginResponseDto | CookieLoginResponseDto, { idToken: string; platform?: 'web' | 'mobile' }>({
      query: (body) => ({
        url: '/api/v1/auth/google',
        method: 'POST',
        body: { ...body, platform: body.platform ?? 'web' },
      }),
    }),
    refreshToken: builder.mutation<void, void>({
      query: () => ({
        url: '/api/v1/auth/refresh',
        method: 'POST',
        body: {},
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/api/v1/auth/logout',
        method: 'POST',
        body: {},
      }),
    }),
    getMe: builder.query<UserDto, void>({
      query: () => '/api/v1/users/me',
      providesTags: ['User'],
    }),
  }),
  overrideExisting: true
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGoogleLoginMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetMeQuery,
} = authApi;

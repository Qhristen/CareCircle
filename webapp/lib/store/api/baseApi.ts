import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { logout } from '../slices/authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:9000',
  credentials: 'include',
});

let refreshPromise: Promise<boolean> | null = null;

/**
 * Wraps fetchBaseQuery to handle 401s globally:
 * - Attempts a token refresh
 * - If that fails, logs the user out
 */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const requestUrl = typeof args === 'string' ? args : args.url;

  if (
    result.error?.status === 401 &&
    requestUrl !== '/api/v1/auth/refresh' &&
    requestUrl !== '/api/v1/auth/login' &&
    requestUrl !== '/api/v1/auth/register'
  ) {
    if (!refreshPromise) {
      const pendingRefresh = Promise.resolve(rawBaseQuery(
        { url: '/api/v1/auth/refresh', method: 'POST', body: {} },
        api,
        extraOptions
      )).then((refreshResult) => Boolean(refreshResult.data));
      refreshPromise = pendingRefresh;
      void pendingRefresh.finally(() => {
        if (refreshPromise === pendingRefresh) refreshPromise = null;
      });
    }

    if (await refreshPromise) {
      // Retry the original query
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Circle',
    'Contribution',
    'Notification',
    'User',
    'Product',
    'Category',
    'Order',
    'Customer',
    'Inventory',
    'Payment',
    'Promotion',
    'Dashboard',
    'Settings',
    'AdminUser',
    'Business',
    'Dispute',
    'Review',
    'Feature',
    'PaymentPlanOption',
    'AuditLog',
  ],
  endpoints: () => ({}),
});

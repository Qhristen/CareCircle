'use client';

import { Provider } from 'react-redux';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { store } from '@/lib/store/store';
import GoogleAuthProviderWrapper from '@/components/providers/google-auth-provider';
import { AuthBootstrap } from '@/components/providers/auth-bootstrap';
import { I18nProvider } from '@/components/providers/i18n-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <Provider store={store}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GoogleAuthProviderWrapper>
            <AuthBootstrap />
            {children}
          </GoogleAuthProviderWrapper>
        </NextThemesProvider>
      </Provider>
    </I18nProvider>
  );
}

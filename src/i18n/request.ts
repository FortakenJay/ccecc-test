// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const [translation, dashboard] = await Promise.all([
    import(`../locales/${locale}/translation`),
    import(`../locales/${locale}/dashboard`)
  ]);

  return {
    locale,
    messages: {
      ...translation.default,
      dashboard: dashboard.default
    }
  };
});
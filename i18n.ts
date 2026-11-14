import { getRequestConfig } from 'next-intl/server';
import { routing } from './i18n/routing';

export const locales = ['tr', 'en', 'de', 'ru', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale = 'tr';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});

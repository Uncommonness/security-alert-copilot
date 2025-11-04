import {getRequestConfig} from 'next-intl/server';
import type {GetRequestConfigParams} from 'next-intl/server';

export default getRequestConfig(async ({locale}: GetRequestConfigParams) => {
  return {
    locale: locale || 'ko',
    messages: (await import(`./messages/${locale || 'ko'}.json`)).default
  };
}); 
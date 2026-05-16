import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';
import {provideRouter} from '@angular/router';
import localeDE from '@angular/common/locales/de';

import {routes} from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {registerLocaleData} from '@angular/common';
import {ApiConfiguration} from './api/generated-api/api-configuration';
import {orderSubmissionInterceptor} from './services/offline-capability/order-submission-interceptor';

registerLocaleData(localeDE);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([orderSubmissionInterceptor])),
    { provide: LOCALE_ID, useValue: 'de' },
    { provide: ApiConfiguration, useValue: { rootUrl: '' } },
  ]
};

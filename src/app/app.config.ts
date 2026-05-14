import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';
import {provideRouter} from '@angular/router';
import localeDE from '@angular/common/locales/de';

import {routes} from './app.routes';
import {provideHttpClient} from '@angular/common/http';
import {registerLocaleData} from '@angular/common';
import {ApiConfiguration} from './api/generated-api/api-configuration';

registerLocaleData(localeDE);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'de' },
    { provide: ApiConfiguration, useValue: { rootUrl: '' } },
  ]
};

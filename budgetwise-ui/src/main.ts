import { bootstrapApplication } from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

if (environment.sentryDsn) {
  Sentry.init({
    dsn: environment.sentryDsn,
    environment: environment.production ? 'production' : 'development',
  });
}

bootstrapApplication(App, appConfig)
  .catch((err) => {
    if (environment.sentryDsn) {
      Sentry.captureException(err);
    }

    console.error(err);
  });

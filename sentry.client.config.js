// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

import { denyUrls } from './src/lib/sentryIgnore'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN || 'https://bf59fe361cb54e2b98edbdd3d09ce16d@o1278390.ingest.sentry.io/6477798',
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,
  denyUrls

  // ...
  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
})

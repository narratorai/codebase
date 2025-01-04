import segmentPlugin from '@analytics/segment'
import Analytics from 'analytics'
import { compact } from 'lodash'

import { customValidationPlugin, helpScoutPlugin, logrocketPlugin, sentryPlugin, trackCompanySlug } from './plugins'

const plugins = compact([
  customValidationPlugin(),
  // Don't load Segment if you don't have the key:
  !!process.env.NEXT_PUBLIC_SEGMENT_KEY &&
    segmentPlugin({
      writeKey: process.env.NEXT_PUBLIC_SEGMENT_KEY,
      customScriptSrc: `https://sc.t.narrator.ai/analytics.js/v1/${process.env.NEXT_PUBLIC_SEGMENT_KEY}/analytics.min.js`,
    }),
  helpScoutPlugin(),
  logrocketPlugin(),
  sentryPlugin(),
  trackCompanySlug(),
])

/* initialize analytics and load plugins */
const analytics = Analytics({
  debug: process.env.NODE_ENV === 'development',
  plugins,
})

export default analytics

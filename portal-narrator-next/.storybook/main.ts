import type { StorybookConfig } from '@storybook/nextjs'
import type webpack from 'webpack'

const config: StorybookConfig = {
  stories: [
    {
      // Allow only story files in the ../src/components directory.
      directory: '../src/components',
      // Allow only story files with .ts or .tsx extension.
      files: '**/*.stories.@(ts|tsx)',
    },
  ],
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
    '@storybook/addon-interactions',
    'storybook-addon-pseudo-states',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  staticDirs: ['../public'],

  // Add the custom webpack configuration
  webpackFinal: async (webpackConfig, { configType }) => {
    // Exclude SVGs from the default file loader
    const fileLoaderRule = webpackConfig.module?.rules?.find(
      (rule) => typeof rule === 'object' && rule?.test && rule.test.toString().includes('svg')
    )

    if (fileLoaderRule && typeof fileLoaderRule !== 'string') {
      ;(fileLoaderRule as webpack.RuleSetRule).exclude = /\.svg$/i
    }

    // Add a new rule to handle SVGs with @svgr/webpack
    webpackConfig.module?.rules?.push({
      test: /\.svg$/i,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgo: true,
            svgoConfig: {
              plugins: [
                {
                  name: 'removeViewBox',
                  active: false,
                },
              ],
            },
            titleProp: true,
          },
        },
      ],
    })

    return webpackConfig
  },
}
export default config

## @narratorai/the-sequel

> A sql editor and table React component built on Monaco Editor

![](https://github.com/narratorai/the-sequel/workflows/Semantic%20Release/badge.svg?branch=master)

This bundles in Monaco along with its web worker.

## Usage

This package is published privately to the `@narratorai` NPM organization. In order to use it, you will need to be part of our org and configure credentials on your machine. Once you've done that you will be able to install this package in your project:

`yarn add @narratorai/the-sequel`

## Development

### Setup

1. Clone this repo
2. Install dependencies with `yarn`

### Running Locally

There's a small test app in the `example` directory. From that directory run
`yarn start` and point your browser to `http://localhost:8886`

Run `yarn start` in the root directory for every change you make to the library. The example app will pick up the change and recompile

### Running in Portal Locally

If you want to run a local version in your local Portal
`yarn add file:../the-sequel` to install your local version over the NPM one
**just don't commit the changes to the package.json file!**

In portal for example:

```
From the-sequel after every change:
> yarn start

From portal-narrator after every change:
> yarn add file:../the-sequel && yarn start
```

### Portal Deploy Preview

Push a commit to the branch 'next'. We have a github action that will push up a .next version of the libraty to NPM. (e.g. @narratorai/the-sequel@4.5.0-next.1)

### Building

`yarn build` will build the package and put it in the `dist` directory for publishing. Normally you don't have to do this.

### Release

A new package version will be built and published from CI when the `master` branch is pushed to.

This project uses [`semantic-release`](https://github.com/semantic-release/semantic-release) to manage releases.

Please follow the [conventional commits spec](https://www.conventionalcommits.org/en/v1.0.0/#summary) for your commit messages for good hygiene, and to allow this tooling to work

## Notes on using `the-sequel`

### Workers

Monaco uses WebWorkers to keep most of its processing off the main thread. This presents some challenges with bundling loading. Generally, you'll want to define `window.MonacoEnviroment.getWorkerUrl` in your app, before loading `the-sequel`

In portal, this looks like:

```js
// Setup Monaco workers w/out webpack plugin
window.MonacoEnvironment = {
  getWorkerUrl: function (_, label) {
    // Handles loading workers locally in dev, or via cross-origin request to assets CDN otherwise
    const makeWorkerUrl = (url) => {
      if (build.env_label === 'development') {
        return url
      } else {
        return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
          importScripts('${url}');`)}`
      }
    }

    // NOTE Specific languages have workers that can be loaded, make sure they get into this list if we add more to the-sequel
    const languageLabels = ['json']
    if (languageLabels.includes(label)) {
      const workerUrl = require(`file-loader?esModule=false&outputPath=static/js/monaco&name=[name].[contenthash].[ext]!@narratorai/the-sequel/dist/${label}.worker.js`)
      return makeWorkerUrl(workerUrl)
    } else {
      // Otherwise load the main editor worker
      const workerUrl = require(`file-loader?esModule=false&outputPath=static/js/monaco&name=[name].[contenthash].[ext]!@narratorai/the-sequel/dist/editor.worker.js`)
      return makeWorkerUrl(workerUrl)
    }
  },
}
```

### Fonts

Monaco uses an icon font called `codicon`. We can't configure where a consumer loads this font from, so we upload it to S3 and make it available from our assets CDN, and configure out build to point there. Apps using `the-sequel` shouldn't need any configuration to find it.

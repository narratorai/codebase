![Test](https://github.com/narratorai/portal-narrator-next/workflows/Test/badge.svg)
![Cypress](https://github.com/narratorai/portal-narrator-next/workflows/Cypress/badge.svg)

## Getting Started

### Initial setup

1. Install `nvm` and update .profile to respect the .nvrmrc file
2. Git clone this repo and cd into it
3. Run `npm login` to access our private NPM packages
4. Run `yarn`
5. Set up and configure Doppler (see below)

### Doppler setup

0. Ensure an admin has added you to the `portal` project (ask @Mike N on Twist)
1. Find Doppler in the apps list in Google Workspace and create an account
2. Install the CLI: https://docs.doppler.com/docs/install-cli
3. Run `doppler login` in the root of the project
4. Paste the authentication code in the terminal window into the browser
5. Run `doppler setup`

### Development

```bash
doppler run --config preview -- yarn dev
```

For commands that also take params there's a more explicit form: `doppler run --command="yarn test --watch`
To add your own environment variables the command looks like `HOST=local.narrator.ai HTTPS=true doppler run yarn dev`

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Tests

Run once:

```bash
doppler run yarn test
```

Run in watch mode:

```bash
doppler run --command="yarn test --watch"
```

## Deployment

This project is deployed with Vercel

### Previews

Preview deploys are created for all pull requests.

- useful for collaborating on a feature, requesting feedback from the team, etc
- use **production** services and data
- should not be shared externally

### Nonprod

Merge to the `main` branch to deploy to the nonprod environment. A pull request will be automatically created to release changes to production.

- useful for testing and verifying functionality before release
- use **nonprod** services and data, isolated from production
- should not be shared externally

### Production

Merge a PR syncing from `main` to `production` to deploy to the production environment.

- use **production** services and data
- used by customers

### Monitoring

Errors and perf traces are sent to Sentry: https://sentry.io/organizations/narrator/issues/?project=5477517

User session monitoring is sent to LogRocket: https://app.logrocket.com/5nc1c7/portal

## Feature Flags

We are using Launch Darkly for feature flags with the general premise of testing in production and decoupling deploy from release.

Some guidelines:

1. Flags can only be used by components rendered within the `UserProvider` context
2. Use the `useFlags` hook to get flags, and access your flag via bracket notation `flags['my-flag']` in your components
3. Schedule time after _release_ to clean up

## Logrocket

We record user sessions with LogRocket. Among its many features, it obfuscates DOM text in its recordings. In order for text to appear, add a `data-public` attribute to any element.

### Potential for Data Breach

🚨 Adding the `data-public` attribute to an element that could contain sensitive data (or a parent element) would cause a **data breach**. Do _not_ copy this attribute freely, and ask first if you are unsure whether it is safe to apply.

## Cypress E2E Testing

See [`cypress/README.md`](./cypress/README.md) for details and instructions

## History

This project is the successor to [portal-narrator](https://github.com/narratorai/portal-narrator), which was built using create-react-app.

We decided to use Next.js for its improved developer experience, and to app server-rendering capabilities to portal.

## Next.js

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Examples](https://github.com/vercel/next.js/tree/master/examples) - many Next.js code examples

## React Hook Form Gotchas

This repo is currently transitioning from `react-final-form` (RFF) to `react-hook-form` (RHF).
There are some gotchas to be aware of in react-hook-form though:

- [setValue](https://react-hook-form.com/api/useform/setvalue) in `useEffect` should use flag `shouldValidate` to ensure accurate validation state.
- [unregister](https://react-hook-form.com/api/useform/unregister) should be used on fields that will be conditionally rendered. Otherwise you may get formErrors for field components that no longer exist (but their form value still does).
- [useFieldArray](https://github.com/react-hook-form/react-hook-form/issues/1564#issuecomment-875566912) doesn't behave consistently when mapping over fields, especially when there are nested array fields. For instance, using RHF's append will update the values (via `watch`), but will not update the fields length. It's best to `watch` the array values and map over them.
- [RFF's initialValues](https://stackoverflow.com/questions/54635276/react-final-form-set-initialvalues-from-props-form-state-resets-on-props-chang/58561524#58561524) behaves much differently then RHF's `defaultValues`. RFF will re-instantiate the whole form any time the `initialValues` updates (at top form level). RHF only sets the `defaultValues` when the form is instantiated (use `reset()` to update the whole form state).

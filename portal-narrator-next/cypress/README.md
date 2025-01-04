# Cypress E2E Tests

This folder sets up E2E tests for portal using [Cypress](https://www.cypress.io/)

To run/debug them interactively run `yarn cypress open`, or to just run them `yarn cypress run`

> NOTE: They will run against a local dev server by default. These tests can also be pointed at any deployment, ie in CI

## Test Guidelines

To start, see [this excellent introduction to Cypreess](https://docs.cypress.io/guides/core-concepts/introduction-to-cypress.html). In addition to this guide, here are some guidelines of our own:

1. Use `data-test` attributes as selectors over classname or other DOM matching
2. Don't add arbitrary waits to tests
3. Only run tests against specific test companies
4. Prefer creating resources per-run when possible, instead of re-using resources across runs
5. Try to avoid flaky tests, make them resilient to external changes
6. Coverage of happy paths is more important than every failure mode

## Environment Variables

These tests require some config to run. They'll be prefixed with `CYPRESS_`:

- see `.env.example` for the variables this needs (ask someone on the team if you need the values)
- please try to keep `.env.example` up to date as we add/remove these variables

To access the value within a test, you can use `Cypress.env('NAME')` (note: dont include the `CYPRESS_` prefix)

### Test User Credentials

A company user and company admin credentials are provided via environment variables. These accounts should have limited access in case they are leaked (ie, no `narrator` access)

Their passwords will expire, and this will this whole test suite to fail. When this happens, someone will have to:

- login manually to set a new password
- update the saved credentials in 1password ("opsnarrator test user" & "opsnarrator test admin" in the Shared vault)
- communicate it out to the team
- update the stored credentials in CI

## Running Tests

Locally, start the next dev server `yarn dev`, and in a new terminal run `yarn cypress open` or `yarn cypress run` depending on your needs. You can also set a base URL if you don't want to run against your local dev server like so: `CYPRESS_BASE_URL=https://portal-git-example-branch.dev.narrator.ai yarn cypress open`

to use doppler config: `CYPRESS_BASE_URL=https://portal-git-example-branch.dev.narrator.ai doppler run --config preview -- yarn cypress run`
and for our integrations: `CYPRESS_BASE_URL=https://portal-git-example-branch.dev.narrator.ai doppler run --config preview -- yarn cypress run --spec 'cypress/e2e/integration/**`

You can also manually invoke the CI action from any branch to any target URL. Go to the [Cypress action workflow](https://github.com/narratorai/portal-narrator-next/actions?query=workflow%3ACypress) and click the "run workflow" button in the section about the `workflow_dispatch` event trigger.

## CI

This test suite will run against every Vercel deployment triggered by GitHub, preview and production.

This is configured in `.github/workflows/cypress.yml`

Environment variables are stored in GitHub secrets @ https://github.com/narratorai/portal-narrator-next/settings/secrets/actions:

- they'll need to be updated whenever credentials are updated, see the note on "Test User Credentials" above
- the GitHub action won't have access to new variables by default, `.github/workflows/cypress.yml` will need to be updated to pass the secret as an environment variable

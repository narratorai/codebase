# narrator-auth0

This repo configures our auth0 tenants

## Sensitive

This repo controls a very sensitive aspect of our stack -- auth! Working here requires some special care. Deploying a bad change here _will_ impact users and can negatively affect Narrator's relationships and security posture

1. Always test in nonprod first
2. Deploy changes to production by merging PRs from `nonprod` to `master`
3. Automated tests go a very long way

### Environment Variables and AUTH0_KEYWORD_REPLACE_MAPPINGS

The deploy CLI can export sensitive information that we _do not want_ checked into this repo.

Additionally, we want to be able to provide different values per tenant.

For these, we use [AUTH0_KEYWORD_REPLACE_MAPPINGS](https://github.com/auth0/auth0-deploy-cli/blob/master/examples/directory/README.md#environment-variables-and-auth0_keyword_replace_mappings) in our config, as well as environment variables.

#### Doppler

This project is set up to use Doppler for secrets management. Please see the [Doppler auth0 project](https://dashboard.doppler.com/workplace/902e00ae71bccbb97cc7/projects/auth0) for more details and setup instructions.

The import/export commands are pre-wired to use doppler and assume you have the doppler CLI installed and access to the above project.

## Workflow

1. Make changes in the `nonprod` branch to deploy to nonprod tenant
2. Manually verify and/or write automated tests
3. Open a PR from `nonprod` to `master`
4. Merge to `master` to deploy to production tenant

> NOTE: Making changes in the auth0 UI will _not_ be reflected here, and deploys from this repo will overwrite any changes make in the UI, and delete any resources not present here!!!

To pull in changes made from the UI run: `yarn pull:nonprod` or `yarn pull:production`

You will need a config file in order to run this locally. Talk to an infra team member to get one.

> NOTE: Be _extremely_ careful doing this, use git diff very closely -- you will need to restore all REPLACE_MAPPINGS in the config files and ensure that no new secrets get checked in.

## Auth0 Integration

See more details on this integration at https://auth0.com/docs/extensions/github-deploy

The _`nonprod`_ branch is meant to deploy to _nonprod_

The _`master`_ branch is meant to deploy to _production_

## Operations

Logs are streaming to CloudWatch: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logStream:group=auth0;streamFilter=typeLogStreamPrefix

https://auth0.com/docs/logs#log-data-event-listing

See #auth in slack for notifications

See #auth0-alerts in slack for auth0 service outage notifications

### Pulling changes in from the auth0 UI

The auth0 deploy CLI can pull changes down. Unfortunately, it wont preserve any of the work we do in this repo to templatize our config and keep secrets from being checked in.

That said, if you make changes to via the UI, they will get blown away on the next deploy. If you want to see how to update our config to match your changes, run:

```
yarn pull:nonprod
```

or

```
yarn pull:production
```

Find your changes, apply them in `config/` and proceed as normal. Do NOT check in the `imported/<stage>` you pulled down! There will always be differences between the imported config and our committed config here

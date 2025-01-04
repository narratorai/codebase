# Graph

This project is a GraphQL layer using [Hasura](https://hasura.io/) on top of PostgreSQL, with supporting tooling!

## Key Information

The Hasura console is where we define our schema, relations, and permissions -- with the benefit of keeping track of changes via migrations. This is why we don't deploy it anywhere -- we need to check in those migrations!

This repo contains multiple sub-projects:

- `infra` - CDK app to provision and deploy
- `codegen` - ouptputs GraphQL schema and type definitons for other apps consuming this Graph

See each of their READMEs for more information

## Getting Started

You can run your own Hasura instance and console locally using Docker

```sh
# Install hasura CLI
curl -L https://github.com/hasura/graphql-engine/raw/stable/cli/get.sh | bash

# Install project dependencies
yarn install

# Start up the database and GraphQL layer
docker compose up

# Set up the db
./scripts/run_migrations.sh

# Bring up a Hasura console
yarn hasura console
```

To quit, hit `control+c`. To tear down the local setup, run `docker compose down`.

To remove any data thats been persisted locally, run `docker volume rm graph_db_data`.

## Getting Data onto your local DB

> make sure you're on the Corp VPN for these to work!

### DB Sync

The `sync_db` script will do an incremental sync from a remote DB to your local

<details>
  <summary>Setup details</summary>
  
  This script uses [`pgsync`](https://github.com/ankane/pgsync), a ruby library (sorry!)

If you don't have a recent version of ruby installed, run:

```bash
brew install ruby
```

Then, install bundler:

```bash
gem install bundler
```

Finally, run bundler to install `pgsync` and its dependencies:

```bash
bundle install
```

</details>

```bash
# Sync prod to local
./scripts/sync_db.sh

# Init a new instance locally and sync from prod
INIT=1 ./scripts/sync_db.sh
```

##### Config

The `.pgsync.yml` file will need to be updated as our DB schema changes in order to keep this sync happy:

Any new tables that have company specific rows should:

1. be added to the top-level `exclude` config
2. be added to the `groups.company` config with a where clause specifying how to select only onen company's rows by slug

### Full DB Dump

<details>
  <summary>Setup details</summary>
  
  You might have to do the following for this to work:

If `pg_dump` is < version 11:

```bash
brew upgrade postgresql
```

If you're having aws issues:

```bash
brew upgrade awscli
```

If you see "jq: command not found" when running scripts

```bash
brew install jq
```

</details>

The `run_from_remote` script will destroy your local instance, including all of its data, dump a remote DB locally, and start a fresh instance locally with that data.

```bash
# Non Prod:
./scripts/run_from_remote.sh

# Prod:
./scripts/run_from_remote.sh production
```

After running this command, you can run `yarn hasura console` to log into your local instance's console

> NOTE: This script caches the DB dump. You will need to `rm .tmp/dbexport.sql` in order to get a fresh copy of the db

## Auth

Our Hasura servers are set up with an admin secret as well as JWT authentication.

### Admin Secret

**Please be extremely careful with these**, as they grant full read/write access to the DB and metadata. They are rotated periodically, but our production secret getting leaked even for a day would be very bad.

We generate them automatically during deployment and store them in AWS Secrets Manager. Scripts will pull them in for you as necessary for local operations against deployments. Your local instance will not have an admin secret set.

### JWTs

The server allows GraphQL operations with a JWT token containing the right claims:

- `admin` allows only internal users to log in and scopes their permissions based on Google Group membership **\_(**TODO** -- currently anyone with a @narrator.ai email is an unrestricted Admin)**
- `portal` allows any user that exists in the Graph to login and scopes their access and permissions based on Company User access **(**TODO** -- currently portal users can't get to Graph!)**

Permissions rules are configured in the Hasura console, and are mostly lagic around claims set in the JWT.

## Migrations

It is critical that we track all DDL changes and Hasura metadata via migrations. See https://docs.hasura.io/1.0/graphql/manual/migrations/reference/how-it-works.html for details.

When running locally you can test any changes you want. By using Hasura's migrations feature, migration files will be output to your file system under the migrations directory. These should be checked in, and will be run during deployments.

**Importantly** migrations should be checked in separately from application changes.
_(We don't check for this yet, but I think a commit hook would be able to catch this)_

## Deployment

This project is deployed with [CDK](https://github.com/aws/aws-cdk). It provisions and deploys:

- Postgres via RDS
- Containerized server via ECS
- Load Balancing via ALB
- DNS via Route53

And more! See the `infra` directory for more.

## Triggers

Hasura provides a robust event trigger system for notifications on CRUD operations. See https://hasura.io/docs/1.0/graphql/manual/event-triggers/index.html for more details.

This project is configured with environment variables that can be used to route events through our AWS Acconunt on an EventBridge bus

- [Flavortown graph-event-ingest project](https://github.com/narratorai/flavortown/tree/master/services/graph-event-ingest)
- [Production graph events bus](https://console.aws.amazon.com/events/home?region=us-east-1#/eventbus/graph-events-production)
- [Example lambda subscription to the graph event bus](https://github.com/narratorai/flavortown/blob/master/services/graph-emailer/serverless.yml#L46-L57)

A couple notes:

- Use `GRAPH_TRIGGER_INGEST_URL` from env as the webhook url
- Set a `x-api-key` header from the `GRAPH_TRIGGER_INGEST_API_KEY` env var
- Trigger config is deployed/checked in just like migrations

## CI/CD

**TODO**

- Everything

## Postgres Audit

Our schema is set up with a trigger to record any changes to the audit schema. If you create a new table, you should consider enabling auditing on it.

**(**TODO**: Figure out what to do with the audit data)**

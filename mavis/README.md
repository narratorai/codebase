# mavis

## Getting Started

This project uses `pyenv` to manage Python versions. The required version is specified in the `.python-version` file.

### Prerequisites

Ensure you have `pyenv` installed and configured:

- [pyenv Installation Guide](https://github.com/pyenv/pyenv#homebrew-in-macos)
- [pyenv Configuration Guide](https://github.com/pyenv/pyenv#basic-github-checkout)

```sh
brew install pyenv
echo 'eval "$(pyenv init -)"' >> ~/.zshrc

pyenv install
```

### Installation steps

```sh
# Install Xcode Command Line Tools
xcode-select --install

# Clone the repo
git clone git@github.com:narratorai/mavis.git

# Install libsodium and link it for pyenv
brew install libsodium
ln -s /opt/homebrew/lib ~/lib

# Install python dependencies
pip install -r requirements-dev.txt

# Set Up Git Commit Hooks. Run once after installing pip dependencies.
pre-commit install -t pre-commit -t pre-push
```

## Table of Contents

- [Installing pyodbc](#installing-pyodbc)
- [Shell setup](#shell-setup)
- [Virtual environments](#virtual-environments)
- [Unit Tests](#unit-tests)
- [Local Docker commands](#local-docker-commands)
- [CloudFormation](#cloudformation)
- [Secrets](#secrets)
- [Batch Jobs](#batch-jobs)
- [Graph](#graph)
- [Debugging](#debugging)

## Installing pyodbc

To connect to SQL Server, you need to install a driver manager and a SQL Server ODBC driver.

```sh
brew install unixodbc
brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release
HOMEBREW_ACCEPT_EULA=Y brew install msodbcsql18 mssql-tools18
```

## Shell setup

(Optional) You can add helpful shortcuts by modifying your `.zshrc` file.

```sh
function mavis_run {
  STAGE=local doppler run -c production_us --preserve-env --command="bin/mavis $1 $2 ${@:3}"
}
```

## Virtual Environment

Run `./bin/setup_venv` whenever the `.python-version` file is updated to create your venv.

Activate the virtual environment with `source venv/bin/activate` whenever you're working on this project

With the venv activated, run `pip install -r requirements-dev.txt` to install dependencies

## Unit Tests

Mavis uses `pytest` for unit tests. Tests live in the `tests` directory. Run all tests by executing

```sh
./bin/run_test
```

_Note:_ **Running `pytest` or `python -m pytest` directly will not work**! Any arguments to the `run_test` script are
passed through to `pytest`.

Some example invocations:

- `./bin/run_test --cov=core --cov=batch_jobs --junit-xml=junit.xml` for a run with coverage
- `./bin/run_test -m 'not slow'` to exclude tests that are marked slow
- `./bin/run_test tests/utils_test.py` to run a specific test suite

Unit tests run with no credentials, so it is not possible to call graph, etc. See `test/conftest.py` for available
fixtures, mocks, and useful patterns.

## Local Docker commands

_Note:_ All run from the root directory.

```sh
# Build the image locally
docker buildx build . -t mavis:<tag>

# Drop into an interactive shell
docker run --rm -it mavis:<tag> /bin/sh

# Run a script
docker run \
  --rm -it \
  --name <my-task-name> \
  mavis:<tag> \
  <command, ie python scripts/go.py>
```

### Seeding the build cache

If you haven't run a build locally recently and don't want to wait 40 minutes, you can add
`--cache-from 479493230127.dkr.ecr.us-east-1.amazonaws.com/mavis:master` to a `docker build` invocation.

This will speed up builds from ~40 to < 1 minute by leveraging the latest `master` image as a seed for build cache

- this requires that you've pulled the latest from ECS. See the "ECS and Builds" section below
- once you've done this once, you should remove it local build commands to resume using your local cache

### Mounting local src or AWS credentials

For `docker run` commands you can add:

> NOTE: Don't do anything like this for non-dev purposes

- `-v "$PWD":/app` to mount your local repo over the one built into the image
- `-v "$HOME/.aws":/app/.aws` to provide your local AWS credentials to the image

### ECS and Builds

We run every commit and PR through CodeBuild to build an image. It will be tagged with a SHA, branch name, or PR label.
If you need to interact with these builds locally, these commands should help:

```sh
# Login to ECS
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 479493230127.dkr.ecr.us-east-1.amazonaws.com

# Pull a build
docker pull 479493230127.dkr.ecr.us-east-1.amazonaws.com/mavis:<tag>
```

Where tag will be something like:

- `sha-7b4960c3` (built on every commit)
- `master` (this is used for production)
- `pr-<pr number>` (built on every update to a PR)

Once you've pulled an image from ECR, you can run it locally using `docker run` as above, replacing `mavis:<tag>` with `479493230127.dkr.ecr.us-east-1.amazonaws.com/mavis:<tag>`

## Secrets

All secrets are provided by [doppler](https://doppler.com).

### Running Locally with Secrets

You have two options to run the project: inject doppler secrets into your environment, or you can run it in Docker using the following command:

```sh
# WARNING: This runs with your personal AWS credentials mounted!!
docker run \
  --rm -it \
  -v "$HOME/.aws":/app/.aws \
  -v "$PWD:/app" \
  -e 'STAGE=production' \
  -e 'BUCKET_DIRECTORY=prod' \
  -e 'COMPANY_SLUG=narrator' \
  -e 'ENV=development' \
  479493230127.dkr.ecr.us-east-1.amazonaws.com/mavis:master exec mavis -- ./bin/mavis batch_jobs/v2/some_job.py --script-args --id 123
```

### Client Data

Client data is output to S3. Buckets are provisioned in the `client-resources` stack based on company config.

A S3 bucket is created for each company as `narratorai-mavis-<company_slug>` and set up as a **client data bucket**,
with configuration like:

- object versioning, access logging, lifecycle management, notifications to `FileNotificationsTopic`
- bucket default encryption (using the `ClientSecretsKey` created by the `shared-infra` stack), policies to enforce security requirements, tagging

## Batch Jobs

Batch jobs are functions that can be executed in a background worker. This worker is powered by [dramatiq](https://dramatiq.io) and uses a Redis instance as the broker.

To run the worker locally, use the following command:

```sh
doppler run -- dramatiq batch_jobs.main -p 3
```

To run a single batch job, execute the following command:

```sh
doppler run -- mavis_run narratorclient batch_jobs/v2/portal_processing/create_dataset.py
```

Note that doppler is required to provide the environment variables required to run the service.

## Graph

Mavis uses graph extensively. The connection is configured in a slightly obscure way. To establish a connection, we need to set the `GRAPH_DOMAIN`` environment variable to point at the service, this is provided by doppler.

Additionally, we obtain a Machine to Machine (M2M) token from Auth0, which the Hasura instance can verify.

The graph client where all this happens is located in `core/graph/__init__.py`

### Queries

All GraphQL operations should live in `core/graph/queries` as `.graphql` files.

To run one:

```python
from core.graph import sync_client

result = sync_client.query_name(some_arg="awesome")
```

### Codegen

If you take a look at the `graph/queries/sync_client` directory, you'll notice something magical happening. There are several Python files that match each query. This is all thanks to the power of :sparkles: Pydantic :zap:. Please run

```sh
./scripts/graph_codegen.sh production
```

whenever you modify a `.graphql` file and check the changes in.

> It's worth noting that the autogenerated classes may change without the queries changing, as they are based on the Graph schema and the queries.

Note: There is a known issue. Revert the changes to `core/graph/sync_client/input_types.py`

## Debugging

### Debugging dramatiq

Use `remote_pdb` to debug a dramatiq worker.

```sh
PYTHONBREAKPOINT=remote_pdb.set_trace doppler run -c dev --preserve-env -- dramatiq batch_jobs.main -p 1
```

Then connect to the start process using `telnet`. You can start an ipython console with `from IPython import embed; embed()`

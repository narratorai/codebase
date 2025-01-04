# mavis-api

This mavis sub-project is a [FastAPI](https://fastapi.tiangolo.com) application meant to expose user-facing endpoints. It is deployed to Lambda as a monolambda: one lambda serves all routes of this application.

### FastAPI + Lambda Notes

- FastAPI background jobs are not supported in this setup -- use mavis events and triggers!
- It could be possible to support websockets, but that has not been explored

### Running locally

See the root README for virtual env setup. In an active venv you can:

Install dev dependencies:
- `pip install --upgrade -r requirements-dev.txt`

Run a local dev server:
- `./bin/run_local`

See http://localhost:8000/docs or http://localhost:8000/redoc for API documentation


#### Environment Variables

You may need some env vars to run locally. See the `.env.example` file and make your own `.env` -- do not check it in!

See `core/models/settings` for env variables mavis uses

### Deploying
Since this is a lambda we deploy it from the lambda_services/api directory, not here

- `cd lambda_services/api`
- `yarn sls deploy --stage production`

### TODO
- Explore deploying as an API Gateway HTTP API
- Export OpenAPI schema for use outside of dev server

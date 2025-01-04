# Multi-stage build that outputs a few different images:
# 479493230127.dkr.ecr.us-east-1.amazonaws.com/mavis
# 479493230127.dkr.ecr.us-east-1.amazonaws.com/mavis-worker
# 479493230127.dkr.ecr.us-east-1.amazonaws.com/mavis-heartbeat

ARG WORKDIR="/app"

# Included by our CI process
ARG BUILD_LABEL
ARG BUILD_REVISION

# Python env setup
# NOTE the python version in .python-version will be passed as a build-arg by CI
ARG PYTHON_VERSION="3.11.9"

# Automatically included by buildx build
ARG TARGETPLATFORM

FROM python:${PYTHON_VERSION}-slim-bookworm as base-image

ENV TZ=UTC
ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DEBIAN_FRONTEND=noninteractive

# Install runtime dependencies
RUN apt-get -qq update && \
    apt-get -y upgrade && \
    apt-get -y -qq --no-install-recommends install curl gnupg2 git libsodium23 jq zip unzip mime-support htop vim procps

# Install Terraform
RUN curl -fsSL "https://releases.hashicorp.com/terraform/1.8.0-beta1/terraform_1.8.0-beta1_linux_amd64.zip" -o /tmp/terraform.zip && \
    unzip /tmp/terraform.zip -d /usr/local/bin && \
    rm /tmp/terraform.zip

# Install ODBC driver for SQL Server, also install kerberos library for debian-slim distributions
RUN curl -sSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor | tee /usr/share/keyrings/microsoft-prod.gpg
RUN curl https://packages.microsoft.com/config/debian/12/prod.list | tee /etc/apt/sources.list.d/mssql-release.list
RUN apt-get -qq update
RUN ACCEPT_EULA=Y apt-get install -y -qq msodbcsql18 mssql-tools18 unixodbc-dev libgssapi-krb5-2

# Upgrade pip and wheel
RUN pip install --no-cache-dir -U wheel pip

# --------------------------------------
# Multi-stage build: Stage to separate the build environment from the final image to reduce its size.
# --------------------------------------
FROM base-image as build-image

ARG WORKDIR
ENV HOME=${WORKDIR}
WORKDIR ${WORKDIR}

# Install build dependencies
RUN apt-get -qq update && \
    apt-get -y upgrade && \
    apt-get -y -qq --no-install-recommends install gcc libffi-dev libpq-dev python3-dev

# Optimize Cython during pip install
ENV CFLAGS="-g0 -Wl,--strip-all"
ENV CPPFLAGS="-I/usr/include:/usr/local/include"
ENV LDFLAGS="-L/usr/lib:/usr/local/lib"

# Upgrade pip and wheel
RUN pip install --no-cache-dir -U wheel pip

# Install requirements
COPY requirements.txt requirements.txt
RUN pip install poetry
RUN pip install --no-cache-dir --no-build-isolation -r requirements.txt

# --------------------------------------
# Multi-stage build: Web app image
# --------------------------------------
FROM base-image as app

ARG WORKDIR
ENV HOME=${WORKDIR}
WORKDIR ${WORKDIR}

# Create app user
RUN useradd -m app

# Copy dependencies from the build-image to this image
COPY --chown=app --from=build-image /usr/include /usr/include
COPY --chown=app --from=build-image /usr/lib /usr/lib
COPY --chown=app --from=build-image /usr/local/include /usr/local/include
COPY --chown=app --from=build-image /usr/local/lib /usr/local/lib
COPY --chown=app --from=build-image /usr/local/bin /usr/local/bin
COPY --chown=app . .

# Set build env vars
ARG BUILD_LABEL
ENV BUILD_LABEL=$BUILD_LABEL

ARG BUILD_REVISION
ENV BUILD_REVISION=$BUILD_REVISION

ARG TARGETPLATFORM
ENV BUILD_ARCH=$TARGETPLATFORM

# Set OpenTelemetry service name
# NOTE: This is a workaround, as setting the OTEL_SERVICE_NAME env var in the code is not recognized by the SDK
ARG OTEL_SERVICE_NAME
ENV OTEL_SERVICE_NAME=${OTEL_SERVICE_NAME}
ENV HONEYCOMB_DATASET=${OTEL_SERVICE_NAME}

# Run as app user, not root
USER app

EXPOSE 8000

CMD ["uvicorn", "core.api.main:app", "--workers", "8", "--port", "8000", "--timeout-graceful-shutdown", "300", "--proxy-headers", "--host", "0.0.0.0", "--loop", "asyncio"]


# --------------------------------------
# Multi-stage build: dramatiq worker image
# --------------------------------------
FROM base-image as worker

ARG WORKDIR
ENV HOME=${WORKDIR}
WORKDIR ${WORKDIR}

# Create dramatiq user
RUN useradd -m dramatiq

# Copy dependencies from the build-image to this image
COPY --chown=dramatiq --from=build-image /usr/include /usr/include
COPY --chown=dramatiq --from=build-image /usr/lib /usr/lib
COPY --chown=dramatiq --from=build-image /usr/local/include /usr/local/include
COPY --chown=dramatiq --from=build-image /usr/local/lib /usr/local/lib
COPY --chown=dramatiq --from=build-image /usr/local/bin /usr/local/bin
COPY --chown=dramatiq . .

# Set build env vars
ARG BUILD_LABEL
ENV BUILD_LABEL=$BUILD_LABEL

ARG BUILD_REVISION
ENV BUILD_REVISION=$BUILD_REVISION

ARG TARGETPLATFORM
ENV BUILD_ARCH=$TARGETPLATFORM

# Set OpenTelemetry service name
# NOTE: This is a workaround, as setting the OTEL_SERVICE_NAME env var in the code is not recognized by the SDK
ARG OTEL_SERVICE_NAME
ENV OTEL_SERVICE_NAME=${OTEL_SERVICE_NAME}
ENV HONEYCOMB_DATASET=${OTEL_SERVICE_NAME}

# Dramatiq specific env var. Set it to the number of threads.
# https://github.com/Bogdanp/dramatiq/issues/392
ENV dramatiq_queue_prefetch=40

# Run as dramatiq user, not root
USER dramatiq

# Spins up 1 processes with 60 worker threads per process. (testing this to ensure processes are managed)
# Gracefully shuts down after 5 minutes, k8s is configured to kill the pod after 320 seconds
CMD ["opentelemetry-instrument", "dramatiq", "batch_jobs.main", "--worker-shutdown-timeout", "300000", "--processes", "1", "--threads", "60"]


# --------------------------------------
# Multi-stage build: heartbeat image
# --------------------------------------
FROM base-image as heartbeat

ARG WORKDIR
ENV HOME=${WORKDIR}
WORKDIR ${WORKDIR}

# Create heartbeat user
RUN useradd -m heartbeat

# Copy dependencies from the build-image to this image
COPY --chown=heartbeat --from=build-image /usr/include /usr/include
COPY --chown=heartbeat --from=build-image /usr/lib /usr/lib
COPY --chown=heartbeat --from=build-image /usr/local/include /usr/local/include
COPY --chown=heartbeat --from=build-image /usr/local/lib /usr/local/lib
COPY --chown=heartbeat --from=build-image /usr/local/bin /usr/local/bin
COPY --chown=heartbeat . .

# Set build env vars
ARG TARGETPLATFORM
ENV BUILD_ARCH=$TARGETPLATFORM

# Set OpenTelemetry service name
# NOTE: This is a workaround, as setting the OTEL_SERVICE_NAME env var in the code is not recognized by the SDK
ARG OTEL_SERVICE_NAME
ENV OTEL_SERVICE_NAME=${OTEL_SERVICE_NAME}
ENV HONEYCOMB_DATASET=${OTEL_SERVICE_NAME}

# Run as heartbeat user, not root
USER heartbeat

CMD ["python", "-m", "heartbeat.main"]

# --------------------------------------
# Multi-stage build: mavis worker bouncer
# --------------------------------------
FROM base-image as mavis-worker-bouncer

ARG WORKDIR
ENV HOME=${WORKDIR}
WORKDIR ${WORKDIR}

# Create heartbeat user
RUN useradd -m bouncer

# Copy dependencies from the build-image to this image
COPY --chown=bouncer --from=build-image /usr/include /usr/include
COPY --chown=bouncer --from=build-image /usr/lib /usr/lib
COPY --chown=bouncer --from=build-image /usr/local/include /usr/local/include
COPY --chown=bouncer --from=build-image /usr/local/lib /usr/local/lib
COPY --chown=bouncer --from=build-image /usr/local/bin /usr/local/bin
COPY --chown=bouncer . .

# Set build env vars
ARG TARGETPLATFORM
ENV BUILD_ARCH=$TARGETPLATFORM

# Set OpenTelemetry service name
# NOTE: This is a workaround, as setting the OTEL_SERVICE_NAME env var in the code is not recognized by the SDK
ARG OTEL_SERVICE_NAME
ENV OTEL_SERVICE_NAME=${OTEL_SERVICE_NAME}
ENV HONEYCOMB_DATASET=${OTEL_SERVICE_NAME}

USER bouncer
CMD ["python", "-m", "mavis_worker_bouncer.main"]

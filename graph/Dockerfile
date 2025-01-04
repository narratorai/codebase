FROM hasura/graphql-engine:v2.44.0-ce as hasura

ENV TZ=UTC
ENV LANG=C.UTF-8 LC_ALL=C.UTF-8

# Accept MS ODBC driver terms non-interactively
# https://aka.ms/odbc17eula
ENV ACCEPT_EULA=Y

# Install system updates and add:
# - jq for entrypoint
# - curl for healhcheck
RUN apt-get update -y && \
    apt-get upgrade -y && \
    apt-get install --no-install-recommends -y jq curl && \
    apt-get -y auto-remove && \
    apt-get -y clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/doc/ /usr/share/man/ /usr/share/locale/

# Default start script
CMD ["graphql-engine", "serve"]

// Provides hasura claims using organization access
const _ = require('lodash');
const { GraphQLClient } = require('graphql-request');
const { AuthenticationClient } = require('auth0');

/**
 * Handler that will be called during the execution of a PostLogin flow.
 * See https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/event-object and https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/api-object for API definitions
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  if (!global.Sentry && event.secrets.SENTRY_DSN) {
    global.Sentry = require('@sentry/node');
    global.Sentry.init({
      dsn: event.secrets.SENTRY_DSN,
      environment: '##ENV##',
    });
  }

  if (global.Sentry) {
    global.Sentry.setUser({
      email: event.user.email,
      ip_address: event.request.ip,
    });
  }

  if (!global.authClientGraph) {
    global.authClientGraph = new AuthenticationClient({
      domain: '##CUSTOM_TENANT_DOMAIN##',
      clientId: '##GRAPH_MGMT_CLIENT_ID##',
      clientSecret: event.secrets.GRAPH_MGMT_CLIENT_SECRET,
    });
  }

  // Get an admin token so that we can query graph
  // And cache it across invocations
  const getTokenGraph = async () => {
    const token = api.cache.get('GRAPH_ADMIN_TOKEN');
    if (token?.value) {
      return token.value;
    }

    const res = await global.authClientGraph.clientCredentialsGrant({
      audience: 'graph_narrator',
    });
    api.cache.set('GRAPH_ADMIN_TOKEN', res.access_token, {
      ttl: 15 * 60 * 1000,
    });
    return res.access_token;
  };

  try {
    const GRAPH_URL = 'https://##GRAPH_DOMAIN##';
    const CLAIMS_NAMESPACE = 'https://graph.narrator.ai/claims';
    const NULL_COMPANY_ID = '00000000-0000-0000-0000-000000000000';

    const INTERNAL_ADMIN_USER_ROLE = 'internal_admin';

    const COMPANY_FRAGMENT = `
      fragment AuthCompanyFragment on company {
        id
        slug
        auth0 {
          id
          org_id
          connection_id
          enforce_sso
          disable_sso
          assign_membership_on_login
        }
      }
    `;

    const COMPANY_USER_FRAGMENT = `
      fragment AuthCompanyUserFragment on company_user {
        id
        role
        from_sso
        user {
          id
          email
          role
        }
        company {
          ...AuthCompanyFragment
        }
      }
    `;

    const AUTH_USER_QUERY = `
      query Auth0ClaimsActionGetUser($email: String!) {
        user(where: {email: { _eq: $email }}, limit: 1) {
          id
          role
          company_users {
            ...AuthCompanyUserFragment
          }
        }
      }

      ${COMPANY_FRAGMENT}
      ${COMPANY_USER_FRAGMENT}
    `;

    const AUTH_COMPANY_QUERY = `
      query Auth0ClaimsActionGetCompany($slug: String!) {
        company(where: {slug: { _eq: $slug }}, limit: 1) {
          ...AuthCompanyFragment
        }
      }

      ${COMPANY_FRAGMENT}
    `;

    const AUTH_USER_INSERT_MUTATION = `
      mutation Auth0CreateCompanyUserFromInitialSSOLogin($objects: [company_user_insert_input!]!) {
        insert_company_user(
          objects: $objects,
          on_conflict: {constraint: company_user_company_id_user_id_key, update_columns: [updated_at, from_sso]}
        ) {
          affected_rows
          returning {
            ...AuthCompanyUserFragment
          }
        }
      }

      ${COMPANY_FRAGMENT}
      ${COMPANY_USER_FRAGMENT}
    `;

    const token = await getTokenGraph();
    const client = new GraphQLClient(`${GRAPH_URL}/v1/graphql`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const accessCompanySlug = event.organization?.name;

    // Resolve the user
    const authUserResponse = await client.request(AUTH_USER_QUERY, {
      email: event.user.email,
    });

    let graphUser = authUserResponse?.user?.[0];

    // Resolve the company
    const authCompanyResponse = accessCompanySlug
      ? await client.request(AUTH_COMPANY_QUERY, {
          slug: accessCompanySlug,
        })
      : null;

    let graphCompany = authCompanyResponse?.company?.[0];
    const graphCompanyFound =
      !!graphCompany?.id && !!graphCompany?.auth0?.org_id;

    // Resolve the company user
    let accessCompanyUser = accessCompanySlug
      ? graphUser?.company_users?.find(
          (cu) => cu.company.slug === accessCompanySlug
        )
      : null;

    let graphUserFound = !!graphUser?.id;
    if (graphUser?.role !== 'internal_admin') {
      // Ensure that a non-super admin has a company user for the company they are logging in to
      graphUserFound = graphUserFound && !!accessCompanyUser?.id;
    }

    if (!graphUserFound) {
      if (
        graphCompanyFound &&
        graphCompany.auth0.connection_id &&
        graphCompany.auth0.assign_membership_on_login &&
        graphCompany.auth0.connection_id === event.connection.id
      ) {
        // Handle SSO user first time login
        // Create the user and/or company user
        const createUserResponse = await client.request(
          AUTH_USER_INSERT_MUTATION,
          {
            objects: [
              {
                user: {
                  data: {
                    email: event.user.email,
                  },
                  on_conflict: {
                    constraint: 'user_email_key',
                    update_columns: ['updated_at'],
                  },
                },
                company_id: graphCompany.id,
                from_sso: true,
              },
            ],
          }
        );

        // Reset these variables, which would have been null before the above mutation
        accessCompanyUser =
          createUserResponse?.insert_company_user?.returning?.[0];

        graphUser = accessCompanyUser?.user;
        graphCompany = accessCompanyUser?.company;
        graphUserFound = !!graphUser?.id;
      } else {
        // If the graph user does not exist, and this is not a first time SSO login, deny access
        // https://auth0.com/docs/rules/examples#deny-access-based-on-a-condition
        throw new Error('User not found');
      }
    }

    if (global.Sentry) {
      global.Sentry.setUser({
        id: graphUser.id,
        email: event.user.email,
        ip_address: event.request.ip,
      });
    }

    const defaultRole =
      graphUser.role === INTERNAL_ADMIN_USER_ROLE ? 'admin' : 'user';
    const allowedRoles =
      graphUser.role === INTERNAL_ADMIN_USER_ROLE
        ? ['admin', 'user']
        : ['user'];

    const customClaims = {
      'x-hasura-default-role': defaultRole,
      'x-hasura-allowed-roles': allowedRoles,
      'x-hasura-user-id': graphUser.id,
    };

    if (accessCompanySlug && accessCompanyUser) {
      // Set the company-id claim to the company matching the access scope
      customClaims['x-hasura-company-id'] = accessCompanyUser.company.id;
    } else {
      // Set the company-id claim to the null company id so Hasura's permissions system does not explode
      customClaims['x-hasura-company-id'] = NULL_COMPANY_ID;
    }

    if (!event.user.app_metadata.id) {
      // Put the graph user id on the app metadata
      api.user.setAppMetadata('id', graphUser.id);
    }

    if (!event.user.user_metadata.id) {
      // Put the graph user id on the user metadata
      api.user.setUserMetadata('id', graphUser.id);
    }

    // TODO assign roles for internal users based on GSuite Groups!
    // if (context.connection === 'GSuiteInternal' && !user.archived && !user.suspended) {
    //   // TODO
    //   // - determine role based on google group membership? Or maybe something else? My user.groups looks like:
    //   //    "groups": [
    //   //      "Admin",
    //   //      "Alerts",
    //   //      "Contact",
    //   //      "Engineering",
    //   //      "Founders",
    //   //      "Operations",
    //   //      "Security"
    //   //    ],
    //   // - create internal roles and permissions in hasura, map group membership to default-role and allowed-roles?
    // }

    // TODO handle other user roles:
    // - internal_user
    // - service

    // Finally, set Hasura Role and User Id Claims
    api.accessToken.setCustomClaim(CLAIMS_NAMESPACE, customClaims);
  } catch (err) {
    if (global.Sentry) {
      global.Sentry.configureScope((scope) => {
        scope.setTag('rule', 'add-org-hasura-claims');
        global.Sentry.captureException(err);
      });
    }
    console.error(err);
    api.access.deny('Unauthorized');
  }
};

/**
@param {object} client - information about the client
@param {string} client.name - name of client
@param {string} client.id - client id
@param {string} client.tenant - Auth0 tenant name
@param {object} client.metadata - client metadata
@param {array|undefined} scope - array of strings representing the scope claim or undefined
@param {string} audience - token's audience claim
@param {object} context - additional authorization context
@param {object} context.webtask - webtask context
@param {function} cb - function (error, accessTokenClaims)
*/

module.exports = function (client, scope, audience, context, cb) {
  var access_token = {};
  access_token.scope = scope;

  // For M2M credentials generated for graph, give them service claims
  if (audience === 'graph_narrator') {
    // TODO switch this to an actual service role, ideally `client.name` -- remove admin
    const GRAPH_SERVICE_ROLE = 'admin';
    const GRAPH_CLAIMS_NAMESPACE = 'https://graph.narrator.ai/claims';

    access_token[GRAPH_CLAIMS_NAMESPACE] = {
      'x-hasura-default-role': GRAPH_SERVICE_ROLE,
      // Allow service to query as a user also
      'x-hasura-allowed-roles': [GRAPH_SERVICE_ROLE, 'user'],
      'x-hasura-client-id': client.id,
      'x-hasura-client-name': client.name,
    };
  }

  cb(null, access_token);
};

// Add an ID to our JWTs so its possible to revoke them
// https://auth0.com/blog/blacklist-json-web-token-api-keys/
// https://auth0.com/docs/api-auth/blacklists-vs-grants#blacklists

function addJTI(user, context, callback) {
  user.jti = require('uuid').v4();
  callback(null, user, context);
}

# corp-network

This is a CDK project to provision Narrator's corp network resources.

> Note this project is intended to extend, and evntually replace [our shared-infra project](https://github.com/narratorai/shared-infra)

## Tailscale Relays

This projects deploys two Tailscale relays to allow VPN access to our private networks:
- mgmt-relay: allows access to the MGMT, NonProd, and Production VPCs
- client-data-relay: allows access to the ClientData VPC, and also allows traffic tunneling as an exit node

### Tailscale Operations

The pre-auth key that relays use expires every 90 days. A new one must be generated at https://login.tailscale.com/admin/authkeys, and the [`/infra/tailscale/server_key` SSM parameter](https://console.aws.amazon.com/systems-manager/parameters/infra/tailscale/server_key/description?region=us-east-1&tab=Table) must be updated.

When a relay instance is replaced, a few things need to happen in the Tailscale admin:
1. Go to https://login.tailscale.com/admin/machines?q=relay
2. Remove any relay machines that are no longer connected
3. New relays must have their key expiry disabled, subnet routes enabled, and exit node allowed (when the relay is configured for it, ie the client data relay)

It would be fantastic to automate these things, and may be possible to do so with the Tailscale API eventually. Right now, its not, so these things must be done on a schedule (key rotation), or when deployment of this project brings up new relay instances.

## Useful CDK commands

 * `yarn build`   compile typescript to js
 * `yarn watch`   watch for changes and compile
 * `yarn test`    perform the jest unit tests
 * `yarn cdk deploy`      deploy this stack to your default AWS account/region
 * `yarn cdk diff`        compare deployed stack with current state
 * `yarn cdk synth`       emits the synthesized CloudFormation template

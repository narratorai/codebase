# auth-infra

Provisions Certificates, CloudFront distros and Route53 records for Auth0 tenant custom domains

https://auth0.com/docs/custom-domains/set-up-cloudfront

## Useful commands

 * `yarn build`   compile typescript to js
 * `yarn watch`   watch for changes and compile
 * `yarn test`    perform the jest unit tests
 * `yarn cdk deploy`      deploy this stack to your default AWS account/region
 * `yarn cdk diff`        compare deployed stack with current state
 * `yarn cdk synth`       emits the synthesized CloudFormation template

## Auth0 Config

Config for each tenant domain is manually stored in SecretsManager with the structure:

```
{
  "domain": "string"
  "origin": "string"
  "key": "string"
}
```

Each tenant domain stack then points to the arn of the secret in `bin/auth-infra.ts`

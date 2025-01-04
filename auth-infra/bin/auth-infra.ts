#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { AuthInfraBase } from '../lib/auth-infra-base';
import { TenantCustomDomain } from '../lib/tenant-custom-domain';

const hostedZoneDomain = 'auth.narrator.ai'

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
}

const app = new cdk.App();
const base = new AuthInfraBase(app, 'auth-infra-base', {
    env,
    hostedZoneDomain
});

// Nonprod distro
new TenantCustomDomain(app, 'auth-infra-nonprod', {
  env,
  zone: base.zone,
  cert: base.cert,
  recordName: 'nonprod',
  auth0ConfigSecretArn: `arn:aws:secretsmanager:${env.region}:${env.account}:secret:/infra/nonprod/auth0-custom-domain-config-HpouoO`
})

// Production distro
new TenantCustomDomain(app, 'auth-infra-production', {
  env,
  zone: base.zone,
  cert: base.cert,
  auth0ConfigSecretArn: `arn:aws:secretsmanager:${env.region}:${env.account}:secret:/infra/production/auth0-custom-domain-config-pPtsW3`
})

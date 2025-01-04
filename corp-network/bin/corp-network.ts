#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CorpNetworkStack } from '../lib/corp-network-stack';

const app = new cdk.App();

new CorpNetworkStack(app, 'corp-network', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  tags: {
    tier: 'corp',

    // Vanta Inventory Tags
    VantaOwner: 'nason@narrator.ai',
    VantaDescription: 'VPN and Network Infrastructure for Employee Access',
    VantaContainsUserData: 'false',
  }
});

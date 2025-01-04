#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AssetsInfraStack } from "../lib/assets-infra-stack";

const app = new cdk.App();
const stack = new AssetsInfraStack(app, "AssetsInfraStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  tags: {
    VantaOwner: 'nason@narrator.ai',
    VantaDescription: 'Public and static assets infra',
    VantaContainsUserData: "false",
  }
});

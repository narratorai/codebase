import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import AuthInfra = require('../lib/auth-infra-base');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new AuthInfra.AuthInfraBase(app, 'TestStack', { hostedZoneDomain: 'test.narrator.ai' });
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
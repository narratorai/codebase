import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import AssetsInfra = require('../lib/assets-infra-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new AssetsInfra.AssetsInfraStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
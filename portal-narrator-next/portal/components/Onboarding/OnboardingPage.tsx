import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useMachine } from '@xstate/react'
import { Flex, Typography } from 'antd-next'
import { useState } from 'react'

import CompanyAddressCard from './CompanyAddressCard'
import { schema as companyAddressSchema } from './CompanyAddressForm'
import onboardingMachine from './machine'
import ManagerUsersCard from './ManagerUsersCard'
import OnboardingFooters from './OnboardingFooters'
import PaymentMethodCard from './PaymentMethodCard'
import SubscriptionPlanCard from './SubscriptionPlanCard'

const stripePromise = loadStripe(
  (process.env.NEXT_PUBLIC_STRIPE_KEY as string) || 'pk_test_aVtBDhKa3YmVX61d6Tys8yWl00o0nLXFNs'
)

function validateCompanyAddress(data?: Record<string, any>) {
  try {
    companyAddressSchema.parse(data)
    return true
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false
  }
}

export default function OnboardingPage() {
  const [current, send] = useMachine(onboardingMachine, {
    guards: {
      isCompanyAddressValid: (context) => validateCompanyAddress(context.companyAddress),
    },
  })
  const [features, setFeatures] = useState<unknown>({
    apiAccess: true,
    sso: true,
    integrations: true,
    dataTeamRequests: null,
  })

  return (
    <div style={{ background: '#f7f7f7' }}>
      <Flex align="center" justify="center" style={{ minHeight: '100vh', padding: '32px 0' }} vertical>
        <main>
          <Typography.Title level={1} style={{ marginBottom: '32px' }}>
            Start free 14-day Standard trial
          </Typography.Title>
          <Elements
            options={{
              mode: 'setup',
              currency: 'usd',
              setupFutureUsage: 'off_session',
              paymentMethodTypes: ['card', 'us_bank_account'],
            }}
            stripe={stripePromise}
          >
            <Flex gap={16}>
              {current.value == 'enteringCompanyAddress' && <CompanyAddressCard send={send} state={current} />}
              {current.value == 'invitingUsers' && <ManagerUsersCard send={send} state={current} />}
              {(current.value == 'enteringPaymentMethod' || current.value == 'success') && (
                <PaymentMethodCard send={send} state={current} subscriptionMetadata={{ features }} />
              )}
              {/* eslint-disable-next-line react/jsx-max-depth */}
              <SubscriptionPlanCard onFeaturesChange={setFeatures} />
            </Flex>
          </Elements>
        </main>
        <OnboardingFooters />
      </Flex>
    </div>
  )
}

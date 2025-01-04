import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { App, Button, Card, Flex, Typography } from 'antd-next'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { ICompany } from 'graph/generated'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { GetToken } from 'util/interfaces'
import { mavisRequest } from 'util/mavis-api'
import { State } from 'xstate'

import { OnboardingMachineContext, OnboardingMachineEvent } from './machine'
import PaymentSuccessfulModal from './PaymentSuccessfulModal'

function createSetupIntent(getToken: GetToken, company: ICompany) {
  return mavisRequest({
    method: 'POST',
    path: '/admin/v1/billing/setup_intent',
    getToken,
    params: { company: company.slug },
    company,
  })
}

function validateBillingSetup(getToken: GetToken, company: ICompany, data: Record<string, unknown>) {
  return mavisRequest({
    method: 'POST',
    path: '/admin/v1/billing/validate',
    getToken,
    params: { company: company.slug },
    company,
    body: JSON.stringify(data),
  })
}

interface Props {
  state: State<OnboardingMachineContext, OnboardingMachineEvent, any, any, any>
  send: any
  subscriptionMetadata: Record<string, unknown>
}

export default function PaymentMethodCard({ state, send, subscriptionMetadata }: Props) {
  const { notification } = App.useApp()
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()
  const [makingPayment, setMakingPayment] = useState(false)
  const pathname = usePathname()
  const elements = useElements()
  const stripe = useStripe()

  const { companyAddress } = state.context

  const makePayment = async () => {
    if (!stripe || !elements) {
      return
    }

    try {
      setMakingPayment(true)

      const { error: submitElementError } = await elements.submit()
      if (submitElementError) {
        send({ type: 'PAYMENT_FAILED' })
        return false
      }

      const setupIntent = await createSetupIntent(getToken, company)
      const clientSecret = setupIntent?.client_secret as string | undefined
      if (!clientSecret) {
        notification.error({
          key: 'create-setup-intent-error',
          message: 'Error',
          description: 'Cannot save the payment method, please try again',
          duration: 10,
        })
        send({ type: 'PAYMENT_FAILED' })
        return false
      }

      const { error: confirmSetupError } = await stripe.confirmSetup({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/${pathname}?payment=success`,
          payment_method_data: {
            billing_details: companyAddress,
          },
        },
        redirect: 'if_required',
      })

      if (confirmSetupError) {
        notification.error({
          key: 'confirm-setup-error',
          message: 'Error',
          description: 'Cannot save the payment method, please try again',
          duration: 10,
        })
        send({ type: 'PAYMENT_FAILED' })
        return false
      }

      await validateBillingSetup(getToken, company, subscriptionMetadata)
    } catch (error) {
      notification.error({
        key: 'stripe-error',
        message: 'Error',
        description: 'Cannot save the payment method, please try again',
        duration: 10,
      })
      send({ type: 'PAYMENT_FAILED' })
      return false
    } finally {
      setMakingPayment(false)
    }

    send({ type: 'PAYMENT_SUCCESS' })
    return true
  }

  const goBack = () => {
    send({ type: 'BACK' })
  }

  return (
    <Card
      title={
        <Typography.Title level={3} style={{ marginTop: 12 }}>
          Setup your billing information
        </Typography.Title>
      }
      style={{ width: 500, borderRadius: 16, overflow: 'hidden' }}
      bodyStyle={{ padding: 0 }}
      actions={[
        <Flex key="actions" style={{ margin: '12px 24px' }} gap={16}>
          <Button style={{ width: '50%' }} size="large" onClick={goBack}>
            Back to Company Address
          </Button>
          <Button
            type="primary"
            style={{ width: '50%', background: '#6331B3', color: 'white' }}
            size="large"
            onClick={makePayment}
            disabled={state.value === 'success'}
            loading={makingPayment}
          >
            Continue
          </Button>
        </Flex>,
      ]}
    >
      <div style={{ padding: 24 }}>
        <PaymentElement />
      </div>
      <PaymentSuccessfulModal open={state.value === 'success'} />
    </Card>
  )
}

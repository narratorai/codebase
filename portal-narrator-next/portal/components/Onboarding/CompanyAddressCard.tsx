import { Card, Typography } from 'antd-next'
import { State } from 'xstate'

import CompanyAddressForm from './CompanyAddressForm'
import { ICompanyAddress, OnboardingMachineContext, OnboardingMachineEvent } from './machine'

interface Props {
  state: State<OnboardingMachineContext, OnboardingMachineEvent, any, any, any>
  send: any
}

export default function CompanyAddressCard({ state, send }: Props) {
  const handleSubmit = async (data: unknown) => {
    send({ type: 'SUBMIT_COMPANY_ADDRESS', info: data as ICompanyAddress })
  }

  const onManageUsersClick = (data: unknown) => {
    send({ type: 'INVITE_USERS', info: data as ICompanyAddress })
  }

  return (
    <Card
      title={
        <Typography.Title level={3} style={{ marginTop: 12 }}>
          Company address
        </Typography.Title>
      }
      style={{ width: 500, borderRadius: 16 }}
    >
      <CompanyAddressForm
        values={state.context.companyAddress}
        onSubmit={handleSubmit}
        onManageUsersClick={onManageUsersClick}
      />
    </Card>
  )
}

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Billing from '../../../../portal/components/Manage/Company/Billing'
import { AdminTestContext, NonAdminTestContext } from '../../../context'

describe('when the user is not an admin', () => {
  beforeEach(() => {
    render(
      <NonAdminTestContext>
        <Billing />
      </NonAdminTestContext>
    )
  })

  test('renders correctly', async () => {
    expect(screen.getByText('Our billing is powered by Stripe.')).toBeInTheDocument()
    expect(screen.getByText('You can view your billing information by clicking the button below.')).toBeInTheDocument()

    const button = await screen.queryByRole('button', { name: 'View Billing Information' })
    expect(button).toBeNull()
  })
})

describe('when the user is an admin', () => {
  beforeEach(() => {
    render(
      <AdminTestContext>
        <Billing />
      </AdminTestContext>
    )
  })

  test('renders correctly', async () => {
    expect(screen.getByText('Our billing is powered by Stripe.')).toBeInTheDocument()
    expect(screen.getByText('You can view your billing information by clicking the button below.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View Billing Information' })).toBeInTheDocument()
  })

  test.skip('redirects to stripe when the button is clicked', async () => {
    const user = userEvent.setup()
    const button = await screen.getByRole('button', { name: 'View Billing Information' })
    await user.click(button)

    expect(window.location.href).toMatch('https://dashboard.stripe.com/test')
  })
})

import { render, screen } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import userEvent from '@testing-library/user-event'

// import TaskTrackerSidebar from '../../../portal/components/TaskTracker/TaskTrackerSidebar'
import { AdminTestContext, NonAdminTestContext } from '../../context'

import { GetUserDocument, GetCompanyBatchHaltDocument } from '../../../portal/graph/generated'

const mocks = [
  {
    request: { query: GetUserDocument, variables: { user_id: '123' } },
    result: { data: { user: [{ email: 'testing@example.com' }] } },
  },
  {
    request: { query: GetCompanyBatchHaltDocument, variables: { id: 'company_123' } },
    result: { data: { company: [{ batch_halt: false }] } },
  },
]

// FIXME:
// FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
// getting ^^ when TaskTrackerSidebar imports from antd-next (conflict with antd-custom)
// TODO: turn these tests on when we fully migrate to antd-next
describe.skip('when the user is not an admin', () => {
  beforeEach(() => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <NonAdminTestContext initialEntries={['/manage/tasks']}>{/* <TaskTrackerSidebar /> */}</NonAdminTestContext>
      </MockedProvider>
    )
  })

  test('it does not render the batch halt switch', async () => {
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })
})
describe.skip('when the user is an admin', () => {
  beforeEach(() => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <AdminTestContext initialEntries={['/manage/tasks']}>{/* <TaskTrackerSidebar /> */}</AdminTestContext>
      </MockedProvider>
    )
  })

  test('renders the batch halt toggle', async () => {
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  test('clicking the toggle will ask for confirmation', async () => {
    const user = userEvent.setup()
    const toggle = await screen.getByRole('switch')
    await user.click(toggle)

    expect(screen.getByText('Are you sure you want to pause all your processing tasks?')).toBeInTheDocument()
  })

  test('canceling confirmation will not update batch halt', async () => {
    const user = userEvent.setup()
    const toggle = await screen.getByRole('switch')

    // check that the button is live
    expect(screen.getByText('Live')).toBeInTheDocument()

    // click the toggle
    await user.click(toggle)
    // see the confirmation popup (check visible since antd will render it off screen)
    expect(screen.getByText('Are you sure you want to pause all your processing tasks?')).toBeVisible()

    // cancel the confirmation
    const cancelButton = await screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)
    // make sure the confirmation popup is gone (check visible since antd will render it off screen)
    expect(screen.queryByText('Are you sure you want to pause all your processing tasks?')).not.toBeVisible()

    // make sure the toggle is still live
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  // TODO: figure out how to test mavis calls (via useCallMavis - which is flavortown and mavis server)
  test.skip('confirming batch halt will update the status', async () => {
    const user = userEvent.setup()
    const toggle = await screen.getByRole('switch')

    // check that the toggle is live
    expect(screen.getByText('Live')).toBeInTheDocument()

    // click the toggle
    await user.click(toggle)
    // see the confirmation popup (check visible since antd will render it off screen)
    expect(screen.getByText('Are you sure you want to pause all your processing tasks?')).toBeVisible()

    // confirm the batch halt
    const okButton = await screen.getByRole('button', { name: 'OK' })
    await user.click(okButton)
    // make sure the confirmation popup is gone (check visible since antd will render it off screen)
    expect(screen.queryByText('Are you sure you want to pause all your processing tasks?')).not.toBeVisible()

    // make sure the toggle is still live
    expect(screen.getByText('Live')).not.toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { startCase } from 'lodash'

import DimTableCard from '../../../portal/components/Activities/v2/DimTableCard'
import { AdminTestContext, NonAdminTestContext } from '../../context'

const STUBBED_DIM_TABLE_ID = '1234'

const STUBBED_DIM_TABLE = {
  id: STUBBED_DIM_TABLE_ID,
  table: 'test',
  maintenances: [],
}

describe('when the user is not an admin', () => {
  beforeEach(() => {
    render(
      <NonAdminTestContext initialEntries={['/activities']}>
        <DimTableCard dimTable={STUBBED_DIM_TABLE} />
      </NonAdminTestContext>
    )
  })

  test('renders correctly', async () => {
    expect(screen.getByText(startCase(STUBBED_DIM_TABLE.table))).toBeInTheDocument()
  })

  test('does not allow click on dim link', async () => {
    const user = userEvent.setup()
    const link = await screen.getByText(startCase(STUBBED_DIM_TABLE.table))

    await user.click(link)

    expect(screen.getByTestId('location-display')).toHaveTextContent('/activities')
    expect(screen.getByTestId('location-display')).not.toHaveTextContent('/activities/edit_dim')
    expect(screen.getByTestId('location-display')).not.toHaveTextContent(`/activities/edit_dim/${STUBBED_DIM_TABLE_ID}`)
  })
})

describe('when the user is an admin', () => {
  beforeEach(() => {
    render(
      <AdminTestContext initialEntries={['/activities']}>
        <DimTableCard dimTable={STUBBED_DIM_TABLE} />
      </AdminTestContext>
    )
  })

  test('renders correctly', async () => {
    expect(screen.getByText(startCase(STUBBED_DIM_TABLE.table))).toBeInTheDocument()
  })

  test('does allow click on dim link', async () => {
    const user = userEvent.setup()
    const link = await screen.getByText(startCase(STUBBED_DIM_TABLE.table))

    await user.click(link)

    expect(screen.getByTestId('location-display')).toHaveTextContent(`/activities/edit_dim/${STUBBED_DIM_TABLE_ID}`)
  })
})

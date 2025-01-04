import { render, screen } from '@testing-library/react'
import { noop } from 'lodash'
import { Form } from 'react-final-form'

import IntegrationFormFields from '../../../../portal/components/Datasets/Modals/IntegrationsFormFields'
import { IDatasetQueryDefinition } from '../../../../portal/util/datasets/interfaces'
import { arrayMutators } from '../../../../portal/util/forms'
import { AdminTestContext, DatasetContext } from '../../../context'

const queryDefinition = {
  query: {
    all_groups: [],
    columns: [
      {
        id: '1234',
        name: 'timestamp',
        type: 'timestamp',
      },
    ],
  },
} as unknown as IDatasetQueryDefinition

// TODO: fix https://github.com/ant-design/ant-design/issues/21096
// Error: Uncaught [TypeError: Cannot read properties of undefined (reading 'addListener')]
describe.skip('Admin user in Integration Postmark', () => {
  beforeEach(() => {
    render(
      <AdminTestContext>
        <DatasetContext>
          <Form
            initialValues={{
              materializations: [
                {
                  type: 'postmark',
                },
              ],
            }}
            mutators={arrayMutators}
            onSubmit={noop}
            render={() => <IntegrationFormFields queryDefinition={queryDefinition} />}
          />
        </DatasetContext>
      </AdminTestContext>
    )
  })

  test('renders with the correct fields', async () => {
    expect(screen.getByText('Pretty Name')).toBeInTheDocument()
    expect(screen.getByText('Parent or Group')).toBeInTheDocument()
    expect(screen.getByText('Repeat Every')).toBeInTheDocument()
    expect(screen.getByText('From Email')).toBeInTheDocument()
    expect(screen.getByText('Send Email Column')).toBeInTheDocument()
    expect(screen.getByText('Template Id')).toBeInTheDocument()
    expect(screen.getByText('Api key')).toBeInTheDocument()
  })
})

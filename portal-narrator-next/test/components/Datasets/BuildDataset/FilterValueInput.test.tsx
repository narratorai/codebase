import { render, screen, fireEvent } from '@testing-library/react'
import { noop } from 'lodash'
import { FormProvider, useForm } from 'react-hook-form'

import { COLUMN_TYPE_STRING } from '../../../../portal/util/datasets'
import FilterValueInput from '../../../../portal/components/Datasets/BuildDataset/tools/shared/ReactHookForm/FilterValueInput'
import { NonAdminTestContext } from '../../../context'

const FormWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    mode: 'all',
  })

  return (
    <NonAdminTestContext>
      <FormProvider {...methods}>
        <form onSubmit={noop}>{children}</form>
      </FormProvider>
    </NonAdminTestContext>
  )
}

describe('FilterValueInput', () => {
  beforeEach(() => {
    render(
      <FormWrapper>
        <FilterValueInput filterFieldName="testing" columnType={COLUMN_TYPE_STRING} />
      </FormWrapper>
    )
  })

  test('renders with default values', () => {
    expect(screen.getByText('value')).toBeInTheDocument()

    const valueInput = screen.getByLabelText('text-input')
    expect(valueInput).toBeInTheDocument()
    expect(valueInput).toHaveValue('')
  })

  test('it can update the value and kind', async () => {
    const valueInput = screen.getByLabelText('text-input')
    expect(valueInput).toBeInTheDocument()
    expect(valueInput).toHaveValue('')

    // update value to 'test'
    fireEvent.change(valueInput, { target: { value: 'test' } })
    expect(valueInput).toHaveValue('test')

    // check that kind is value
    const kindSelect = screen.getByTestId('value-kind-select')
    expect(kindSelect).toBeInTheDocument()
    expect(kindSelect).toHaveTextContent('value')

    // changing the kind should clear the value
    const kindSelectInput = screen.getByRole('combobox')

    fireEvent.change(kindSelectInput, { target: { value: 'field' } })
    expect(kindSelectInput).toHaveValue('field')

    // TODO: find way to trigger usePrevious logic in component tests
    // i.e. add test that changing kind updates the value
  })
})

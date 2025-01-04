import { render } from '@testing-library/react'
import ManageIcons from '../../../../portal/components/Manage/Company/ManageIcons'

test('warehouse type returns correct icon', () => {
  const { asFragment } = render(<ManageIcons type="warehouse" />)
  expect(asFragment()).toMatchSnapshot()
})

test('company type returns correct icon', () => {
  const { asFragment } = render(<ManageIcons type="company" />)
  expect(asFragment()).toMatchSnapshot()
})

test('users type returns correct icon', () => {
  const { asFragment } = render(<ManageIcons type="users" />)
  expect(asFragment()).toMatchSnapshot()
})

test('billing type returns correct icon', () => {
  const { asFragment } = render(<ManageIcons type="billing" />)
  expect(asFragment()).toMatchSnapshot()
})

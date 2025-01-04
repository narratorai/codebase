import { SearchSelect } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'

interface Props {
  value?: string
  status?: '' | 'warning' | 'error'
  onChange: (value: string) => void
}

/**
 * TODO: This field is duplicated in CustomerJourney and BuildDataset
 */
const ActivityStreamSelect = ({ value, status, onChange }: Props) => {
  const company = useCompany()

  const streamSelectOptions = company?.tables?.map((table) => ({
    value: table.id,
    label: table.identifier,
  }))

  return (
    <SearchSelect
      value={value}
      options={streamSelectOptions}
      onChange={onChange}
      status={status}
      style={{ flex: 1, width: '100%' }}
      popupMatchSelectWidth={false}
    />
  )
}

export default ActivityStreamSelect

import Select from '@/components/primitives/Select'

import { useReportDatasetColummnsQuery } from '../../Filter/DatasetColumnMultiSelect/hooks'

export type SelectionItem = {
  id: string
  label?: string
  type: 'string' | 'number' | 'boolean' | 'timestamp'
  dataset: {
    id: string
    name?: string
  }
  tab?: {
    slug: string
    label?: string
    kind: 'group' | 'parent'
  }
}

interface Props {
  onChange: (value: SelectionItem) => void
  placeholder?: string
  reportId: string
  value: SelectionItem
}

/**
 * Select component to choose dataset columns.
 */
export default function DatasetColumnSelect({ reportId, onChange, value }: Props) {
  const { data: allColumns } = useReportDatasetColummnsQuery(reportId)

  return (
    <Select
      onChange={(event) => {
        const selectedColumn = allColumns.find((item) => item.id === event.target.value)
        if (selectedColumn) onChange(selectedColumn)
      }}
      value={value.id}
    >
      {allColumns.map((item) => (
        <option key={item.id} value={item.id}>
          {item.label}
        </option>
      ))}
    </Select>
  )
}

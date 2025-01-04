import { ListboxOption, ListboxOptionContents } from '@/components/primitives/Listbox'
import { OptionDescription, OptionDivider, OptionLabel } from '@/components/primitives/Options'
import { IRemoteTable } from '@/stores/tables'

interface Props {
  showDivider?: boolean
  table: IRemoteTable
}

const ActivityStreamSelectItem = ({ showDivider, table }: Props) => {
  return (
    <ListboxOption<IRemoteTable> value={table}>
      <ListboxOptionContents>
        <OptionLabel>{table.identifier}</OptionLabel>
        <OptionDescription>
          <span>Stream: {table.activityStream}</span>
          <span>Customer table: {table.customerDim?.table}</span>
        </OptionDescription>
      </ListboxOptionContents>
      {showDivider && <OptionDivider />}
    </ListboxOption>
  )
}

export default ActivityStreamSelectItem

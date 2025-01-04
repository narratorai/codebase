'use client'

import { map } from 'lodash'
import { useShallow } from 'zustand/react/shallow'

import { Listbox } from '@/components/primitives/Listbox'
import Loading from '@/components/primitives/Loading'
import { useScrollEvents } from '@/hooks'
import { IRemoteTable, useTables } from '@/stores/tables'

import ActivityStreamSelectItem from './ActivityStreamSelectItem'
import { useActivityStreamQuery } from './hooks'

interface Props {
  disabled?: boolean
  onChange?: (value: string) => void
  placeholder?: string
}

const ActivityStreamSelect = ({ disabled = false, onChange, placeholder = 'Activity stream' }: Props) => {
  const [tables, table, setTable] = useTables(useShallow((state) => [state.data, state.table, state.setTable]))
  const { fetchNextPage, isFetching } = useActivityStreamQuery()

  const handleScrollEnd = () => {
    if (!isFetching) fetchNextPage()
  }

  const handleScroll = useScrollEvents(handleScrollEnd)

  const handleChange = (value: IRemoteTable) => {
    setTable(value.id)
    onChange?.(value.id)
  }

  const formatLabel = (value: IRemoteTable | null) => value?.identifier || ''

  return (
    <Listbox<IRemoteTable | null>
      anchor="bottom start"
      aria-label={placeholder}
      disabled={disabled}
      displayValue={formatLabel}
      name="activity-stream-select"
      onChange={handleChange}
      onScroll={handleScroll}
      placeholder={placeholder}
      value={table}
    >
      {map(tables, (table, index) => (
        <ActivityStreamSelectItem key={table.id} showDivider={index < tables.length - 1} table={table} />
      ))}
      {isFetching && <Loading size="sm" />}
    </Listbox>
  )
}

export default ActivityStreamSelect

import { SelectLabel } from '@radix-ui/react-select'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { isEmpty } from 'lodash'

import { SelectContent, SelectGroup, SelectItem, SelectRoot, SelectTrigger } from '@/components/shared/Select'
import { useCompany } from '@/stores/companies'

import { fetchDataset } from './ajax'

interface Props {
  value: string
  datasetId: string
  placeholder?: string
  className?: clsx.ClassValue
  onChange: (plotSlug: string, datasetTabSlug?: string) => void
  enabled?: boolean
}

export default function DatasetPlotSelect({
  value,
  datasetId,
  placeholder,
  onChange,
  className,
  enabled = false,
}: Props) {
  const company = useCompany()

  const { isFetching, data: response } = useQuery({
    queryKey: ['datasets-grouped-plots', datasetId, company.slug],
    queryFn: () => fetchDataset(datasetId, company.datacenterRegion),
    staleTime: 1000 * 60 * 5,
    enabled,
  })

  const handleChange = (newValue: string) => {
    const datasetTabSlug = response?.allTabs.find((tab) => tab.plots.find((plot) => plot.slug === newValue))?.slug
    onChange(newValue, datasetTabSlug)
  }

  return (
    <SelectRoot onValueChange={handleChange} disabled={!enabled}>
      <SelectTrigger placeholder={placeholder} className={clsx(className)}>
        {
          response?.allTabs
            .find((tab) => tab.plots.find((plot) => plot.slug === value))
            ?.plots.find((plot) => plot.slug === value)?.name
        }
      </SelectTrigger>
      <SelectContent className="max-h-72 w-80 space-y-2">
        {!isFetching && isEmpty(response?.allTabs) && <p className="p-2 text-sm">No plots available</p>}
        {!isFetching &&
          response?.allTabs.map((datasetTab) => (
            <SelectGroup key={datasetTab.slug}>
              <SelectLabel className="px-2 py-1 text-xs text-gray-400">{datasetTab.label}</SelectLabel>
              <ul>
                {datasetTab.plots.map((plot) => (
                  <SelectItem key={plot.slug} value={plot.slug} className="p-2 pl-4 hover:bg-gray-50">
                    {plot.name}
                  </SelectItem>
                ))}
              </ul>
            </SelectGroup>
          ))}
      </SelectContent>
    </SelectRoot>
  )
}

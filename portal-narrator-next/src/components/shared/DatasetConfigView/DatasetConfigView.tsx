import React from 'react'

import { Content, Line } from '@/components/shared/TagContent'
import { IRemoteDataset } from '@/stores/datasets'

import { useAppendActivities, useCohortActivity, useComputedColumns, usePlot } from './hooks'

interface Props {
  dataset: IRemoteDataset
  groupSlug?: string | null
  plotSlug?: string | null
}

const DatasetConfigView = ({ dataset, groupSlug, plotSlug }: Props) => {
  const cohortActivityTokens = useCohortActivity(dataset.cohortActivity)
  const appendActivities = useAppendActivities(dataset.appendActivities, dataset.cohortActivity)
  const computedColumnTokens = useComputedColumns(dataset.columns)
  const plot = usePlot(dataset.allTabs, groupSlug, plotSlug)

  return (
    <Content>
      {cohortActivityTokens.length > 0 && <Line tokens={cohortActivityTokens} />}
      {appendActivities.map((appendActivity, index) => (
        <Line key={index} tokens={appendActivity} />
      ))}
      {computedColumnTokens.length > 0 && <Line tokens={computedColumnTokens} />}
      {plot.length > 0 && <Line tokens={plot} />}
    </Content>
  )
}

export default DatasetConfigView

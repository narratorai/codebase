import { Button, Popover, Tooltip } from 'antd-next'
import { DatasetIcon } from 'components/Navbar/NavIcons'
import { Box, Link, Typography } from 'components/shared/jawns'
import { IGetNarrativeBySlugQuery } from 'graph/generated'
import { compact, isEmpty, map } from 'lodash'
import React, { useMemo } from 'react'

type Narratives = IGetNarrativeBySlugQuery['narrative']
type Narrative = Narratives[number]
type Datasets = Narrative['narrative_datasets']

interface Props {
  narrativeDatasets: Datasets
}

const DatasetLinksPopover = ({ narrativeDatasets }: Props) => {
  const visibleNarrativeDatasets = useMemo(() => {
    return compact(
      map(narrativeDatasets, (item) => {
        // FIXME: a dataset might have a status of in_progress or archived
        // and not belong to someone viewing this narrative
        // currently graph isn't pulling those datasets b/c of perrmissions
        // so don't render broken links if dataset is not present in graph resp
        if (item.dataset) {
          return item
        }

        return null
      })
    )
  }, [narrativeDatasets])

  return (
    <Popover
      trigger={['click']}
      title="Datasets used in this Narrative"
      content={
        <Box>
          {map(visibleNarrativeDatasets, (item) => (
            <Box key={item.id} mb={1}>
              <Link to={`/datasets/edit/${item.dataset.slug}`}>
                <Typography as="div" type="body200">
                  {item.dataset.name}
                </Typography>
              </Link>
            </Box>
          ))}
        </Box>
      }
    >
      <Tooltip
        placement="right"
        title={
          isEmpty(visibleNarrativeDatasets)
            ? 'No Datasets used in this Dashboard'
            : 'View Datasets used in this Dashboard'
        }
      >
        <div>
          <Button size="small" icon={<DatasetIcon />} disabled={isEmpty(visibleNarrativeDatasets)} />
        </div>
      </Tooltip>
    </Popover>
  )
}

export default DatasetLinksPopover

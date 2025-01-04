import { Collapse } from 'antd-next'
import { Box } from 'components/shared/jawns'
import { ICompany_Task, IDataset_Materialization } from 'graph/generated'
import { find, map } from 'lodash'

import ExternalLinkHeader from './ExternalLinkHeader'
import TaskCard from './TaskCard'

export interface SortedIntegrations {
  [key: string]: {
    [key: string]: IDataset_Materialization[]
  }[]
}

interface Props {
  allExternalLinks: string[]
  sortedIntegrations: SortedIntegrations
  tasks?: ICompany_Task[]
  matType: string
}

const TaskGroupWithExternalLinks = ({ allExternalLinks, tasks, sortedIntegrations, matType }: Props) => {
  return (
    <Box>
      <Collapse defaultActiveKey={allExternalLinks} ghost>
        {map(allExternalLinks, (externalLink) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: Element implicitly has an 'any' type because index expression is not of type 'number'
          const integrations = sortedIntegrations[matType][externalLink]

          return (
            <Collapse.Panel
              key={externalLink}
              header={<ExternalLinkHeader externalLink={externalLink} matType={matType} />}
            >
              {map(integrations, (integration) => {
                const task = find(tasks, ['id', integration.task_id]) as ICompany_Task
                return <TaskCard task={task} key={integration.id} />
              })}
            </Collapse.Panel>
          )
        })}
      </Collapse>
    </Box>
  )
}

export default TaskGroupWithExternalLinks

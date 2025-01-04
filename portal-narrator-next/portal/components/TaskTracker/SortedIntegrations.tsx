import { Collapse } from 'antd-next'
import { ICompany_Task, IDataset_Materialization } from 'graph/generated'
import { each, filter, flatMap, isEmpty, keys, map, startCase } from 'lodash'

import { NO_EXTERNAL_LINK_NAME } from './ExternalLinkHeader'
import TaskGroup from './TaskGroup'
import TaskGroupWithExternalLinks from './TaskGroupWithExternalLinks'

interface SortedIntegrationsProps {
  tasks?: ICompany_Task[]
}

interface SortedIntegrations {
  [key: string]: {
    [key: string]: IDataset_Materialization[]
  }[]
}

const SortedIntegrations = ({ tasks }: SortedIntegrationsProps) => {
  const allIntegrations = flatMap(tasks, (task) => task.dataset_materializations)
  const sortedIntegrations: SortedIntegrations = {}

  each(allIntegrations, (integration) => {
    // initialize first type (i.e. first "webhook" seen)
    if (!sortedIntegrations[integration.type]) {
      sortedIntegrations[integration.type] = []
    }

    const externalLink = integration.external_link || NO_EXTERNAL_LINK_NAME
    // iniitalize first external link within an integration type (i.e. first "webhook" with "https://example.com")
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Element implicitly has an 'any' type because index expression is not of type 'number'
    if (!sortedIntegrations[integration.type][externalLink]) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: Element implicitly has an 'any' type because index expression is not of type 'number'
      sortedIntegrations[integration.type][externalLink] = []
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Element implicitly has an 'any' type because index expression is not of type 'number'
    sortedIntegrations[integration.type][externalLink].push(integration)
    // sortedIntegrations[integration.type].push(integration)
  })

  const allMatTypes = keys(sortedIntegrations)
  // Don't render Collapse until matTypes are available
  // Otherwise all Panels will be collapsed by default
  if (isEmpty(allMatTypes)) {
    return null
  }

  return (
    <Collapse defaultActiveKey={allMatTypes}>
      {/* map through each integration type i.e. webhook, csv, text... */}
      {map(allMatTypes, (matType) => {
        const allExternalLinks = keys(sortedIntegrations[matType])
        const allMatIntegrations: IDataset_Materialization[] = flatMap(
          allExternalLinks,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: Element implicitly has an 'any' type because index expression is not of type 'number'
          (externalLink) => sortedIntegrations[matType][externalLink]
        )

        const hasNoExternalLink = isEmpty(
          filter(allExternalLinks, (externalLink) => externalLink !== NO_EXTERNAL_LINK_NAME)
        )

        return (
          <Collapse.Panel header={`${startCase(matType)} (${allMatIntegrations?.length})`} key={matType}>
            {/* If the mat has no external links - only show the cards (no sub-sections) */}
            {hasNoExternalLink && <TaskGroup materializations={allMatIntegrations} tasks={tasks} />}

            {/* If the mat has external links - show sub-sections separated by external link */}
            {!hasNoExternalLink && (
              <TaskGroupWithExternalLinks
                allExternalLinks={allExternalLinks}
                tasks={tasks}
                sortedIntegrations={sortedIntegrations}
                matType={matType}
              />
            )}
          </Collapse.Panel>
        )
      })}
    </Collapse>
  )
}

export default SortedIntegrations

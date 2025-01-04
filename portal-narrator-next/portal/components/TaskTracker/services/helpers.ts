import { ICompany_Task, ITask_Execution } from 'graph/generated'
import { get, isEmpty, lowerCase, map, startCase, startsWith } from 'lodash'
import { makeHoneycombTraceLink } from 'util/honeycomb'
import { TASK_CATEGORY_MATERIALIZATIONS, TASK_CATEGORY_NARRATIVES } from './constants'

export interface IHoneyCombLink {
  name: string
  link: string
}

export const getStatusColor = (status: string) => {
  let statusColor
  switch (status) {
    case 'complete':
      statusColor = 'success'
      break
    case 'failed':
      statusColor = 'error'
      break
    case 'cancelled':
      statusColor = 'warning'
      break
    default:
      statusColor = 'processing'
      break
  }

  return statusColor
}

// TODO: move the task id and future honeycomb link out of description and into hidden fields
export const prefillDescriptionSupport = async (description: string) => {
  if (window.Beacon) {
    window.Beacon('open')

    // NOTE - prefill only works for email form, not in chat mode!
    window.Beacon('prefill', {
      text: description,
    })
  }
}

export const makeTaskOrExecutionSupportDescription = (id: string, type: string, honeycombLinks?: IHoneyCombLink[]) => {
  if (!isEmpty(honeycombLinks)) {
    const allLinks = map(honeycombLinks, (link) => link.link)
    const links = allLinks.join(', ')
    return `ADDITIONAL INFO FOR SUPPORT REP:\n\n${startCase(type)} Id: ${id}\n\n${links}`
  }
  return `ADDITIONAL INFO FOR SUPPORT REP:\n\n${startCase(type)} Id: ${id}`
}

export const taskPrettyName = (task: Partial<ICompany_Task>) => {
  const category = get(task, 'category')
  const taskSlug = get(task, 'task_slug')

  // if it is a narrative task
  if (category === TASK_CATEGORY_NARRATIVES && startsWith(lowerCase(taskSlug), 'n')) {
    // use narrative name if it's there
    if (task.narratives && task.narratives[0]?.name) {
      return task.narratives[0].name
    }

    // otherwise modify the task slug (old version - what we do with materializations)
    return startCase(taskSlug?.split('_').slice(1).join(' '))
  }

  // if it is a materializations task, remove the preceeding N or M from slug
  if (
    category === TASK_CATEGORY_MATERIALIZATIONS &&
    (startsWith(lowerCase(taskSlug), 'm') || startsWith(lowerCase(taskSlug), 'n'))
  ) {
    return startCase(taskSlug?.split('_').slice(1).join(' '))
  }

  return startCase(taskSlug)
}

export const makeTaskExecutionHoneycombLinks = (execution?: Partial<ITask_Execution>) => {
  if (execution?.details?.trace_context) {
    const { trace_context } = execution.details
    const { trace_id, dataset = 'mavis-worker' } = trace_context
    const startTime = execution.started_at
    const endTime = execution.completed_at

    return [{ name: 'Link', link: makeHoneycombTraceLink(trace_id, startTime, endTime, dataset) }]
  }

  return []
}

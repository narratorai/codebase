import { Alert } from 'antd-next'
import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import { useGetTaskExecutionJobFailuresQuery } from 'graph/generated'
import { isEmpty, map, startCase, toString } from 'lodash'

interface Props {
  taskExecutionId: string
}

export default function JobExecutionErrors({ taskExecutionId }: Props) {
  const { data: lastRunJobExecution } = useGetTaskExecutionJobFailuresQuery({
    variables: { task_execution_id: taskExecutionId },
  })

  const taskExecution = lastRunJobExecution?.task_execution[0]
  const { details, task } = taskExecution || {}
  const taskSlug = task?.task_slug

  const errors = [details?.error]

  if (isEmpty(errors)) return null
  return (
    <Alert
      type="error"
      message={`${startCase(taskSlug)} Error`}
      description={
        <>
          {map(errors, (err, i) => (
            <MarkdownRenderer key={`${err}_${i}`} source={toString(err)} />
          ))}
        </>
      }
    />
  )
}

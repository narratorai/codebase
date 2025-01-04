import { RouteChildrenProps } from 'react-router'

import ActivityBlock from './ActivityBlock'

type RouterProps = RouteChildrenProps<{ id?: string }>

const EditActivityStream = ({ match }: RouterProps) => {
  const streamId = match?.params?.id

  return (
    <div key={streamId}>
      <ActivityBlock streamId={streamId} />
    </div>
  )
}

export default EditActivityStream

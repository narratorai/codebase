import { Drawer } from 'antd-next'
import { DynamicFieldReturn } from 'components/Narratives/interfaces'
import { generatePath, RouteComponentProps, useHistory, withRouter } from 'react-router'

import DynamicFieldsForm from './DynamicFieldsForm'

interface Props extends RouteComponentProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
}

interface DynamicFieldWithValue extends DynamicFieldReturn {
  value: string | Record<string, any> | string[] | null
}

interface FormState {
  fields: DynamicFieldWithValue[]
}

const DynamicFieldsDrawer = ({ isOpen, match, onClose, onSubmit: onSubmitFilters }: Props) => {
  const history = useHistory()
  const { params, path } = match

  const handleSubmit = (data: FormState) => {
    const pathname = generatePath(path, {
      ...params,
      // base64 the params into optional url segment
      // this keeps customer info out of urls
      dynamic_fields: btoa(JSON.stringify(data)),
    })

    history.push({ pathname, search: history.location.search })
    onSubmitFilters()
    onClose()
  }

  return (
    <Drawer width={480} title="Apply Filters" placement="left" onClose={onClose} open={isOpen}>
      <DynamicFieldsForm onSubmit={handleSubmit} />
    </Drawer>
  )
}

export default withRouter(DynamicFieldsDrawer)

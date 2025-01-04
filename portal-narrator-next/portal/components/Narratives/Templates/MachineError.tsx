import { Alert } from 'antd-next'
import TemplateContext from 'components/Narratives/Templates/TemplateContext'
import { Box } from 'components/shared/jawns'
import { useContext } from 'react'

const MachineError = () => {
  const { machineCurrent, machineSend } = useContext(TemplateContext)
  const apiError = machineCurrent.matches({ api: 'error' })
  const { _error: machineError } = machineCurrent.context

  const clearError = () => {
    // By default if the uesr X's out the error we want the error to be cleared
    // from the machine
    machineSend('CLEAR_ERROR')
  }

  if (apiError && machineError) {
    return (
      <Box mb={3}>
        <Alert
          message="Error"
          // add 'break-spaces' to support /n in our error messages
          description={<span style={{ whiteSpace: 'break-spaces' }}>{machineError?.message}</span>}
          type="error"
          closable
          showIcon
          afterClose={clearError}
        />
      </Box>
    )
  }

  return null
}

export default MachineError

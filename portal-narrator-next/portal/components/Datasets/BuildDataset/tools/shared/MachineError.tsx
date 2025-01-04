import { Alert } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Box } from 'components/shared/jawns'
import { useContext } from 'react'
import { IDatasetFormContext } from 'util/datasets/interfaces'

interface Props {
  clearErrorOnClose?: boolean
}

const MachineError = ({ clearErrorOnClose = true }: Props) => {
  const { machineCurrent, machineSend } = useContext<IDatasetFormContext>(DatasetFormContext)
  const apiError = machineCurrent.matches({ api: 'error' })
  const { _error: machineError } = machineCurrent.context

  const clearError = () => {
    // By default if the uesr X's out the error we want the error to be cleared
    // from the machine
    // The clearErrorOnClose prop allows us to override that (see FreehandFunction.tsx)
    clearErrorOnClose && machineSend('CLEAR_ERROR')
  }

  if (apiError && machineError) {
    return (
      <Box mb={3} data-test="machine-error-alert">
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

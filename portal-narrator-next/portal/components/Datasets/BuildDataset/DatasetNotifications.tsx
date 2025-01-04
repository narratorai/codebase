import { App } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { forEach, isArray } from 'lodash'
import { useContext, useEffect } from 'react'

const DatasetNotifications = () => {
  const { notification } = App.useApp()
  const { machineCurrent } = useContext(DatasetFormContext)
  const { _notification: machineNotification } = machineCurrent.context

  useEffect(() => {
    if (machineNotification) {
      // there can be multiple notifications
      if (isArray(machineNotification)) {
        forEach(machineNotification, (n) =>
          notification[n.type]({
            key: `${n.message}_${n.description}_${n.type}`,
            message: n.message,
            description: n.description,
            placement: n?.placement || 'topRight',
          })
        )
      } else {
        // single notification
        notification[machineNotification.type]({
          message: machineNotification.message,
          description: machineNotification.description,
          placement: machineNotification?.placement || 'topRight',
        })
      }
    }
  }, [machineNotification])

  return null
}

export default DatasetNotifications

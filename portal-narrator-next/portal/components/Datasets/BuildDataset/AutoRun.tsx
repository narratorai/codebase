import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import _ from 'lodash'
import { makeQueryDefinitionFromContext } from 'machines/datasets'
import { useContext, useEffect } from 'react'
import usePrevious from 'util/usePrevious'

interface AutoRunProps {
  setRunDatasetParams: (args: any) => void
}

// TODO - once query running is in machine, move all this logic there:
const AutoRun = ({ setRunDatasetParams }: AutoRunProps) => {
  const { groupSlug, machineCurrent } = useContext(DatasetFormContext) || {}
  const machineMainIsReady = machineCurrent.matches({ main: 'ready' })
  const machineQueryDefinition = makeQueryDefinitionFromContext(machineCurrent.context)
  const prevMachineQueryDefinition = usePrevious(machineQueryDefinition)

  useEffect(() => {
    // Always make sure the query definition actually changed
    // to prevent firing duplicates:
    if (!_.isEqual(prevMachineQueryDefinition, machineQueryDefinition)) {
      // Unfortunately we can't use onRunDataset from DatasetFormContext
      // because of thew useEffect dependency would call duplicate runs:
      const runDataset = () => {
        setRunDatasetParams({
          queryDefinition: machineQueryDefinition,
          runGroupSlug: groupSlug,
        })
      }

      // AutoRun on load for edit only (not new, hence machineMainIsReady):
      if (machineCurrent.event.type === 'done.invoke.LOADING_DATASET' && machineMainIsReady) {
        runDataset()
      }

      // AutoRun on submission of Dataset Definition form:
      // - unless reconciler fires (planExecution.show_user)
      if (
        machineCurrent.event.type === 'done.invoke.SUBMITTING_DEFINITION' &&
        !_.get(machineCurrent.event, 'data.planExecution.show_user')
      ) {
        runDataset()
      }

      // AutoRun on creating a new group by:
      if (machineCurrent.event.type === 'done.invoke.SUBMITTING_CREATE_GROUP') {
        runDataset()
      }

      // AutoRun after submitting column shortcut to create new group:
      // - unless reconciler fires (planExecution.show_user)

      // planExecution's IUiInstructions: can be an object or array of objects
      // TODO: Eventually let's remove object as an option
      // and only send arrays of uiInstructions from mavis
      const uiInstructions = _.get(machineCurrent.event, 'data.planExecution.ui_instructions')
      let goToGroupUiInstruction
      if (_.isArray(uiInstructions)) {
        // It's an array
        goToGroupUiInstruction = _.find(uiInstructions, ['kind', 'go_to_group'])
      } else {
        // It's an object
        uiInstructions?.kind === 'go_to_group'
      }

      if (
        (machineCurrent.event.type === 'done.invoke.SUBMITTING_COLUMN_SHORTCUT' ||
          machineCurrent.event.type === 'done.invoke.SUBMITTING_ROW_SHORTCUT') &&
        !_.get(machineCurrent.event, 'data.planExecution.show_user') &&
        goToGroupUiInstruction
      ) {
        runDataset()
      }
    }
  }, [
    groupSlug,
    machineCurrent.event,
    machineQueryDefinition,
    machineMainIsReady,
    prevMachineQueryDefinition,
    setRunDatasetParams,
  ])

  return null
}

export default AutoRun

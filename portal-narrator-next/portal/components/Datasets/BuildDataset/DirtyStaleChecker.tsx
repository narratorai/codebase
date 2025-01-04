import { App } from 'antd-next'
import { Button } from 'antd-next'
import { useUser } from 'components/context/user/hooks'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { ACTION_TYPE_QUERY } from 'components/Datasets/BuildDataset/datasetReducer'
import { Typography } from 'components/shared/jawns'
import { cloneDeep, find, get, isEqual, keys, omit, reduce } from 'lodash'
import { makeQueryDefinitionFromContext } from 'machines/datasets'
import { useContext, useEffect, useRef } from 'react'
import { RAW_DATASET_KEY, TOOL_DUPLICATE_DATASET } from 'util/datasets'
import { IDatasetQueryDefinition, IDatasetReducerState } from 'util/datasets/interfaces'

const NOT_YOUR_DATASET_AND_DIRTY_WARNING_KEY = 'not-your-dataset-and-dirty-warning'

// Check if query definition has changed, if it has the form is dirty!
export const DirtyFormChecker = () => {
  const { notification } = App.useApp()
  const { user } = useUser()
  const { machineCurrent, machineSend, dataset, datasetSlug, onOpenToolOverlay } = useContext(DatasetFormContext) || {}
  const prevQueryDefRef = useRef<IDatasetQueryDefinition>()
  const queryDefinition = makeQueryDefinitionFromContext(machineCurrent.context)

  const fromNarrative = machineCurrent.context._from_narrative
  const cameFromNarrative = !!fromNarrative?.upload_key && !!fromNarrative?.slug

  const isNewDataset = !datasetSlug
  const hasWarnedNotYourDataset = useRef<boolean>(false)
  const notYourDataset = !isNewDataset && user.id !== dataset?.created_by
  const openDuplicateMenu = () => {
    onOpenToolOverlay({ toolType: TOOL_DUPLICATE_DATASET })
    notification.destroy(NOT_YOUR_DATASET_AND_DIRTY_WARNING_KEY)
  }

  useEffect(() => {
    if (!isEqual(prevQueryDefRef.current, queryDefinition)) {
      // First time through prevQueryDefRef.current is undefined
      if (prevQueryDefRef.current) {
        machineSend('SET_DATASET_DIRTY', { dirty: true })

        // don't bother showing the warning if you came from a narrative
        if (notYourDataset && !hasWarnedNotYourDataset.current && !cameFromNarrative) {
          notification.warning({
            key: NOT_YOUR_DATASET_AND_DIRTY_WARNING_KEY,
            placement: 'topRight',
            message: 'This is not your dataset',
            description: (
              <Typography>
                You are editing a dataset that was created by someone else. Please{' '}
                <Button size="small" type="link" onClick={openDuplicateMenu} style={{ padding: 0, fontSize: '15px' }}>
                  duplicate it
                </Button>{' '}
                if you don't want your changes to affect their dataset
              </Typography>
            ),
            duration: null,
          })

          hasWarnedNotYourDataset.current = true
        }
      }

      // FIXME - will this cause garbage collection issues?
      // using cloneDeep so the reducer gets a whole new object, not just the
      // reference to the queryDefinition
      prevQueryDefRef.current = cloneDeep(queryDefinition)
    }
  }, [queryDefinition, machineSend, notYourDataset, cameFromNarrative])

  return null
}

interface StaleFormCheckerProps {
  datasetApiStates: IDatasetReducerState
}

// Check if the query definition run in each tab (from datasetReducer's datasetApiStates) OR
// the initial query definition (defined by initialQueryDefRef.current)
// is different from the machine's query definition
export const StaleFormChecker = ({ datasetApiStates }: StaleFormCheckerProps) => {
  const { machineCurrent, machineSend } = useContext(DatasetFormContext) || {}
  const staleTabsRef = useRef<string[]>([])
  const initialQueryDefRef = useRef<IDatasetQueryDefinition>()
  const queryDefinition = makeQueryDefinitionFromContext(machineCurrent.context)

  // Let's create a clone/copy of the INITIAL query definition
  // before ANY changes have been made. This should only be run ONCE
  useEffect(() => {
    if (!initialQueryDefRef.current) {
      initialQueryDefRef.current = cloneDeep(queryDefinition)
    }
  }, [queryDefinition])

  const machineStaleTabs = machineCurrent.context._stale_tabs

  useEffect(() => {
    const getStaleTabs = () => {
      // FOR THE PARENT TAB:
      // check only if the parent part of the query definition has changed,
      // and if it has, all the groups are stale as well!
      const parentApiStateQueryDefinition =
        get(datasetApiStates[RAW_DATASET_KEY], `[${ACTION_TYPE_QUERY}].queryDefinition`) || initialQueryDefRef.current

      if (
        parentApiStateQueryDefinition &&
        !isEqual(omit(queryDefinition.query, ['all_groups']), omit(parentApiStateQueryDefinition.query, ['all_groups']))
      ) {
        return keys(datasetApiStates)
      }

      // FOR GROUP TABS:
      // Check if only the group itself has changed
      return reduce(
        datasetApiStates,
        (result: string[], tabValue: any, tabKey: string) => {
          const tabQueryDefinition =
            get(tabValue, `[${ACTION_TYPE_QUERY}].queryDefinition`) || initialQueryDefRef.current

          // if tabQueryDefinition is empty you haven't run the table yet
          if (tabKey !== RAW_DATASET_KEY && tabQueryDefinition) {
            const groupDefinition = find(queryDefinition.query.all_groups, ['slug', tabKey])
            const apiStateGroupDefinition = find(tabQueryDefinition.query.all_groups, ['slug', tabKey])

            if (!isEqual(groupDefinition, apiStateGroupDefinition)) {
              return [...result, tabKey]
            }
          }

          return result
        },
        []
      )
    }

    const staleTabs = getStaleTabs()

    // If staleTabs is equal to staleTabsRef.current we've fired
    // SET_STALE_TABS already
    if (!isEqual(staleTabs, staleTabsRef.current)) {
      staleTabsRef.current = staleTabs

      // If the machine gets multiple events really quickly, the consequences of
      // SET_STALE_TABS haven't been fired so context._stale_tabs isn't up to
      // date when the comparison below happens:
      if (!isEqual(staleTabs, machineStaleTabs)) {
        machineSend('SET_STALE_TABS', { staleTabs })
      }
    }
  }, [machineStaleTabs, datasetApiStates, queryDefinition, machineSend])

  return null
}

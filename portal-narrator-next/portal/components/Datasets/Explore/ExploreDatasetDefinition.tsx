import { useMachine } from '@xstate/react'
import { App, Button, Collapse, Spin } from 'antd-next'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import DatasetDefinitionContent from 'components/Datasets/BuildDataset/tools/DatasetDefinition/DatasetDefinitionContent'
import { Box, Flex } from 'components/shared/jawns'
import { GetDatasetBySlugDocument, IActivity, useListActivitiesLazyQuery } from 'graph/generated'
import { isEmpty } from 'lodash'
import { buildDatasetMachine, machineServices } from 'machines/datasets'
import { useEffect, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { DatasetMachineState } from 'util/datasets/interfaces'
import { useImperativeQuery } from 'util/helpers'

import { isProduction } from '@/util/env'
import { getLogger } from '@/util/logger'

import { DatasetExploreOptions } from './interfaces'

const logger = getLogger()

interface Props {
  fetchExploreOptions: () => void
  loadingExploreOptions: boolean
  getExploreOptionsSuccessful: boolean
  exploreOptions?: DatasetExploreOptions
  datasetSlug?: string
}

const ExploreDatasetDefintion = ({
  fetchExploreOptions,
  loadingExploreOptions,
  getExploreOptionsSuccessful,
  exploreOptions,
  datasetSlug,
}: Props) => {
  const { notification } = App.useApp()
  const company = useCompany()
  const { tables } = company
  const { user } = useUser()
  const { getTokenSilently } = useAuth0()
  const {
    watch,
    reset,
    formState: { isValid },
  } = useFormContext()

  const getDatasetGraph = useImperativeQuery(GetDatasetBySlugDocument)

  const machine = useMemo(
    () =>
      buildDatasetMachine.withConfig({
        services: machineServices({
          company,
          user,
          getToken: getTokenSilently,
          getDatasetGraph,
        }),
      }),
    [company, user, getDatasetGraph, getTokenSilently]
  )

  const [machineCurrent, machineSend] = useMachine(machine, {
    devTools: !isProduction,
  })

  const definitionLoading = machineCurrent.matches({ api: 'loading_definition' })
  const definitionUpdating = machineCurrent.matches({ api: 'updating_definition' })
  const definitionSubmitting = machineCurrent.matches({ api: 'submitting_definition' })
  const definitionReconciling = machineCurrent.matches({ api: 'reconciling_response' })
  const processing = definitionUpdating || definitionSubmitting || definitionReconciling

  // mimmick get edit state ready
  useEffect(() => {
    if (machineSend && tables) {
      machineSend('NEW', { tables })
    }
  }, [machineSend, tables])

  useEffect(() => {
    if (getExploreOptionsSuccessful && exploreOptions) {
      machineSend('EXPLORER_RESET_DATASET_DEFINITION', {
        cohort: exploreOptions?.cohort,
        appendActivities: exploreOptions?.append_activities,
      })
    }
  }, [getExploreOptionsSuccessful, exploreOptions, machineSend])

  const { _definition_context: definitionContext, activity_stream: selectedActivityStream } = machineCurrent.context

  const [doActivitiesQuery, { data: activitiesData, error: activitiesQueryError }] = useListActivitiesLazyQuery({
    fetchPolicy: 'cache-and-network',
  })
  const streamActivities = (activitiesData?.all_activities || []) as IActivity[]

  // Wait for activityStream to be set, then get activities
  useEffect(() => {
    if (company.slug && selectedActivityStream) {
      doActivitiesQuery({
        variables: {
          activity_stream: selectedActivityStream,
          company_slug: company.slug,
        },
      })
    }
  }, [doActivitiesQuery, selectedActivityStream, company.slug])

  // hanlde activitiesQueryError notification
  useEffect(() => {
    if (activitiesQueryError) {
      notification.error({
        key: 'get-activities-error',
        message: 'Failed to fetch Activities',
        description: activitiesQueryError?.message,
        placement: 'topRight',
      })
    }
  }, [activitiesQueryError, notification])

  const formValues = watch()
  // Reset form state any time the machine's _definition_context updates
  useEffect(() => {
    if (definitionContext.form_value) {
      reset({
        ...formValues,
        ...definitionContext.form_value,
        // dataset config needs to be maintained from get_explore_options
        dataset_config: {
          ...formValues.dataset_config,
        },
      })
    }
  }, [definitionContext.form_value, reset])

  // Add activity_stream from get_explore_options
  useEffect(() => {
    if (machineSend && isEmpty(selectedActivityStream) && !isEmpty(formValues?.activity_stream?.activity_stream)) {
      // _ONLY makes sure not to reset other form data
      machineSend('SET_ACTIVITY_STREAM_ONLY', { activityStream: formValues.activity_stream.activity_stream })
    }
  }, [machineSend, selectedActivityStream, formValues?.activity_stream?.activity_stream])

  const cohortKpiLocked = !!formValues?.cohort?.kpi_locked

  // TODO: remove me. here for debugging
  // log whenever machine current changes
  useEffect(() => {
    const { event, _event, ...current } = machineCurrent
    logger.debug({ event, machine: current }, `Dataset state update ${event.type}`)
  }, [machineCurrent])

  return (
    <Collapse>
      <Collapse.Panel key="dataset-definition" header="Dataset Definition">
        <Spin spinning={processing || definitionLoading || loadingExploreOptions}>
          <DatasetDefinitionContent
            visible
            processing={processing}
            selectedActivityStream={selectedActivityStream}
            cohortKpiLocked={cohortKpiLocked}
            // TODO: we should set shouldSetDefaultActivityStream to true when in general explore
            // (not based off an existing dataset - i.e. start from scratch mode)
            shouldSetDefaultActivityStream={false}
            machineCurrent={machineCurrent as unknown as DatasetMachineState}
            machineSend={machineSend}
            streamActivities={streamActivities}
            datasetSlug={datasetSlug}
            isExplore
          />

          <Flex justifyContent="flex-end">
            <Box mr={6}>
              <Button
                type="primary"
                onClick={fetchExploreOptions}
                disabled={!isValid || loadingExploreOptions}
                loading={loadingExploreOptions}
              >
                Update Options
              </Button>
            </Box>
          </Flex>
        </Spin>
      </Collapse.Panel>
    </Collapse>
  )
}

export default ExploreDatasetDefintion

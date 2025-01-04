/* eslint-disable react/jsx-max-depth */
import { useMachine } from '@xstate/react'
import { Button, Flex, Spin } from 'antd-next'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import DatasetDefinitionContent from 'components/Datasets/BuildDataset/tools/DatasetDefinition/DatasetDefinitionContent'
import { Box } from 'components/shared/jawns'
import { IActivity, useListActivitiesLazyQuery } from 'graph/generated'
import { buildDatasetMachine, machineServices } from 'machines/datasets'
import { useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useEffectOnce } from 'react-use'
import { DatasetMachineState } from 'util/datasets/interfaces'

import { isProduction } from '@/util/env'
import { getLogger } from '@/util/logger'

import { FormValue } from './interfaces'
import RawAndGroupColumnFilters from './RawAndGroupColumnFilters'

const logger = getLogger()
interface Props {
  defaultValues: FormValue
  onSubmit: (values: FormValue) => Promise<void>
  isViewMode: boolean
}

// eslint-disable-next-line max-lines-per-function
const DatasetDefinitionForm = ({ defaultValues, onSubmit, isViewMode }: Props) => {
  const company = useCompany()
  const { tables } = company
  const { user } = useUser()
  const { getTokenSilently } = useAuth0()

  const machine = useMemo(
    () =>
      buildDatasetMachine.withConfig({
        services: machineServices({
          company,
          user,
          getToken: getTokenSilently,
        }),
      }),
    [company, user, getTokenSilently]
  )

  const [machineCurrent, machineSend] = useMachine(machine, {
    devTools: !isProduction,
  })

  // Logs machine updates
  useEffect(() => {
    const { event, _event, ...current } = machineCurrent
    logger.debug({ event, machine: current }, `Dataset state update ${event.type}`)
  }, [machineCurrent])

  const definitionLoading = machineCurrent.matches({ api: 'loading_definition' })
  const definitionUpdating = machineCurrent.matches({ api: 'updating_definition' })
  const definitionSubmitting = machineCurrent.matches({ api: 'submitting_definition' })
  const definitionReconciling = machineCurrent.matches({ api: 'reconciling_response' })
  const mainInNewState = machineCurrent.matches({ main: 'new' })
  const processing = definitionUpdating || definitionSubmitting || definitionReconciling

  // mimmick get edit state ready
  // (either new or load depending on if there was a dataset slug passed in)

  useEffect(() => {
    if (machineSend && tables) {
      machineSend('NEW', { tables })
    }
  }, [machineSend, tables])

  const methods = useForm<FormValue>({
    defaultValues,
    mode: 'all',
  })

  const {
    handleSubmit,
    formState: { isSubmitting },
    watch,
    reset,
  } = methods

  const handleSubmitFormValues = handleSubmit(async (formValue: FormValue) => {
    await onSubmit(formValue)
  })

  const { activity_stream: selectedActivityStream } = machineCurrent.context

  const [doActivitiesQuery, { data: activitiesData }] = useListActivitiesLazyQuery({
    fetchPolicy: 'cache-and-network',
  })
  const streamActivities = (activitiesData?.all_activities || []) as IActivity[]

  useEffect(() => {
    if (machineSend && !selectedActivityStream && !!defaultValues?.activity_stream?.activity_stream && mainInNewState) {
      // _ONLY makes sure not to reset other form data
      machineSend('SET_ACTIVITY_STREAM_ONLY', { activityStream: defaultValues.activity_stream.activity_stream })
    }
  }, [machineSend, selectedActivityStream, defaultValues?.activity_stream?.activity_stream, mainInNewState])

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

  useEffectOnce(() => {
    if (defaultValues) {
      machineSend('CHAT_RESET_DATASET_DEFINITION', {
        ...defaultValues,
      })
    }
  })

  const formValues = watch()
  // Reset form state any time the machine's _definition_context updates
  const definitionContext = machineCurrent.context._definition_context
  useEffect(() => {
    if (definitionContext.form_value) {
      reset({
        ...definitionContext.form_value,
        // VALUES BELOW come from message... do we need to reset them
        // when we update the definition (hit update button)?
        columns: formValues.columns,
        filters: formValues.filters,
        group_columns: formValues.group_columns,
        group_filters: formValues.group_filters,
      })
    }
  }, [definitionContext.form_value, reset])

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmitFormValues}>
        <Spin spinning={processing || definitionLoading}>
          <Box p={3}>
            <DatasetDefinitionContent
              processing={processing}
              selectedActivityStream={selectedActivityStream}
              // TODO: we should set shouldSetDefaultActivityStream to true when in general explore
              // (not based off an existing dataset - i.e. start from scratch mode)
              shouldSetDefaultActivityStream={false}
              machineCurrent={machineCurrent as unknown as DatasetMachineState}
              machineSend={machineSend}
              streamActivities={streamActivities}
              visible
              hideActivityStreamSelect
              isExplore
              isViewMode={isViewMode}
            />
            <Box pt={2}>
              <RawAndGroupColumnFilters isViewMode={isViewMode} />
            </Box>
          </Box>

          {!isViewMode && (
            <Flex justify="flex-end">
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                Update
              </Button>
            </Flex>
          )}
        </Spin>
      </form>
    </FormProvider>
  )
}

export default DatasetDefinitionForm

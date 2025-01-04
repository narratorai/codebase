import { Button, Modal, Spin } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { compact, find, get, isEmpty, map } from 'lodash'
import { makeQueryDefinitionFromContext } from 'machines/datasets'
import { useCallback, useContext, useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { getGroupFromContext } from 'util/datasets'
import { IDatasetFormContext } from 'util/datasets/interfaces'
import { useLazyCallMavis } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

import FormItems from './FormItems'
import { GetSpendOptionsResponse } from './interfaces'
import NoAggTableText from './NoAggTableText'

const getMetricsFromOptions = ({
  metricOptions = [],
  metricValues = [],
}: {
  metricOptions?: GetSpendOptionsResponse['metric_options']
  metricValues?: string[]
}) => {
  return compact(map(metricValues, (metricValue) => find(metricOptions, ['id', metricValue])))
}

const SpendConfigModal = () => {
  const { groupSlug, machineCurrent, machineSend } = useContext<IDatasetFormContext>(DatasetFormContext) || {}

  const submitting = machineCurrent.matches({ api: 'submitting_edit_spend_columns' })

  const group = getGroupFromContext({ context: machineCurrent.context, groupSlug })

  // Add default spend: {}, if adding spend from scratch:
  const isEdit = get(group, 'spend.columns', []).length > 0

  const initialValues = isEdit
    ? group
    : {
        ...group,
        spend: {},
      }

  const methods = useForm<any>({
    defaultValues: initialValues,
    mode: 'all',
  })
  const { handleSubmit, formState, reset } = methods
  const { isValid } = formState

  // fired on Modal load or whenever the table gets updated
  const [getSpendOptions, { response: spendOptions, loading: spendOptionsLoading, error: spendOptionsError }] =
    useLazyCallMavis<GetSpendOptionsResponse>({
      method: 'POST',
      path: '/v1/dataset/create/get_spend_options',
    })
  const prevSpendOptionsLoading = usePrevious(spendOptionsLoading)

  // fires getSpendOptions with needed info
  const handleGetSpendOptions = useCallback(
    // tableLabel is passed when manually updating the table
    (tableLabel?: string) => {
      // make queryDefinition so Mavis can determine the correct default metrics/joins/table
      const queryDefinition = makeQueryDefinitionFromContext(machineCurrent.context)

      // only send table when updating the selected table manually
      // if table is passed - current metrics/joins will be reset to defaults on getSpendOptions success
      const table = tableLabel ? find(spendOptions?.table_options, ['label', tableLabel]) : null

      getSpendOptions({ body: { group_slug: groupSlug, dataset: queryDefinition, table } })
    },
    [machineCurrent.context, getSpendOptions, groupSlug, spendOptions?.table_options]
  )

  // get spend options when this modal mounts
  useEffect(() => {
    if (isEmpty(spendOptions) && !spendOptionsLoading && !spendOptionsError) {
      handleGetSpendOptions()
    }
  }, [spendOptions, spendOptionsLoading, spendOptionsError, handleGetSpendOptions])

  // reset form state when spendOptions are returned successfully
  useEffect(() => {
    if (prevSpendOptionsLoading && !spendOptionsLoading && !spendOptionsError && !isEmpty(spendOptions)) {
      reset({
        ...group,
        // reset spend formValues to spendOptions defaults
        spend: {
          joins: spendOptions?.join_defaults,
          spend_table: spendOptions?.table_default,
          metrics: map(spendOptions?.metric_defaults, (metricDefault) => metricDefault.id),
        },
      })
    }
  }, [spendOptions, prevSpendOptionsLoading, spendOptionsLoading, spendOptionsError, group, reset])

  const onClose = () => {
    machineSend('EDIT_SPEND_CANCEL')
  }

  // Add table/metrics/joins to the group
  const onSubmit = handleSubmit((formValue: any) => {
    const {
      spend: { joins, metrics, spend_table },
    } = formValue

    const selectedMetricOptions = getMetricsFromOptions({
      metricValues: metrics,
      metricOptions: spendOptions?.metric_options,
    })

    machineSend('SUBMITTING_EDIT_SPEND_COLUMNS', {
      joins,
      metrics: selectedMetricOptions,
      table: spend_table,
      groupSlug,
    })
  })

  const tableOptions = useMemo(() => {
    if (!isEmpty(spendOptions?.table_options)) {
      return map(spendOptions?.table_options, (op) => ({ label: op.label, value: op.label }))
    }

    // default to empty if no spend options
    return []
  }, [spendOptions])

  const metricOptions = useMemo(() => {
    if (!isEmpty(spendOptions?.metric_options)) {
      return map(spendOptions?.metric_options, (option) => ({ label: option.label, value: option.id }))
    }

    return []
  }, [spendOptions?.metric_options])

  if (!group) {
    return null
  }

  const noTableOptionsAvailable = isEmpty(tableOptions) && !spendOptionsLoading && !spendOptionsError

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <Modal
          title={<Typography type="title400">Join on Aggregated Data</Typography>}
          onCancel={onClose}
          open // this modal is conditionally rendered
          footer={
            noTableOptionsAvailable ? null : (
              <Flex>
                <Box>
                  <Button key="submit" type="primary" disabled={!isValid} onClick={onSubmit} loading={submitting}>
                    {isEdit ? 'Update' : 'Add Spend Columns'}
                  </Button>
                  <Button key="back" onClick={onClose}>
                    Cancel
                  </Button>
                </Box>
              </Flex>
            )
          }
        >
          <Spin spinning={spendOptionsLoading}>
            {noTableOptionsAvailable && <NoAggTableText />}

            {!noTableOptionsAvailable && (
              <FormItems
                metricOptions={metricOptions}
                tableOptions={tableOptions}
                joinColumns={spendOptions?.join_columns}
                handleGetSpendOptions={handleGetSpendOptions}
              />
            )}
          </Spin>
        </Modal>
      </form>
    </FormProvider>
  )
}

export default SpendConfigModal

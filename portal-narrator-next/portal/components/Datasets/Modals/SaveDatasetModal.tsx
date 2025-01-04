import { Alert, Spin } from 'antd-next'
import { Modal } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import DatasetLockedIcon from 'components/Datasets/DatasetLockedIcon'
import { useUpdateDataset } from 'components/Datasets/hooks'
import { DatasetFromQuery } from 'components/Datasets/interfaces'
import { getSharedCompanyTags } from 'components/shared/IndexPages/helpers'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { IListCompanyTagsQuery, IStatus_Enum } from 'graph/generated'
import { includes, isEmpty, map } from 'lodash'
import { useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useHistory } from 'react-router-dom'

import DatasetFormFields from './DatasetFormFields'

interface Props {
  dataset?: DatasetFromQuery
  onClose: () => void
  queryDefinition?: any
  onCreateSuccess?: (slug?: string) => void
  onUpdateSuccess?: () => void
}

interface FormValue extends DatasetFromQuery {
  share_with_tag_ids: string[]
}

const SaveDatasetModal = ({ dataset, onClose, queryDefinition, onCreateSuccess, onUpdateSuccess }: Props) => {
  const company = useCompany()
  const history = useHistory()
  const { isSuperAdmin } = useUser()

  // if there was no passed dataset, it is a new dataset:
  const isCreating = !dataset

  const companyTags = map(dataset?.tags, (tag) => tag.company_tag) as IListCompanyTagsQuery['company_tags']
  const datasetWithFields = {
    ...dataset,
    share_with_tag_ids: map(getSharedCompanyTags(companyTags), (sharedTag) => sharedTag.id),
  }

  const initialValues = isCreating ? { status: IStatus_Enum.InProgress } : datasetWithFields

  const methods = useForm<FormValue>({ defaultValues: initialValues, mode: 'all' })
  const { handleSubmit, formState, watch } = methods
  const { isValid } = formState

  const datasetLockedInForm = watch('locked')

  const allowSaveForLocked = useMemo(() => {
    // check if form started as unlocked, but they are updating to locked
    // let them save
    // (have to give them a way to lock it via save)
    if (!dataset?.locked && datasetLockedInForm) {
      return true
    }

    // otherwise - only let them save if the form is now set to unlocked
    return !datasetLockedInForm
  }, [dataset?.locked, datasetLockedInForm])

  const [updateDataset, { saved, loading, error, data }] = useUpdateDataset({
    isCreating,
    onCreateSuccess,
    onUpdateSuccess,
  })

  const onSubmit = handleSubmit((form: FormValue) => {
    updateDataset({
      // NOTE - queryDefinition will be blank when on the dataset index page
      // It will be present when editing an existing or creating a new dataset
      queryDefinition: queryDefinition || null,
      name: form.name,
      id: dataset?.id,
      slug: dataset?.slug,
      description: form.description,
      status: form.status,
      materializations: dataset?.materializations || [],
      created_by: isSuperAdmin && !isEmpty(form.created_by) ? form.created_by : dataset?.created_by,
      hide_from_index: form.hide_from_index,
      tags: form.share_with_tag_ids,
      locked: form.locked,
    })
  })

  useEffect(() => {
    if (saved && data) {
      // For new datasets - push to new url once save is complete!
      if (isCreating && data?.dataset_slug) {
        // if they were on v2, send them to the edit v2 (otherwise v1 -> v1)
        const editVersion = includes(history.location.pathname, 'new.v2') ? 'edit.v2' : 'edit'

        // This setTimeout is just to make sure the form isn't dirty before changing the url
        // (preventing PreventBack from firing unnecessarily):
        setTimeout(() => {
          history.push(`/${company.slug}/datasets/${editVersion}/${data?.dataset_slug}`)
        }, 1000)
      }
    }
  }, [saved, data, history, isCreating, company])

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <Modal
          data-test="save-dataset-modal"
          title={
            dataset ? (
              <Flex alignItems="center">
                <Typography type="title400">
                  Update: <b>{dataset?.name}</b>
                </Typography>

                {dataset.locked && (
                  <Box ml={1}>
                    <DatasetLockedIcon />
                  </Box>
                )}
              </Flex>
            ) : (
              <Typography type="title400">Save New Dataset</Typography>
            )
          }
          open
          onCancel={onClose}
          okText={isCreating ? 'Save' : 'Update'}
          onOk={onSubmit}
          okButtonProps={{ disabled: !isValid || !allowSaveForLocked }}
        >
          {error && (
            <Box mb={2}>
              <Alert message="Error" description={error.message} type="error" closable showIcon />
            </Box>
          )}

          <Spin spinning={loading}>
            <DatasetFormFields />
          </Spin>
        </Modal>
      </form>
    </FormProvider>
  )
}

export default SaveDatasetModal

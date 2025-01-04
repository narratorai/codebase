import { SaveOutlined } from '@ant-design/icons'
import { Modal } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { DashboardType } from 'components/Narratives/Dashboards/DashboardIndex/interfaces'
import { useUpdateNarrativeMeta } from 'components/Narratives/hooks'
import { GetFileAPIReturn } from 'components/Narratives/interfaces'
import { getSharedCompanyTags } from 'components/shared/IndexPages/helpers'
import { Typography } from 'components/shared/jawns'
import { IListCompanyTagsQuery, INarrative, INarrative_Types_Enum, IStatus_Enum } from 'graph/generated'
import { isEmpty, map, snakeCase } from 'lodash'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useHistory } from 'react-router-dom'
import { makeShortid } from 'util/shortid'
import usePrevious from 'util/usePrevious'

import SaveNarrativeForm from '../SaveNarrativeForm'

interface FormValue extends INarrative {
  share_with_tag_ids?: string[]
}

interface Props {
  canArchive: boolean
  onClose: () => void
  onSubmitFinish?: (slug: string) => void
  onCreateSuccess?: (slug: string) => void
  narrative?: INarrative | DashboardType
  narrativeConfig?: GetFileAPIReturn
  setRefreshIndex?: (shouldRefresh: boolean) => void
  isDashboard?: boolean
}

const SaveNarrativeModal = ({
  canArchive,
  onClose,
  narrative,
  narrativeConfig,
  setRefreshIndex,
  onSubmitFinish,
  onCreateSuccess,
  isDashboard = false,
}: Props) => {
  const { isSuperAdmin } = useUser()
  const company = useCompany()
  const history = useHistory()

  // For EDIT narratives
  const [
    updateNarrative,
    {
      loading: updateNarrativeLoading,
      error: updateNarrativeError,
      saved: updateNarrativeSaved,
      response: updateNarrativeResponse,
    },
  ] = useUpdateNarrativeMeta()

  const prevUpdateNarrativeSaved = usePrevious(updateNarrativeSaved)
  const updateSuccess = !prevUpdateNarrativeSaved && updateNarrativeSaved

  // Only pass a narrative if it already exists (hence edit)
  const isEdit = !isEmpty(narrative)

  const companyTags = map(narrative?.tags, (tag) => tag.company_tag) as IListCompanyTagsQuery['company_tags']
  const initialValues = isEdit
    ? {
        ...narrative,
        share_with_tag_ids: map(getSharedCompanyTags(companyTags), (sharedTag) => sharedTag.id),
      }
    : {
        state: IStatus_Enum.InProgress,
        type: isDashboard ? INarrative_Types_Enum.Dashboard : INarrative_Types_Enum.Analysis,
      }

  const methods = useForm<FormValue>({
    defaultValues: initialValues,
    mode: 'all',
  })

  const { handleSubmit } = methods

  // close the modal on successful update save
  useEffect(() => {
    if (updateNarrativeSaved && isEdit) {
      if (setRefreshIndex) {
        // even though narrative index is a subscription
        // b/c we are doing lazy load we only refresh the cards
        // when the length changes
        // So, force refresh when we update config so it's up-to-date
        setRefreshIndex(true)
      }
      onClose()
    }
  }, [updateNarrativeSaved, onClose, isEdit, setRefreshIndex])

  useEffect(() => {
    // If you successfully create a narrative
    // - navigate to edit page of new narrative
    if (updateSuccess && !isEdit && updateNarrativeResponse?.narrative_slug) {
      onCreateSuccess?.(updateNarrativeResponse?.narrative_slug)

      const goToNewNarrative = () => {
        history.push(
          `/${company.slug}/${
            isDashboard ? 'dashboards' : 'narratives'
          }/edit/${updateNarrativeResponse?.narrative_slug}`
        )
      }

      // allow create success to run first before navigating
      setTimeout(goToNewNarrative, 0)
    }
  }, [updateSuccess, isEdit, updateNarrativeResponse, company, history, onCreateSuccess, isDashboard])

  const onSubmit = handleSubmit(async (form: FormValue) => {
    // create unique slug for new narratives
    const slug = `${snakeCase(form.name)}_${makeShortid()}`
    const category = form.company_category?.category ? snakeCase(form.company_category?.category) : undefined

    await updateNarrative({
      narrative_id: narrative?.id,
      name: form.name,
      slug: isEdit ? narrative!.slug : slug,
      state: form.state,
      description: form.description as string | undefined,
      category,
      schedule: form.company_task?.schedule,
      requested_by: form.requested_by,
      isEdit,
      type: form.type as INarrative_Types_Enum,
      // double check that user is super user before updating created_by
      created_by: isSuperAdmin && !isEmpty(form.created_by) ? form.created_by : narrative?.created_by,
      tags: form.share_with_tag_ids,
      config: narrativeConfig,
    })

    if (onSubmitFinish) {
      await onSubmitFinish(slug)
    }
  })

  const loading = updateNarrativeLoading

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <Modal
          data-test="save-narrative-overlay"
          title={
            <Typography type="title400">
              {isEdit
                ? `Update ${isDashboard ? 'Dashboard' : 'Analysis'}`
                : `Save ${isDashboard ? 'Dashboard' : 'Analysis'}`}
            </Typography>
          }
          open
          okText={isEdit ? 'Save' : 'Create'}
          okButtonProps={{
            icon: <SaveOutlined />,
            disabled: loading,
            type: 'primary',
            onClick: onSubmit,
            // @ts-ignore
            'data-test': 'create-new-narrative-button',
          }}
          onCancel={() => {
            onClose()
          }}
        >
          <SaveNarrativeForm canArchive={canArchive} loading={loading} />

          {updateNarrativeError && <Typography color="red500">{updateNarrativeError.message}</Typography>}
        </Modal>
      </form>
    </FormProvider>
  )
}

export default SaveNarrativeModal

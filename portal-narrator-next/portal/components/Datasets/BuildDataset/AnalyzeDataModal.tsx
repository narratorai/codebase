import { InfoCircleOutlined, SyncOutlined } from '@ant-design/icons'
import { App, Button, Checkbox, Input, Modal, Result, Select, Switch, Tooltip } from 'antd-next'
import { FormItem, SearchSelect, SearchSelectOptionProps } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import RenameKpi from 'components/Datasets/BuildDataset/RenameKpi'
import { TimeSegmentationSelect } from 'components/Datasets/BuildDataset/tools/shared'
import {
  useCreateDatasetNarrative,
  useDebugDatasetNarrative,
  useListNarrativeTemplateOptions,
} from 'components/Datasets/hooks'
import { useAssembleNarrative, useUpdateNarrativeMeta } from 'components/Narratives/hooks'
import { Box, Flex, Link, ListItemCard, Typography } from 'components/shared/jawns'
import Mark from 'components/shared/Mark'
import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import { IStatus_Enum, useGetNarrativeBySlugQuery } from 'graph/generated'
import { find, findIndex, includes, isEmpty } from 'lodash'
import { makeQueryDefinitionFromContext } from 'machines/datasets'
import { useCallback, useContext, useEffect, useState } from 'react'
import { Field, Form } from 'react-final-form'
import { openChat } from 'util/chat'
import { makeColumnSearchSelectOptions } from 'util/datasets'
import { DatasetKpiBodyProps, DatasetNarrativeBodyProps } from 'util/datasets/api'
import { required } from 'util/forms'

import KpiFormatSelect from './KpiFormatSelect'
import TimeOptionSelect from './TimeOptionSelect'

const { Option } = Select

const INCREASE_LABEL_VALUE = 'increase'
const DECREASE_LABEL_VALUE = 'decrease'
const TIME_OPTION_FIELDNAME = 'time_option_id'

interface Props {
  onClose: () => void
  setOpening?: (opening: boolean) => void
}

const AnalyzeDataModal = ({ onClose, setOpening }: Props) => {
  const company = useCompany()
  const { user } = useUser()
  const { notification } = App.useApp()

  // set kpiOptions to state so user can over-write the labels later
  const [kpiOptions, setKpiOptions] = useState<{ label: string; value: string }[]>([])
  const [showFilterData, setShowFilterData] = useState(false)

  const [shownMarkdown, setShownMarkdown] = useState('')

  // when submitting the request to create a narrative template
  // save the submit body, in case we need it to debug
  // a failed assemble narrative
  const [lastSubmittedBody, setLastSubmittedBody] = useState<DatasetNarrativeBodyProps | DatasetKpiBodyProps>()

  const toggleShowFilterData = () => {
    setShowFilterData((prev) => !prev)
  }

  const { machineCurrent, streamActivities } = useContext(DatasetFormContext) || {}

  // initial request to get the dropdown options for this form
  const [getTemplateOptions, { data: templateOptions, loading: templateOptionsLoading, error: templateOptionsError }] =
    useListNarrativeTemplateOptions()

  // update "Analyze" button in GlobalCTA to spin
  // when retreiving initial options
  // (b/c modal is inside form - sometimes there is a lag between clicking the button
  // and the modal opening - the options are being built)
  useEffect(() => {
    if (setOpening) {
      setOpening(templateOptionsLoading)
    }
  }, [setOpening, templateOptionsLoading])

  // used for on submit: hitting 'Run Analysis'
  const [createNarrativeTemplate, { data: narTemplateData, loading: narTemplateLoading }] = useCreateDatasetNarrative()

  // when narrative template data comes back
  // set it's markdown to shownMarkdown
  useEffect(() => {
    if (!isEmpty(narTemplateData?.markdown)) {
      setShownMarkdown(narTemplateData?.markdown)
    }
  }, [narTemplateData?.markdown])

  // assembled the narrative once we get back a narrativeSlug from 'getTemplate'
  const [assembleNarrative, { response: assembled, loading: assembling, error: errorAssembling }] =
    useAssembleNarrative()

  //  used if assembling the narrative doesn't work
  // show markdown/maybe helpscout info to show
  const [debugNarrativeTemplate, { data: debugData }] = useDebugDatasetNarrative()

  // if assembling narrative fails and there is helpscout message
  useEffect(() => {
    if (debugData?.open_helpscout && !isEmpty(debugData?.helpscout_message)) {
      // open chat with the helpscout message pre-populated
      openChat({ subject: 'Error creating analysis', text: debugData.helpscout_message })
    }
  }, [debugData?.open_helpscout, debugData?.helpscout_message])

  const { data: narrativeBySlugData } = useGetNarrativeBySlugQuery({
    variables: {
      slug: narTemplateData?.narrative_slug,
      company_id: company?.id,
      user_id: user.id,
    },
    skip: !narTemplateData?.narrative_slug,
  })
  const createdNarrative = narrativeBySlugData?.narrative?.[0]

  const [updateNarrative, { loading: deletingNarrative, error: deleteNarrativeError, saved: narrativeDeleted }] =
    useUpdateNarrativeMeta()

  const queryDefinition = makeQueryDefinitionFromContext(machineCurrent.context)

  useEffect(() => {
    if (queryDefinition && !templateOptionsLoading && isEmpty(templateOptions) && isEmpty(templateOptionsError)) {
      const body = {
        dataset: { ...queryDefinition },
      }
      getTemplateOptions(body)
    }
  }, [queryDefinition, templateOptionsLoading, templateOptions, templateOptionsError, getTemplateOptions])

  // initialize kpi options
  useEffect(() => {
    if (templateOptions && !isEmpty(templateOptions?.kpis)) {
      setKpiOptions(templateOptions.kpis)
    }
  }, [templateOptions, setKpiOptions])

  const updateKpiLabel = useCallback(
    ({ label, value }: { label: string; value: string }) => {
      // find kpi option based on value (that isn't changing)
      const indexOfUpdatedKpi = findIndex(kpiOptions, { value: value })

      // uptate that value's label
      const newKpiOptions = [...kpiOptions]
      newKpiOptions[indexOfUpdatedKpi] = { label, value }

      setKpiOptions(newKpiOptions)
    },
    [kpiOptions, setKpiOptions]
  )

  // assemble narrative once created by narrative template
  useEffect(() => {
    if (narTemplateData?.narrative_slug && assembleNarrative) {
      assembleNarrative({ narrative: { slug: narTemplateData.narrative_slug } })
    }
  }, [narTemplateData?.narrative_slug, assembleNarrative])

  const onSubmit = (submitData: {
    feature: string
    kpi: string
    kpi_format: string
    impact_direction: string
    time_resolution: string
    row_name: string
    [TIME_OPTION_FIELDNAME]?: string
  }) => {
    // clear markdown
    setShownMarkdown('')

    const body = {
      feature_id: submitData.feature,
      feature_label: find(templateOptions?.features, ['value', submitData.feature])?.label,
      kpi_id: submitData.kpi,
      kpi_label: find(kpiOptions, ['value', submitData.kpi])?.label,
      kpi_format: submitData.kpi_format,
      impact_direction: submitData.impact_direction,
      time_resolution: submitData.time_resolution,
      row_name: submitData.row_name,
      [TIME_OPTION_FIELDNAME]:
        // don't use the TIME_OPTION_FIELDNAME value if they unchecked the "show filter data" checkbox
        showFilterData && submitData[TIME_OPTION_FIELDNAME] ? submitData[TIME_OPTION_FIELDNAME] : null,
      dataset: { ...queryDefinition },
    }

    setLastSubmittedBody(body)

    // create narrative template
    createNarrativeTemplate(body)
  }

  // if there is a narrative allow user to delete narrative on cancel
  // (if there was an error assembling, Mavis will cancel in the background)
  const cancelText = !isEmpty(createdNarrative) && isEmpty(errorAssembling) ? 'Cancel and Delete' : 'Cancel'

  const onCancel = useCallback(() => {
    if (createdNarrative && company?.id && isEmpty(errorAssembling)) {
      // delete narrative by updating its state to archived
      updateNarrative({
        name: createdNarrative.name,
        slug: createdNarrative.slug,
        state: IStatus_Enum.Archived, // This is the soft delete
        description: createdNarrative.description || undefined,
        category: createdNarrative.company_category?.category,
        created_by: createdNarrative.created_by,
        type: createdNarrative.type,
      })

      // if you are deleting the narrative,
      // wait for the delete to finish before closing the modal
      // so you can show a notification that it has been deleted
      // see onClose in useEffect below that triggers the notification
    } else {
      // if there is no narrative slug or an error assembling
      // (if there is an error Mavis will delete the narrative/dataset)
      // close the modal
      onClose()
    }
  }, [onClose, createdNarrative, updateNarrative, errorAssembling, company?.id])

  // on delete of narrative
  // fire notification and close modal
  useEffect(() => {
    const deletedNarrativeName = createdNarrative?.name
    if (narrativeDeleted && deletedNarrativeName && !deleteNarrativeError && !deletingNarrative) {
      notification.success({
        key: 'soft-delete-narrative-template-success',
        placement: 'topRight',
        message: `You have successfully deleted ${deletedNarrativeName}`,
      })

      onClose()
    }
  }, [narrativeDeleted, createdNarrative, deleteNarrativeError, deletingNarrative, onClose, notification])

  // fire debug_dataset_narrative if assemble narrative fails
  useEffect(() => {
    if (errorAssembling) {
      const bodyWithMeta = {
        ...lastSubmittedBody,
        dataset_slug: narTemplateData?.dataset_slug,
        narrative_slug: narTemplateData?.narrative_slug,
      }

      debugNarrativeTemplate(bodyWithMeta)
    }
  }, [errorAssembling, debugNarrativeTemplate, lastSubmittedBody, narTemplateData])

  // set markdown to debug if it changes
  useEffect(() => {
    if (!isEmpty(debugData?.markdown) && typeof debugData?.markdown === 'string') {
      setShownMarkdown(debugData?.markdown)
    }
  }, [debugData?.markdown])

  const timeToConvertOptions = templateOptions?.time_to_convert_options || []

  const featureOptions = templateOptions?.features
  const featureOptionValues = featureOptions?.map((op) => op.value)
  // can't use ColumnSelect since it creates it's own columns
  // use columns from Mavis response to create similar ui as ColumnSelect
  const formattedFeatureOptions = makeColumnSearchSelectOptions({
    activities: streamActivities,
    queryDefinition: makeQueryDefinitionFromContext(machineCurrent.context),
  }).filter((col) => includes(featureOptionValues, col.value))

  const handleCreateFeatureOptionContent = ({
    searchValue,
    option,
  }: {
    searchValue: string
    option: SearchSelectOptionProps
  }) => (
    <Option key={option.value} label={option.label} value={option.value}>
      <Flex justifyContent="space-between" alignItems="center">
        <Box data-test="column-select-label-enabled">
          <Mark value={option.label} snippet={searchValue} />
        </Box>
        <Box px={1}>
          <Typography type="body300" color="gray500">
            {option.type}
          </Typography>
        </Box>
      </Flex>
    </Option>
  )

  if (templateOptionsLoading) {
    return null
  }

  const initialValues = {
    impact_direction: INCREASE_LABEL_VALUE,
    feature: featureOptions?.[0]?.value,
    kpi: kpiOptions?.[0]?.value,
    kpi_format: templateOptions?.kpi_formats?.[0],
    time_resolution: 'month',
    row_name: templateOptions?.row_name || '',
  }

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={initialValues}
      render={({ handleSubmit, invalid }) => (
        <Modal
          open
          title="Create Narrative Template"
          onOk={handleSubmit}
          okText="Run Analysis"
          okButtonProps={{
            // @ts-ignore
            'data-test': 'confirm-run-analysis',
            loading: narTemplateLoading,
            disabled: invalid || assembled || assembling,
          }}
          cancelText={cancelText}
          cancelButtonProps={{
            onClick: onCancel,
            loading: deletingNarrative,
          }}
          // keep onCancel below cancelButtonProps
          // so cancelButtonProps.onClick logic does not get over-written (can handle delete narrative too)
          onCancel={onClose}
          style={{ minWidth: '740px' }}
        >
          <Box>
            <ListItemCard removable={false}>
              <Flex alignItems="center" justifyContent="center">
                <Typography mr={1}>Goal:</Typography>
                <Box mr={1}>
                  <Field
                    name="impact_direction"
                    validate={required}
                    render={({ input }) => {
                      const checked = input.value === INCREASE_LABEL_VALUE
                      const onChange = () => {
                        input.onChange(checked ? DECREASE_LABEL_VALUE : INCREASE_LABEL_VALUE)
                      }
                      return (
                        <Switch
                          checkedChildren="Increase"
                          unCheckedChildren="Decrease"
                          checked={checked}
                          onChange={onChange}
                        />
                      )
                    }}
                  />
                </Box>

                <Field
                  name="kpi"
                  validate={required}
                  render={({ input }) => (
                    <Flex>
                      <SearchSelect
                        data-test="analyze-modal-kpi-select"
                        options={kpiOptions}
                        popupMatchSelectWidth={false}
                        getPopupContainer={(trigger) => trigger.parentNode}
                        showSearch
                        {...input}
                        style={{ minWidth: '200px', maxWidth: '400px' }}
                      />
                      <Box ml={1}>
                        <RenameKpi
                          selectedKpi={find(kpiOptions, ['value', input.value])}
                          updateKpiLabel={updateKpiLabel}
                        />
                      </Box>
                    </Flex>
                  )}
                />

                <Box ml={1}>
                  <KpiFormatSelect kpis={templateOptions?.kpis} kpiFormats={templateOptions?.kpi_formats} />
                </Box>
              </Flex>
            </ListItemCard>

            <Field
              name="feature"
              validate={required}
              render={({ input, meta }) => (
                <FormItem meta={meta} label="Analyze influence of:" required labelCol={{ span: 6, offset: 3 }}>
                  <SearchSelect
                    data-test="analyze-modal-impact-select"
                    options={formattedFeatureOptions}
                    createOptionContent={handleCreateFeatureOptionContent}
                    isGrouped
                    optionFilterProp="label"
                    optionLabelProp="label"
                    popupMatchSelectWidth={false}
                    getPopupContainer={(trigger) => trigger.parentNode}
                    showSearch
                    {...input}
                    style={{ minWidth: '100px' }}
                  />
                </FormItem>
              )}
            />

            <>
              <FormItem label="By:" required labelCol={{ span: 6, offset: 3 }}>
                <TimeSegmentationSelect
                  fieldName="time_resolution"
                  getPopupContainer={(trigger: any) => trigger.parentNode}
                  useSimpleOptions
                />
              </FormItem>

              <Field
                name="row_name"
                validate={required}
                render={({ input, meta }) => (
                  <FormItem
                    meta={meta}
                    label="Each row in dataset is a:"
                    required
                    hasFeedback
                    labelCol={{ span: 6, offset: 3 }}
                  >
                    <Input {...input} />
                  </FormItem>
                )}
              />

              {timeToConvertOptions && !isEmpty(timeToConvertOptions) && (
                <FormItem wrapperCol={{ offset: 9 }}>
                  <Flex>
                    <Checkbox checked={showFilterData} onChange={toggleShowFilterData}>
                      Filter data for people who can still convert{' '}
                    </Checkbox>
                    <Tooltip title="In optimizing conversion we don't want to penalize recent data because a customer can still convert so we filter out the recent data based on how long it takes 80% of customers to convert.">
                      <div>
                        <InfoCircleOutlined />
                      </div>
                    </Tooltip>
                  </Flex>
                </FormItem>
              )}

              {showFilterData && (
                <Box mt={1}>
                  <TimeOptionSelect timeToConvertOptions={timeToConvertOptions} />
                </Box>
              )}
            </>

            {narTemplateData && (
              <>
                <Box mb={2}>
                  {assembled && !assembling && (
                    <Result
                      status="success"
                      title="Your Narrative is ready"
                      subTitle={narTemplateData.narrative_name}
                      extra={[
                        <Box key="narrative-template-success-content">
                          <Box mb={2}>
                            <Link
                              to={`/narratives/a/${narTemplateData.narrative_slug}`}
                              key="go-to-narrative"
                              target="_blank"
                              data-test="go-to-narrative-template-link"
                            >
                              <Button type="primary">Go to Narrative</Button>
                            </Link>
                          </Box>

                          <Box>
                            <Link
                              to={`/datasets/edit/${narTemplateData.dataset_slug}`}
                              target="_blank"
                              data-test="go-to-dataset-template-link"
                            >
                              <Button>Go to Dataset</Button>
                            </Link>
                          </Box>
                        </Box>,
                      ]}
                    />
                  )}
                </Box>

                {!assembled && !isEmpty(shownMarkdown) && <MarkdownRenderer source={shownMarkdown} />}

                {assembling && (
                  <Box mt={2}>
                    <Button type="text" icon={<SyncOutlined />} loading>
                      Assembling the Narrative
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Modal>
      )}
    />
  )
}

export default AnalyzeDataModal

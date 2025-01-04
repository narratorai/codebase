import { LockFilled } from '@ant-design/icons'
import { App, Button, Layout, Result, Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import AssemblingModal from 'components/Narratives/BuildNarrative/AssemblingModal'
import BuildNarrativeContent from 'components/Narratives/BuildNarrative/BuildNarrativeContent'
import BuildNarrativeProvider from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import ConfigUpdatedNotification from 'components/Narratives/BuildNarrative/ConfigUpdatedNotification'
import BuildDashboard from 'components/Narratives/Dashboards/BuildDashboard/BuildDashboard'
import { DASHBOARD_BACKGROUND_COLOR } from 'components/Narratives/Dashboards/BuildDashboard/constants'
import {
  useAssembleFields,
  useAssembleNarrative,
  useLoadAutocomplete,
  useLoadConfig,
  useLoadSchemas,
  useNotificationEffect,
  useUpdateConfig,
} from 'components/Narratives/hooks'
import useGetDatasets from 'components/Narratives/hooks/v2/useGetDatasets'
import { Flex, Link, Typography } from 'components/shared/jawns'
import { useLayoutContext } from 'components/shared/layout/LayoutProvider'
import Page from 'components/shared/Page'
import { INarrative, useGetNarrativeBySlugQuery } from 'graph/generated'
import { endsWith, includes, isEmpty, isEqual, isString, last, omit, split, truncate } from 'lodash'
import React, { ErrorInfo, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Form, FormRenderProps } from 'react-final-form'
import { useLocation } from 'react-router'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { GenericBlockOption, LoadingBarOption } from 'util/blocks/interfaces'
import { openChat } from 'util/chat'
import { colors, SIDENAV_WIDTH, SIDENAV_WIDTH_COLLAPSED } from 'util/constants'
import { reportError } from 'util/errors'
import { arrayMutators } from 'util/forms'
import { makeBuildNarrativeConfig, makeContentOptionsV2 } from 'util/narratives'
import { INarrativeConfig } from 'util/narratives/interfaces'
import { makeShortid } from 'util/shortid'
import { handleMavisErrorNotification } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

import { GetFileAPIReturn, IContent } from '../interfaces'
import FieldConfigs from './FieldConfigs'
import NarrativeTopBar from './NarrativeTopBar'
import PreventBackListener from './PreventBackListener'

const { Content } = Layout

const INITIAL_NARRATIVE_VALUES = {
  datasets: [],
  field_configs: [],
  narrative: {
    sections: [
      { title: undefined, takeaway: undefined, conditioned_on: undefined, show: true, content: [], id: makeShortid() },
    ],
    key_takeaways: [],
  },
}

const StickyTopBar = styled.div<{ collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  position: fixed;
  z-index: 5;
  top: 0;
  right: 0;
  left: ${({ collapsed }) => (collapsed ? SIDENAV_WIDTH_COLLAPSED : SIDENAV_WIDTH)}px;
  will-change: left;
  transition: left 0.2s;
  background-color: ${({ theme }) => theme.colors.gray200};
  box-shadow: 0 2px 3px 0 rgb(0 0 0 / 10%);
`

const ReportLink = styled(Button)`
  cursor: pointer;
  display: inline;
  text-decoration: underline;
`

const NarrativeErrorNotification = () => {
  return (
    <>
      <Typography type="title400" fontWeight="bold" my="4px">
        Sorry, something went wrong!
      </Typography>
      <Typography as="div" type="body100" my="4px">
        Our team has been notified.
      </Typography>
      <Typography as="div" type="body100" my="4px">
        Please try again, or{' '}
        <ReportLink as="span" onClick={() => openChat()}>
          talk to our support team
        </ReportLink>
      </Typography>
    </>
  )
}

const hasGoalsOrTakeways = (config: INarrativeConfig) => {
  const { key_takeaways: keyTakeAways, question, goal, recommendation } = config

  return !isEmpty(keyTakeAways) || !isEmpty(question) || !isEmpty(goal) || !isEmpty(recommendation)
}

const LARGE_SCREEN_WIDTH = 1280
const handleDashboardScreensizeWarning = (notification: any) => {
  if (window.innerWidth >= LARGE_SCREEN_WIDTH) {
    return notification.warning({
      key: 'dashboard-assemble-large-screen-warning',
      placement: 'topRight',
      duration: null,
      message: <span style={{ fontWeight: 'bold' }}>Heads up! Your screen size is wider than most.</span>,
      description: 'Consider resizing your window to preview the experience for viewers on smaller screens.',
    })
  }

  return null
}

const BuildNarrative = () => {
  const { collapsed } = useLayoutContext()
  const location = useLocation()
  const company = useCompany()
  const { user, isCompanyAdmin, isSuperAdmin } = useUser()
  const { notification } = App.useApp()

  // dashboard slugs are called narrative_slug too
  const { narrative_slug: narrativeSlug } = useParams<{ narrative_slug: string }>()

  const isDashboard = useMemo(() => {
    return includes(location.pathname, '/dashboards/edit/') || endsWith(location.pathname, '/dashboards/new')
  }, [location])

  const isNew = useMemo(() => {
    const urlSegments = split(location.pathname, '/')
    return last(urlSegments) === 'new' && !narrativeSlug
  }, [location, narrativeSlug])

  const [submitting, setSubmitting] = useState(false)
  const [submitCounter, setSubmitCounter] = useState(0)
  const [updatedFields, setUpdatedFields] = useState<string[]>()
  const [initialValues, setInitialValues] = useState<GetFileAPIReturn>()
  const [copiedSection, setCopiedSection] = useState<any>()
  const [fieldConfigOverlayVisible, setFieldConfigOverlayVisible] = useState(false)
  const [showQuestionGoalKeyTakeaways, setShowQuestionGoalKeyTakeaways] = useState(false)
  const [hasSetInitialGoalTakeawayShow, setHasSetInitialGoalTakeawayShow] = useState(false)
  // show assembling modal on page load (except for /new)
  const [showAssembleModal, setShowAssembleModal] = useState(!isNew)
  const [compileErrors, setCompileErrors] = useState<{ [key: string]: string }>({})
  const [contentPasted, setContentPasted] = useState<IContent | undefined>()

  // clean up function after content has been pasted
  // and animations are triggered
  const onContentPasted = useCallback(() => {
    setContentPasted(undefined)
  }, [])

  // used for editing dashboard content (in modal)
  const [updateDashboardContentInitialValues, setUpdateDashboardContentInitialValues] = useState<
    undefined | Partial<IContent>
  >()

  const handleToggleDashboardContentOpen = useCallback((content?: IContent) => {
    // if no content is passed it will set updateDashboardContentValues
    // to undefined - which will stop modal's conditional render below
    setUpdateDashboardContentInitialValues(content)
  }, [])

  const handleSetCompileErrors = useCallback(({ fieldName, error }: { fieldName: string; error?: string | null }) => {
    setCompileErrors((prevCompileErrors) => {
      const updatedErrors = { ...prevCompileErrors }

      // if there is no error - remove it
      if (isEmpty(error)) {
        return omit(updatedErrors, fieldName)
      }

      // otherwise add the error
      if (!isEmpty(error) && isString(error)) {
        updatedErrors[fieldName] = error
      }

      return updatedErrors
    })
  }, [])

  const {
    data: narrativeFromGraph,
    loading: loadingGraph,
    refetch: refetchNarrative,
  } = useGetNarrativeBySlugQuery({
    variables: { slug: narrativeSlug, company_id: company?.id, user_id: user.id },
    // skip if on a new page
    skip: isNew,
  })

  const narrative = narrativeFromGraph?.narrative[0] as Partial<INarrative>
  const notAllowedToUpdate = user.id !== narrative?.created_by && !isCompanyAdmin && !isNew

  const [updateConfig, { loading: saving, error: errorSaving }] = useUpdateConfig()

  const narrativeSlugForConfig = () => {
    // don't try to get config while saving
    // (race condition for new narratives)
    if (saving) {
      return undefined
    }

    // if narrative found in graph, use its slug
    if (narrative?.slug) {
      return narrative?.slug
    }

    // for testing, super admins can use the narrative slug from url
    // (narratives only in s3)
    if (isSuperAdmin) {
      return narrativeSlug
    }

    return undefined
  }

  const {
    response: initialConfig,
    loading: loadingConfig,
    error: errorLoading,
    // don't try to get config while saving
    // (race condition for new narratives)
  } = useLoadConfig(narrativeSlugForConfig())

  const { field_configs: initialFieldConfigs = [] } = initialConfig || {}

  const [
    doAssembleFields,
    {
      response: assembledFieldsResponse,
      loading: loadingFields,
      error: errorAssemblingFields,
      refreshed,
      refreshing,
      refreshError,
    },
  ] = useAssembleFields()

  const handleRefreshNarrative = async (formValue: any) => {
    doAssembleFields({
      config: {
        ...formValue,
        fields,
      },
      asRefresh: true,
    })
  }

  const { fields, updated } = assembledFieldsResponse || {}

  const handleToggleQuestionGoalKeyTakeaways = useCallback(() => {
    setShowQuestionGoalKeyTakeaways((prevShow) => !prevShow)
  }, [])

  // set initial show question, goal, recommendation, takeaways
  useEffect(() => {
    const initialNarrativeConfig = initialConfig?.narrative

    // since we initialize showQuestionGoalKeyTakeaways as false
    // only change back to true if it has goals
    if (initialNarrativeConfig && !hasSetInitialGoalTakeawayShow && hasGoalsOrTakeways(initialNarrativeConfig)) {
      setHasSetInitialGoalTakeawayShow(true)
      setShowQuestionGoalKeyTakeaways(true)
    }
  }, [initialConfig?.narrative, hasSetInitialGoalTakeawayShow])

  // we need the "stringified" versions of these so we can
  // pass them into `useEffect` w/o triggering a re-render
  const fieldsStringified = JSON.stringify(fields)
  const updatedStringified = JSON.stringify(updated)

  const [assembleNarrative, { response: assembled, loading: assembling, error: errorAssembling }] =
    useAssembleNarrative()

  const outputKey = assembled?.output_key
  const prevOutputKey = usePrevious(outputKey)

  // on successful assemble: refetch narrative
  useEffect(() => {
    if (!isEqual(prevOutputKey, outputKey)) {
      refetchNarrative()
    }
  }, [prevOutputKey, outputKey, refetchNarrative])

  const [loadAutocomplete, { response: autocomplete, loading: loadingAutocomplete, error: errorAutocomplete }] =
    useLoadAutocomplete()

  const handleOnSubmit = async (
    event: React.SyntheticEvent,
    handleSubmit: FormRenderProps['handleSubmit'],
    form: FormRenderProps['form']
  ) => {
    // Keep track of each time the user has submitted the form:
    setSubmitCounter(submitCounter + 1)

    // On only successful form submission reset the form so "dirty" goes from true to false!
    // We use "dirty" in PreventBack to decide whether to prevent back
    const updatedConfig = await handleSubmit(event)

    // Only on success reset the form:
    if (updatedConfig) {
      form.reset(updatedConfig)
    }
  }

  // saves the narrative config i.e. sections, title, questions, etc.
  const handleSubmitForm = async (formValue: any) => {
    // Assemble updated Narrative Config:
    const updatedNarrativeConfig = makeBuildNarrativeConfig({ formValue, fields })

    await updateConfig({
      narrativeSlug: narrative?.slug as string,
      updatedNarrativeConfig,
    })

    // Return the updated narrativeConfig for form.reset:
    return updatedNarrativeConfig
  }

  // first saves the narrative config, then assembles the narrative
  const handleAssembleNarrative = async (
    event: React.SyntheticEvent,
    handleSubmit: FormRenderProps['handleSubmit'],
    form: FormRenderProps['form']
  ) => {
    setShowAssembleModal(true)

    // show warning if they are assembling a dashboard on a larger screen
    if (isDashboard) {
      handleDashboardScreensizeWarning(notification)
    }

    if (!saving) {
      setSubmitting(true)
      await handleOnSubmit(event, handleSubmit, form)
      setSubmitting(false)
    }

    await assembleNarrative({
      narrative,
    })
  }

  const handleCloseAssembleModal = useCallback(() => {
    setShowAssembleModal(false)
  }, [])

  const { datasets: availableDatasets, loading: availableDatasetsLoading, refetch: refetchDatasets } = useGetDatasets()

  const { response: blockOptions } = useLoadSchemas()
  const contentSelectOptions = makeContentOptionsV2(blockOptions?.narrative_blocks as GenericBlockOption[])
  const loadingData = loadingGraph || loadingConfig || loadingFields || loadingAutocomplete

  const errorHandler = (error: Error, info: ErrorInfo) => {
    reportError('Narrative Error Boundary', error, {
      errorBoundary: 'build-narrative',
      narrative,
      ...info,
    })
  }

  // refresh error notification
  useEffect(() => {
    if (refreshError) {
      handleMavisErrorNotification({ error: refreshError, notification })
    }
  }, [refreshError, notification])

  // Set initial values from initialConfig or defaults
  useEffect(() => {
    if (initialConfig) {
      setInitialValues(initialConfig)
    } else {
      // wait until block options has returned
      // to check for empty_narrative state
      if (!initialValues && !isEmpty(blockOptions)) {
        // if narrative and block options has empty_narrative state set that
        if (!isDashboard && !isEmpty(blockOptions?.empty_narrative)) {
          return setInitialValues(blockOptions?.empty_narrative as GetFileAPIReturn)
        }

        // if dashboard and block has empty_dashboard state set that
        if (isDashboard && !isEmpty(blockOptions?.empty_dashboard)) {
          return setInitialValues(blockOptions?.empty_dashboard as GetFileAPIReturn)
        }
        // otherwise use hardcoded default
        setInitialValues(INITIAL_NARRATIVE_VALUES)
      }
    }
  }, [initialValues, initialConfig, blockOptions, isDashboard])

  // Assemble fields from initial config values
  useEffect(() => {
    async function asyncLoad() {
      doAssembleFields({
        config: {
          field_configs: initialValues?.field_configs,
          fields: initialValues?.fields,
          dynamic_filters: initialValues?.dynamic_filters,
        },
      })
    }

    if (
      !loadingConfig &&
      !fields &&
      initialFieldConfigs &&
      isEqual(initialValues?.field_configs, initialFieldConfigs)
    ) {
      asyncLoad()
    }
  }, [loadingConfig, fields, initialValues, initialFieldConfigs, doAssembleFields])

  // Autocomplete for the markdown editors
  useEffect(() => {
    // wait until assembledFieldsResponse exists -- it always will since all narratives,
    // even new ones, have fields.
    const fields = isString(fieldsStringified) ? JSON.parse(fieldsStringified) : null

    async function asyncLoad() {
      await loadAutocomplete(fields)
    }

    if (fields) {
      asyncLoad()
    }
  }, [fieldsStringified, loadAutocomplete])

  // set Updated Fields so we can pass it through
  // to our BuildNarrativeProvider
  useEffect(() => {
    try {
      const updated = JSON.parse(updatedStringified)
      setUpdatedFields(updated)
    } catch (err) {
      // no-op
    }
  }, [updatedStringified])

  // Reset Updated Fields back to `undefined`
  //
  // Why are we using "useLayoutEffect" here?
  // Because we wan to reset `updatedFields` back to
  // `undefined` once the compile steps have taken place
  // and the DOM is fully updated (ie, ready for next user input)
  // https://kentcdodds.com/blog/useeffect-vs-uselayouteffect
  useLayoutEffect(() => {
    if (updatedFields) {
      setUpdatedFields(undefined)
    }
  }, [updatedFields])

  // Used to display the success/error notification messages
  useNotificationEffect({
    errorLoading,
    errorAssembling,
    errorAssemblingFields,
    errorAutocomplete,
    errorSaving,
    narrativeSlug,
  })

  if (notAllowedToUpdate) {
    return (
      <Flex justifyContent="center" width={1}>
        <Result
          icon={<LockFilled style={{ color: colors.red500 }} />}
          title="You must be the author of this narrative to be able to edit."
          extra={
            <Link unstyled to="/narratives">
              <Button type="primary">Go to All Narratives</Button>
            </Link>
          }
        />
      </Flex>
    )
  }

  // Similar to Dataset, we should be able to upload hidden Narrative slugs in s3 for testing
  // these slugs will not appear in graph, hence the check on initialValues as well
  // If there's no narrative slug && there are no initial values, we can't find the narrative
  if (!narrative && !loadingData && isEqual(initialValues, INITIAL_NARRATIVE_VALUES) && !isNew) {
    return (
      // Add padding top for navbar:
      <Flex justifyContent="center" width={1}>
        <Result
          status="403"
          subTitle="Sorry, we're unable to find this Narrative. Maybe you don't have proper access?"
          extra={
            <Link unstyled to="/narratives">
              <Button type="primary">Go to All Narratives</Button>
            </Link>
          }
        />
      </Flex>
    )
  }

  const narrativeNameOrSlug = narrative?.name || narrative?.slug
  const pageTitle = narrativeNameOrSlug || `${isDashboard ? 'Dashboard' : 'Narrative'} Editor | Narrator`

  return (
    <Page
      title={pageTitle}
      hideChat
      bg="white"
      breadcrumbs={[
        // TODO: currently both dashboards and narratives use narrative index
        // update url when dashboard index has its own page
        { url: '/narratives', text: isDashboard ? 'Dashboards' : 'Narratives' },
        { text: truncate(narrativeNameOrSlug || '', { length: 27 }) },
      ]}
    >
      <BuildNarrativeProvider
        value={{
          doAssembleFields,
          assembledFieldsResponse,
          saving,
          assembling,
          submitting,
          updatedFields,
          loadingFields,
          loadingConfig,
          autocomplete,
          blockOptions,
          contentSelectOptions,
          copiedSection,
          setCopiedSection,
          fieldConfigOverlayVisible,
          setFieldConfigOverlayVisible,
          handleToggleQuestionGoalKeyTakeaways,
          handleToggleDashboardContentOpen,
          availableDatasets,
          availableDatasetsLoading,
          refetchDatasets,
          compileErrors,
          handleSetCompileErrors,
          narrative,
          refetchNarrative,
          isNew,
          setContentPasted,
          onContentPasted,
          contentPasted,
        }}
      >
        <Content
          style={{
            position: 'relative',
            height: '100vh',
            overflow: 'auto',
            background: isDashboard ? DASHBOARD_BACKGROUND_COLOR : 'white',
          }}
        >
          <Spin
            size="large"
            tip="Loading..."
            spinning={loadingData}
            style={{
              position: 'fixed',
              left: collapsed ? SIDENAV_WIDTH_COLLAPSED : SIDENAV_WIDTH,
              right: 0,
              minHeight: '100vh',
            }}
          >
            <Form
              initialValues={initialValues as object}
              mutators={arrayMutators}
              onSubmit={handleSubmitForm}
              subscription={{ invalid: true, errors: true, submitFailed: true }}
              render={({ handleSubmit, form, errors, invalid, submitFailed }) => {
                return (
                  <ErrorBoundary
                    fallbackRender={({ error, resetErrorBoundary }) => {
                      notification.error({
                        key: error.message,
                        placement: 'topRight',
                        duration: null,
                        message: <NarrativeErrorNotification />,
                      })

                      resetErrorBoundary()
                      return null
                    }}
                    onError={errorHandler}
                    onReset={() => {
                      // TODO: see if there is anything that can be reset
                      // when an error occurs
                    }}
                  >
                    <StickyTopBar collapsed={collapsed}>
                      <NarrativeTopBar
                        handleAssembleNarrative={(event) => handleAssembleNarrative(event, handleSubmit, form)}
                        assembling={assembling || submitting}
                        updateConfig={updateConfig}
                        saving={saving || submitting}
                        fields={fields}
                        loadingFields={loadingFields}
                        loadingConfig={loadingConfig}
                        errors={errors}
                        invalid={invalid}
                        submitFailed={submitFailed}
                        submitCounter={submitCounter}
                        narrative={narrative}
                        refetchNarrative={refetchNarrative}
                        isNew={isNew}
                        isDashboard={isDashboard}
                      />

                      {!isDashboard && (
                        <FieldConfigs
                          handleRefreshNarrative={() => handleRefreshNarrative(form.getState()?.values)}
                          refreshing={refreshing}
                          refreshed={refreshed}
                        />
                      )}
                    </StickyTopBar>

                    <PreventBackListener />

                    {isDashboard && (
                      <BuildDashboard updateDashboardContentInitialValues={updateDashboardContentInitialValues} />
                    )}
                    {!isDashboard && (
                      <BuildNarrativeContent showQuestionGoalKeyTakeaways={showQuestionGoalKeyTakeaways} />
                    )}
                  </ErrorBoundary>
                )
              }}
            />
          </Spin>
        </Content>

        {/* Add modal for saving/assembling  */}
        <AssemblingModal
          onClose={handleCloseAssembleModal}
          visible={showAssembleModal}
          saving={saving}
          assembling={assembling}
          error={errorAssembling}
          loadingBar={blockOptions?.field_loading_screen as LoadingBarOption[]}
          narrativeSlug={narrativeSlug}
          loadingFields={loadingFields}
          loadingConfig={loadingConfig}
          isDashboard={isDashboard}
        />
        <ConfigUpdatedNotification narrativeSlug={narrativeSlug} />
      </BuildNarrativeProvider>
    </Page>
  )
}

export default BuildNarrative

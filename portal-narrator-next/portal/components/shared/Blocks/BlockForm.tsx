import { IChangeEvent, ISubmitEvent } from '@rjsf/core'
import { App } from 'antd-next'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import _ from 'lodash'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GenericBlockService from 'util/blocks/GenericBlockService'
import {
  BlockContent,
  BlockService,
  FormData,
  FormState,
  HandleRefreshStateArgs,
  IBlockState,
  IFormContext,
  LoadingBarProps,
  ProcessDataResponse,
  ProcessedResult,
  RefreshConfig,
  SubmitResult,
  UpdateSchemaResponse,
} from 'util/blocks/interfaces'
import useImmutableCallback from 'util/useImmutableCallback'
import usePrevious from 'util/usePrevious'

import DynamicForm from '../DynamicForm/DynamicForm'
import BlockLoadingBar from './BlockLoadingBar'
import useGraphSubscription from './useGraphSubscription'

//
// A dynamic UI driven by a backend service. Displays a fully configurable form and
// calls to its given service to update and submit
//

//
// A Block is a form controlled by our backend
//
// BlockForm is core of Blocks. It renders the form and manages its state and data, and communicates to the backend

// Note: This component only sends down the form state on submit. Currently there is no way for parents to track the current state
//       This is by design! This form is a controlled component by the BACK END, so disabling front end access simplifies things
//
// How data on the form can be changed
// 1. initialFormData gives the form its initial data. It can be changed at any time by the parent
//    and effectively wipes the form and replaces it.
//    This can happen when hosted in an overlay: the same overlay can reset the form  when reopened
// 2. User updates the form as they interact with it. Here we only need to keep track of the current state of the form
// 3. Some user interaction triggers updates from the backend (e.g. an option was selected in a dropdown or a button was pressed)
//    The form will send the current state to the backend and receive new data and / or schema.
//

interface BlockFormProps {
  slug: string
  version: number
  initialFormData?: FormData
  fields?: Record<string, unknown>[]
  stateOverride?: IBlockState // load a specific block state (i.e. for edit instead of create new)
  onSubmit?(args: SubmitResult, hideOutput: boolean): void
  onNavigateRequest?(path: string): void
  onDirtyChange?(dirty: boolean): void
  onProcessed?(result: ProcessedResult): void
  asAdmin?: boolean
}

// GenericBlockService
const BlockForm: React.FC<BlockFormProps> = ({
  slug,
  version,
  initialFormData,
  fields,
  stateOverride,
  onSubmit,
  onNavigateRequest,
  onDirtyChange,
  onProcessed,
  asAdmin = false,
}) => {
  const { notification } = App.useApp()
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()
  const [loadingBar, setLoadingBar] = useState<LoadingBarProps[] | undefined | null>()

  const service = useRef<BlockService>()

  const [loading, setLoading] = useState(false)
  const prevLoading = usePrevious(loading)
  const [error, setError] = useState<string | undefined>()

  const [formLoaded, setFormLoaded] = useState(false)
  const prevBlockState = usePrevious<IBlockState | undefined>(stateOverride)

  // clear loadingBar
  useEffect(() => {
    // if we are no longer loading
    if (prevLoading && !loading) {
      // clear loading bar if it exists
      if (!_.isEmpty(loadingBar)) {
        // clear loading bar until they trigger it again
        setLoadingBar(null)
      }
    }
  }, [loadingBar, setLoadingBar, prevLoading, loading])

  // Actual live form data
  // Since this updates on every change of the form sending it elsewhere might cause
  // the entire form to rerender on every change
  // In particular FormContext uses a callback to get the current form data for this exact reason
  // Note: the ONLY external place this should be sent to is to the DynamicForm's FormData prop.
  const [formData, setFormDataImpl] = useState<FormData>({})

  // formData ref -- used because we set two callbacks (getFormData and onRefreshConfigRequest)
  // into the formContext object. When defined they capture the initial value of formData in their closure.
  // The only way for them to get the current value is to use a ref
  const formDataRef = useRef<FormData>(formData)
  const setFormData = (newData: FormData) => {
    formDataRef.current = newData
    setFormDataImpl(newData)
  }

  // TODO: formState doesn't need to store data at all. Should be a straightforward refactor
  //       to do later

  // formState
  // This is used to refresh / rebuild the form with a new schema from the backend
  // This contains the information that the backend wants the form to show -- it's
  // how the backend controls the form and makes it dynamic
  //
  // Since this is state pushed into the form externally,
  // its data object is NOT kept up to date as the form changes, but only updated after
  // a response from the backend. This avoids rerendering the entire form on every change
  // This means we must ensure that when we call the backend we send down current data
  const [formState, setFormState] = useState<FormState>()

  const updateFormStateAndData = useCallback((newState: FormState | undefined) => {
    if (newState) {
      setFormData(newState.data)
      setFormState(newState)
    }
  }, [])

  //
  // Dirty Tracking
  //
  // We use an overly simple way to track dirty: as soon as the form changes,
  // it's dirty. We should diff the form data, but Mavis adds non-user data into it
  // so we appear to be dirty when the user didn't actually change it.
  const dirty = useRef<boolean>(false)
  const updateDirty = useCallback(
    (newDirty: boolean) => {
      if (dirty.current !== newDirty && onDirtyChange) {
        dirty.current = newDirty
        onDirtyChange(newDirty)
      }
    },
    [onDirtyChange]
  )

  //
  // Handle a navigation request (i.e a block wants to go elsewhere in the app)
  //
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  useEffect(() => {
    if (pendingNavigation && onNavigateRequest) {
      onNavigateRequest(pendingNavigation)
    }
  }, [pendingNavigation, onNavigateRequest])

  // Render error as a notification so you always see it!
  useEffect(() => {
    if (error) {
      notification.error({
        message: 'Error updating form',
        description: error,
        placement: 'topRight',
        duration: 0,
      })
    }
  }, [error, notification])

  const handleSubmit = useCallback(
    async (form: Pick<ISubmitEvent<any>, 'schema' | 'uiSchema' | 'formData'>) => {
      if (!service.current) {
        return
      }

      resetRun()
      setLoading(true)

      // Grab the updated state from the params -- when called from refreshForm
      // the formState doesn't yet have the right values
      const data = form.formData

      // Call the API
      try {
        const response: BlockContent[] = await service.current.submitForm(
          slug,
          {
            data,
          },
          asAdmin
        )

        // onSubmit allows you to pass in additional submit capabilities
        if (_.isFunction(onSubmit)) {
          const hideOutput = _.get(form.uiSchema, 'ui:options.hide_output', false)
          onSubmit({ content: response, formData: data }, hideOutput)
        }
      } catch (e) {
        setError((e as Error).message)
      }
      setLoading(false)
    },
    [slug, onSubmit]
  )

  const resetRun = () => {
    setError(undefined)
  }

  //
  // Handle a request (from a component within the form) to send the current formstate to the backend and reload
  // the form. Can receive new data, a new schema, or both
  // Common use case: an option is chosen in a select - use that choice to fill in other form fields
  //

  // Calls the backend with the current form state to get new data and / or new schema
  const refreshFormStateless = useCallback(
    async (
      args: HandleRefreshStateArgs,
      currentFormState: FormState | undefined,
      currentService: BlockService | undefined
    ) => {
      if (!currentService || !currentFormState) {
        return
      }

      resetRun()
      setLoading(!args.disableLoading) // if it's a partial update we don't want to turn on loading

      setLoadingBar(args?.loading_bar)
      // Note: we get data here from the args instead of state because this is
      // called via code paths that won't yet properly have state up to date
      // (i.e. from the onChange handler)
      const data = args.formData

      try {
        let processedData: ProcessDataResponse | null = null
        let updatedSchema: UpdateSchemaResponse | null = null

        // Make sure these endpoints happen in the following order:
        // - process_data
        // - update_schema
        // - submit_form

        if (args.process_data) {
          const processDataBody = {
            field_slug: args.field_slug,
            data,
          }

          processedData = await currentService.processData(slug, processDataBody, asAdmin)

          // Process data can ask to navigate to another instead of refreshing the form data
          // if so, send that request up to the parent
          if (processedData.redirect_url) {
            // Let the callback complete before navigating but don't continue any of the work.
            // We don't want outstanding state changes / external calls keeping this component alive
            setLoading(false)
            updateDirty(false)
            setPendingNavigation(processedData.redirect_url)

            // notify parent processing has run
            onProcessed && onProcessed(_.omit(processedData, 'data'))
            return
          }
        }

        if (args.update_schema) {
          const updateBody = {
            field_slug: args.field_slug,
            internal_cache: currentFormState.internal_cache,
            // If you just processed the data, use that!
            data: processedData?.data || data,
          }

          updatedSchema = await currentService.updateSchema(slug, updateBody, asAdmin)
        }

        const updatedFormState = {
          ...currentFormState,
          ...(processedData || { data }),
          ...updatedSchema,
        } as FormState

        updateFormStateAndData(updatedFormState)

        // If we know the form state isn't dirty then reset it now that we've updated the form data
        if (processedData && _.isBoolean(processedData.dirty) && processedData.dirty === false) {
          updateDirty(false)
        }

        if (args.submit_form) {
          handleSubmit({
            schema: updatedFormState.schema,
            formData: updatedFormState.data,
            uiSchema: updatedFormState.ui_schema || {},
          } as ISubmitEvent<FormData>)
        }

        // Last thing we do: notifiy the parent so it can notify some other things
        onProcessed && onProcessed(_.omit(processedData, 'data'))
      } catch (e) {
        setError((e as Error).message)
      }
      setLoading(false)
    },
    [handleSubmit, slug, updateDirty, updateFormStateAndData, asAdmin]
  )

  const refreshForm = useCallback(
    async (args: HandleRefreshStateArgs) => {
      return refreshFormStateless(args, formState, service.current)
    },
    [formState, refreshFormStateless]
  )

  // Use a ref to set what field just updated and if it requires processing
  // i.e. which update to do (updateSchema or processData)
  const refreshConfigRequested = useRef<RefreshConfig | null>(null)

  const handleRefreshConfigRequest = useCallback(
    (refreshConfig: RefreshConfig) => {
      if (refreshConfig.runImmediately) {
        refreshForm({
          field_slug: refreshConfig.field_slug as string,
          process_data: !!refreshConfig.process_data,
          update_schema: !!refreshConfig.update_schema,
          submit_form: !!refreshConfig.submit_form,
          formData: formDataRef.current, // can't use state here -- we're in a callback that captured a stale closure. Luckily that's why refs have .current
          disableLoading: true,
          loading_bar: refreshConfig.loading_bar,
        })
      } else {
        // Request a refresh on the next onChange call -- refreshes are usually triggered on
        // a user selecting a value in a dropdown, so we need to wait for DynamicForm's onChange
        // to get the new value of the form
        //
        // keep track of field_slug (field id), options.update_schema, and options.process_data
        // so we know which field id caused the onChange event
        refreshConfigRequested.current = refreshConfig
      }
    },
    [refreshForm]
  )

  // NOTE - this will get fired on EVERY form change event (even every keystroke)
  // Be careful about putting stuff in here!
  const handleFormChange = (form: IChangeEvent<any>) => {
    setFormData(form.formData)

    // Schema V1 Updates
    // Handled here because the most common use case is to refresh the form state
    // based on a selection in a dropdown. OnChange first place we have access to the new value
    const refreshConfig = refreshConfigRequested.current
    if (refreshConfig) {
      const args = {
        field_slug: refreshConfig.field_slug as string,
        process_data: !!refreshConfig.process_data,
        update_schema: !!refreshConfig.update_schema,
        submit_form: !!refreshConfig.submit_form,
        formData: form.formData,
        loading_bar: refreshConfig.loading_bar,
      }

      // NOTE - resetting refreshConfigRequested HAS to happen before actually calling the endpoints!
      refreshConfigRequested.current = null
      refreshForm(args)
    } else {
      // form changes asking for a refresh config are not 'real' form changes. They're things
      // like button presses
      updateDirty(true)
    }
  }

  //
  // Graph subscription support
  //

  // The subscribe function of useGraphSubscription needs an immutable callback to refreshForm
  // It's not called each time refreshForm changes the way a component or hook would.
  const subscribe = useGraphSubscription()
  const immutableRefresh = useImmutableCallback(refreshForm)
  const handleGraphSubscriptionRequest = useCallback(
    ({ fieldSlug, graphQuery, variables }: { fieldSlug: string; graphQuery: string; variables: unknown }) => {
      subscribe({
        graphQuery,
        variables,
        onUpdate: () => {
          // The given data doesn't actually matter. Just kick off a ProcessData request to refresh the form data
          immutableRefresh({
            field_slug: fieldSlug,
            process_data: true,
            formData: formDataRef.current,
            disableLoading: true,
            update_schema: false,
            submit_form: false,
          })
        },
      })
    },
    [immutableRefresh, subscribe]
  )

  // After the initial load, only reload the form from scratch when block state changes
  useEffect(() => {
    // ensure it's a change, not component initialization
    if (prevBlockState !== stateOverride) {
      setFormLoaded(false)
    }
  }, [stateOverride, prevBlockState])

  // Instantiate GenericBlockService and load the initial form state from the slug
  useEffect(() => {
    const handleLoad = async () => {
      let svc = service.current

      if (!svc) {
        svc = new GenericBlockService({ getToken, company })
        //svc = new LocalService({ getToken, company })
        service.current = svc
      }

      // If we have any form data send it in so that we get it back with the
      // initial schema.
      const data = _.isEmpty(formDataRef.current) ? initialFormData : formDataRef.current

      // If we have any `fields`, send it in with the body along with `block_slug`
      const body = fields
        ? {
            data,
            block_slug: slug,
            fields,
          }
        : { data }

      setLoading(true)

      try {
        let newState

        if (stateOverride) {
          newState = await svc.loadItemContextById(stateOverride.id, stateOverride.resourceType, asAdmin)
        } else {
          // If we have `fields`, make sure to call the `loadBlock` service (vs `updateSchema`)
          // since `loadBlock` can take in and handle `fields`
          newState = fields ? await svc.loadBlock(body) : await svc.updateSchema(slug, body, asAdmin)
        }

        updateFormStateAndData(newState)
        refreshOnLoad(newState, newState.data, svc)
      } catch (e) {
        notification.error({
          message: 'Error loading form',
          description: (e as Error).message,
          placement: 'topRight',
        })
      }

      setLoading(false)
    }

    const refreshOnLoad = (loadedFormState: FormState, loadedFormData: FormData, loadedService: BlockService) => {
      // currently there are 2 on-load events passed from mavis ('process_data_on_load' and 'submit_on_load')
      // either/both can be passed in options
      const processDataOnLoad = _.get(loadedFormState, 'ui_schema[ui:options].process_data_on_load', false)
      const submitOnLoad = _.get(loadedFormState, 'ui_schema[ui:options].submit_on_load', false)

      if (processDataOnLoad || submitOnLoad) {
        refreshFormStateless(
          {
            field_slug: slug,
            formData: loadedFormData,
            process_data: processDataOnLoad,
            submit_form: submitOnLoad,
            update_schema: false,
          },
          loadedFormState,
          loadedService
        )
      }
    }

    if (company && slug && !formLoaded) {
      handleLoad()
      setFormLoaded(true)
    }
  }, [
    getToken,
    company,
    slug,
    stateOverride,
    formLoaded,
    initialFormData,
    updateFormStateAndData,
    refreshFormStateless,
    fields,
    asAdmin,
  ])

  const formContext = useMemo(() => {
    return {
      onRefreshConfigRequest: handleRefreshConfigRequest,
      subscribeToRefresh: handleGraphSubscriptionRequest,
      version,
      schemaSlug: slug,
      getFormData: () => {
        return formDataRef.current
      }, // every change to formContext rerenders the entire form, which is why the current state is NOT set here and a callback is used instead
    } as IFormContext
  }, [handleRefreshConfigRequest, handleGraphSubscriptionRequest, slug, version])

  return (
    <BlockLoadingBar loadingBar={loadingBar} loading={loading} error={error}>
      {formState ? (
        <DynamicForm
          formSchema={formState}
          formData={formData}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          loading={loading}
          formContext={formContext}
          asAdmin={asAdmin}
        />
      ) : (
        <div style={{ width: '100%', height: '200px' }} />
      )}
    </BlockLoadingBar>
  )
}

export default BlockForm

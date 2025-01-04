import { Button } from 'antd-next'
import { useBlockOverlayContext } from 'components/BlockOverlay/BlockOverlayProvider'
import { INarrative, INarrative_Types_Enum } from 'graph/generated'
import { get, isEmpty } from 'lodash'
import React, { useCallback, useEffect } from 'react'
import { useForm, useFormState } from 'react-final-form'
import { BlockContent } from 'util/blocks/interfaces'
import { useLazyCallMavis } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

import { useBuildNarrativeContext } from './BuildNarrativeProvider'

const DEFAULT_BLOCK_SLUG = 'narrative_config'

interface Props {
  narrative?: Partial<INarrative>
}

const DefineFiltersButton = ({ narrative }: Props) => {
  const { assembledFieldsResponse } = useBuildNarrativeContext()
  const { handleOpenOverlay } = useBlockOverlayContext()
  const { reset } = useForm()
  const { values: formValues } = useFormState({ subscription: { values: true } })

  const [
    getDynamicFilterConfig,
    { response: dynamicFilterConfig, loading: loadingDynamicFilterConfig, error: getDynamicFilterError },
  ] = useLazyCallMavis<any>({
    method: 'POST',
    path: `/v1/narrative/load_filter_config`,
  })

  const prevLoadingDynamicFilterConfig = usePrevious(loadingDynamicFilterConfig)

  // get existing dynamic filters
  // response will trigger open block overlay in useEffect below
  const handleGetDynamicFilterConfig = useCallback(() => {
    getDynamicFilterConfig({
      body: {
        ...formValues,
        type: narrative?.type || INarrative_Types_Enum.Analysis,
        fields: assembledFieldsResponse?.fields,
      },
    })
  }, [narrative?.type, formValues, assembledFieldsResponse?.fields, getDynamicFilterConfig])

  // if block overlay submit was successful
  // update narrative form values with block response
  const submitCallback = useCallback(
    ({ content }: { content: BlockContent[] }) => {
      const newNarrativeFormState = get(content, '[0].value')
      if (!isEmpty(newNarrativeFormState)) {
        reset(newNarrativeFormState)
      }
    },
    [reset]
  )

  // open block modal when content comes back from get dynamic filters
  useEffect(() => {
    // new dynamic filter config - so open modal
    if (
      prevLoadingDynamicFilterConfig &&
      !loadingDynamicFilterConfig &&
      isEmpty(getDynamicFilterError) &&
      !isEmpty(dynamicFilterConfig)
    ) {
      handleOpenOverlay({
        formSlug: dynamicFilterConfig?.block_slug || DEFAULT_BLOCK_SLUG,
        version: 1,
        submitCallback: { callback: submitCallback },
        closeOnSubmit: true,
        showPreview: true,
        justify: 'center',
        formData: dynamicFilterConfig?.data,
        fields: assembledFieldsResponse?.fields,
      })
    }
  }, [
    handleOpenOverlay,
    submitCallback,
    prevLoadingDynamicFilterConfig,
    loadingDynamicFilterConfig,
    dynamicFilterConfig,
    getDynamicFilterError,
    assembledFieldsResponse?.fields,
  ])

  return (
    <Button onClick={handleGetDynamicFilterConfig} loading={loadingDynamicFilterConfig}>
      Define Filters
    </Button>
  )
}

export default DefineFiltersButton

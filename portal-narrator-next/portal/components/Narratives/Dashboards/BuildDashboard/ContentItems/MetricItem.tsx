import { useBuildNarrativeContext } from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import { CompiledResponse } from 'components/Narratives/BuildNarrative/Sections/BasicContent/TableContent'
import { useCompileContent } from 'components/Narratives/hooks'
import { IContent } from 'components/Narratives/interfaces'
import MetricGraphic from 'components/Narratives/Narrative/ContentWidget/MetricGraphic'
import { CenteredLoader } from 'components/shared/icons/Loader'
import { isBoolean, isEmpty, isObject, isString } from 'lodash'
import { useMemo } from 'react'
import { CONTENT_TYPE_METRIC_V2 } from 'util/narratives/constants'
import { makeMetricCopiedContent } from 'util/shared_content/helpers'

import CompileErrorMessage from './CompileErrorMessage'
import InnerContent from './InnerContent'

interface Props {
  content: IContent
}

const MetricItem = ({ content }: Props) => {
  const { data } = content
  const { assembledFieldsResponse } = useBuildNarrativeContext()
  const fields = assembledFieldsResponse?.fields

  const valuesForCompile = useMemo(() => {
    // only return if it has the minimum values
    // dataset, group, metric
    if (!data?.dataset_slug || !data?.group_slug || !data?.column_id) {
      return {}
    }

    return {
      dataset_slug: data.dataset_slug,
      group_slug: data.group_slug,
      column_id: data.column_id,
      filters: data.filters || [],
      filter_label: data.filter_label || null,
      compare_filters: data.compare_filters || [],
      compare_filter_label: data.compare_filter_label || null,
      make_percent_change: isBoolean(data.make_percent_change) ? data.make_percent_change : null,
      compare_text: data.compare_text || null,
      name: data.name || null,
      description: data.description || null,
      plot_color: data.plot_color || null,
      show_values_in_plot: data.show_values_in_plot || null,
    }
  }, [data])

  const copyContentValues =
    !isEmpty(valuesForCompile) &&
    isString(valuesForCompile?.dataset_slug) &&
    isString(valuesForCompile?.group_slug) &&
    isString(valuesForCompile?.column_id)
      ? makeMetricCopiedContent({
          ...valuesForCompile,
          dataset_slug: valuesForCompile.dataset_slug,
          group_slug: valuesForCompile.group_slug,
          column_id: valuesForCompile.column_id,
        })
      : undefined

  const {
    loading: compiling,
    response: compiledResponse = [],
    error: compileError,
    callback: runCompile,
  } = useCompileContent({
    contents: [
      {
        type: CONTENT_TYPE_METRIC_V2,
        data: valuesForCompile as any,
      },
    ],
  })

  const handleRunCompile = () => {
    runCompile({
      contents: [
        {
          type: CONTENT_TYPE_METRIC_V2,
          data: valuesForCompile as any,
        },
      ],
      fields,
    })
  }

  const compiledResponseData = (compiledResponse?.[0]?.value || {}) as CompiledResponse['value']

  return (
    <InnerContent content={content} handleCompileContent={handleRunCompile}>
      {compiling && <CenteredLoader />}

      {!isEmpty(compiledResponseData) && isObject(compiledResponseData) && !compileError && (
        <MetricGraphic {...compiledResponseData} copyContentValues={copyContentValues} fullWidth />
      )}

      {compileError && <CompileErrorMessage message={compileError} />}
    </InnerContent>
  )
}

export default MetricItem

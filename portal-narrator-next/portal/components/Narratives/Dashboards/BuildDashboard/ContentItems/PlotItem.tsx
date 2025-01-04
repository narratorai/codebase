import { useBuildNarrativeContext } from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import { CompiledResponse } from 'components/Narratives/BuildNarrative/Sections/BasicContent/PlotContent'
import { useCompileContent } from 'components/Narratives/hooks'
import { IContent } from 'components/Narratives/interfaces'
import DynamicPlot from 'components/shared/DynamicPlot'
import DynamicPlotHeightWrapper from 'components/shared/DynamicPlotHeightWrapper'
import { CenteredLoader } from 'components/shared/icons/Loader'
import { isString } from 'lodash'
import { useMemo } from 'react'
import { CONTENT_TYPE_PLOT_V2 } from 'util/narratives/constants'
import { makePlotCopiedContent } from 'util/shared_content/helpers'

import CompileErrorMessage from './CompileErrorMessage'
import InnerContent from './InnerContent'

interface Props {
  content: IContent
}

const PlotItem = ({ content }: Props) => {
  const { data } = content
  const { assembledFieldsResponse } = useBuildNarrativeContext()
  const fields = assembledFieldsResponse?.fields

  const valuesForCompile = useMemo(() => {
    // don't compile if all the data isn't there
    if (!data?.dataset_slug || !data?.group_slug || !data?.plot_slug) {
      return {}
    }

    return {
      dataset_slug: data.dataset_slug,
      group_slug: data.group_slug,
      plot_slug: data.plot_slug,
      show_colors: data.show_colors || null,
      colors: data.colors || null,
      annotations: data.annotations || null,
    }
  }, [data])

  const {
    loading: compiling,
    response: compiledResponse = [],
    error: compileError,
    callback: runCompile,
  } = useCompileContent({
    contents: [
      {
        type: CONTENT_TYPE_PLOT_V2,
        data: valuesForCompile as any,
      },
    ],
  })

  const handleRunCompile = () => {
    runCompile({
      contents: [
        {
          type: CONTENT_TYPE_PLOT_V2,
          data: valuesForCompile as any,
        },
      ],
      fields,
    })
  }

  const compiledResponseData = (compiledResponse?.[0]?.value || {}) as CompiledResponse['value']

  const copyContentValues = useMemo(() => {
    const datasetSlug = data?.dataset_slug
    const groupSlug = data?.group_slug
    const plotSlug = data?.plot_slug

    // only allow copy if all slugs are present (and ensure strings)
    if (datasetSlug && isString(datasetSlug) && groupSlug && isString(groupSlug) && plotSlug && isString(plotSlug)) {
      return makePlotCopiedContent({ datasetSlug, groupSlug, plotSlug, extraPlotData: data })
    }

    return undefined
  }, [data])

  return (
    <DynamicPlotHeightWrapper
      render={(updatedHeight) => (
        <InnerContent content={content} handleCompileContent={handleRunCompile}>
          {compiling && <CenteredLoader />}

          {!compileError && (
            <DynamicPlot {...compiledResponseData} height={updatedHeight} copyContentValues={copyContentValues} />
          )}

          {compileError && <CompileErrorMessage message={compileError} />}
        </InnerContent>
      )}
    />
  )
}

export default PlotItem

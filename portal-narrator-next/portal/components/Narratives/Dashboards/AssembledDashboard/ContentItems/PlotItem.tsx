import AnalysisContext from 'components/Narratives/Narrative/AnalysisContext'
import DynamicPlotHeightWrapper from 'components/shared/DynamicPlotHeightWrapper'
import DynamicPlotWithContext from 'components/shared/DynamicPlotWithContext'
import { useContext } from 'react'
import { PlotContent } from 'util/blocks/interfaces'
import { makePlotCopiedContent } from 'util/shared_content/helpers'
import { CopiedPlotContent } from 'util/shared_content/interfaces'

const PlotItem = ({ content }: { content: PlotContent }) => {
  let copyContentValues: CopiedPlotContent | undefined
  const { setPlotsLoaded, forceRenderPlots, analysisData, narrative } = useContext(AnalysisContext)

  // When the plot has finished rendering
  // update AnalysisContext's plotsLoaded
  // to allow for print with plots
  const onInitialized = () => {
    setPlotsLoaded((prevPlotsLoaded: boolean[]) => {
      const falseIndex = prevPlotsLoaded.findIndex((p: boolean) => !p)
      // copy old plotsLoaded to force re-render
      const newPlotsLoaded = [...prevPlotsLoaded]

      // update one of the false plotsLoaded to be true
      if (falseIndex !== -1) {
        newPlotsLoaded[falseIndex] = true
      }

      return newPlotsLoaded
    })
  }

  const { value } = content
  const datasetSlug = value?.config?.dataset_slug
  const groupSlug = value?.config?.group_slug
  const plotSlug = value?.config?.plot_slug
  const uploadKey = analysisData?.upload_key
  const narrativeSlug = narrative?.slug

  const valueWithMeta = {
    ...value,
    config: {
      ...value.config,
      upload_key: uploadKey,
      narrative_slug: narrativeSlug,
    },
  }

  if (datasetSlug && groupSlug && plotSlug) {
    copyContentValues = makePlotCopiedContent({ datasetSlug, groupSlug, plotSlug })
  }

  return (
    <DynamicPlotHeightWrapper
      render={(updatedHeight) => (
        <DynamicPlotWithContext
          {...content}
          {...valueWithMeta}
          contextMeta={{
            datasetSlug,
            groupSlug,
            plotSlug,
            narrativeSlug,
            uploadKey,
          }}
          isDashboard
          copyContentValues={copyContentValues}
          height={updatedHeight}
          onInitialized={onInitialized}
          forceRender={forceRenderPlots}
        />
      )}
    />
  )
}

export default PlotItem

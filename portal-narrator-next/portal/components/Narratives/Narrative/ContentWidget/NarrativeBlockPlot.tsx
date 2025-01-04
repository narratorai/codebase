import AnalysisContext from 'components/Narratives/Narrative/AnalysisContext'
import DynamicPlotWithContext from 'components/shared/DynamicPlotWithContext'
import { Box } from 'components/shared/jawns'
import { useContext, useMemo } from 'react'
import styled from 'styled-components'
import { PlotContent } from 'util/blocks/interfaces'
import { breakpoints, colors } from 'util/constants'
import { makePlotCopiedContent } from 'util/shared_content/helpers'

const PlotBox = styled(Box)`
  margin-top: 24px;
  margin-bottom: 24px;
  border-radius: 8px;

  @media print {
    box-shadow: none;
    border: 1px solid ${colors.gray300};
    break-inside: avoid;
  }

  @media only screen and (max-width: ${breakpoints.md}) {
    box-shadow: none;
    border-radius: 0;
    border: 1px solid ${colors.gray300};
    border-left: none;
    border-right: none;
    padding: 24px 0;
  }
`

interface Props {
  config: PlotContent
}

const NarrativeBlockPlot = ({ config }: Props) => {
  const { forceRenderPlots, setPlotsLoaded, analysisData, narrative } = useContext(AnalysisContext)
  const upload_key = analysisData?.upload_key
  const narrative_slug = narrative?.slug

  const { value } = config
  const { config: plotConfig, height } = value || {}
  const { dataset_slug: datasetSlug, group_slug: groupSlug, plot_slug: plotSlug } = plotConfig || {}

  const valueWithMeta = {
    ...value,
    config: {
      ...value.config,
      upload_key,
      narrative_slug,
    },
  }

  // When the plot has finished rendering
  // update AnalysisContext's plotsLoaded
  // to allow for print with plots
  const onInitialized = () => {
    // don't need this (or exist) for build narrative
    if (setPlotsLoaded) {
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
  }

  const copyContentValues = useMemo(() => {
    // create copy content values if all fields present
    if (datasetSlug && groupSlug && plotSlug) {
      return makePlotCopiedContent({ datasetSlug, groupSlug, plotSlug: plotSlug })
    }

    // otherwise there is nothing to copy
    return undefined
  }, [datasetSlug, groupSlug, plotSlug])

  return (
    <PlotBox p="32px" className="dc-narrative-block-plot">
      <DynamicPlotWithContext
        {...valueWithMeta}
        contextMeta={{
          datasetSlug,
          groupSlug,
          plotSlug,
          narrativeSlug: narrative_slug,
          uploadKey: upload_key,
        }}
        isDashboard={false}
        forceRender={forceRenderPlots}
        onInitialized={onInitialized}
        copyContentValues={copyContentValues}
        height={height || 320}
      />
    </PlotBox>
  )
}

export default NarrativeBlockPlot

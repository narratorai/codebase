import ViewRawDataTableModal from 'components/Narratives/Narrative/ContentWidget/ViewRawDataTableModal'
import DynamicPlot, { Props as DynamicPlotProps } from 'components/shared/DynamicPlot'
import { Box } from 'components/shared/jawns'
import { useEffect, useState } from 'react'

export interface DynamicPlotWithContextMeta {
  datasetSlug?: string
  dataset?: any
  groupSlug: string
  plotSlug: string
  narrativeSlug?: string
  uploadKey?: string
}

interface Props extends DynamicPlotProps {
  contextMeta: DynamicPlotWithContextMeta
  isDashboard?: boolean
}

const DynamicPlotWithContext = ({ contextMeta, isDashboard, ...plotProps }: Props) => {
  // data from tooltip on keystroke "d" and hover
  // used to build the raw data table
  const [selectedData, setSelectedData] = useState<Record<string, any>>()
  const [plotIsHovered, setPlotIsHovered] = useState(false)
  const [tooltipData, setTooltipData] = useState<any>()

  const handleGetTooltipData = (data: any) => {
    setTooltipData(data)
  }

  const handleCloseRawDataTable = () => setSelectedData(undefined)

  // keep track of whether the user is holding down shift or not
  // this allows the user to select multiple rows when holding shift
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' && plotIsHovered && !!tooltipData) {
        setSelectedData(tooltipData)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [plotIsHovered, tooltipData])

  const handleMouseEnter = () => {
    setPlotIsHovered(true)
  }

  const handleMouseLeave = () => {
    setPlotIsHovered(false)
    setTooltipData(undefined)
  }

  return (
    <Box>
      {/* show table data when they right click on a plot for "View Raw Data" */}
      {selectedData && (
        <ViewRawDataTableModal
          onClose={handleCloseRawDataTable}
          selectedData={selectedData}
          contextMeta={contextMeta}
          isDashboard={isDashboard}
        />
      )}

      <Box onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <DynamicPlot {...plotProps} getTooltipData={handleGetTooltipData} />
      </Box>
    </Box>
  )
}

export default DynamicPlotWithContext

import { INNER_CONTENT_VETICAL_PADDING } from 'components/Narratives/Dashboards/BuildDashboard/constants'
import { ANTV_TITLE_HEIGHT } from 'components/shared/AntVPlots/constants'
import _ from 'lodash'
import React from 'react'
import Measure from 'react-measure'

interface Props {
  render: (updatedHeight?: number) => React.ReactElement
}

const DynamicPlotHeightWrapper = ({ render }: Props) => {
  return (
    <Measure bounds>
      {({ measureRef, contentRect }) => {
        const height = contentRect?.bounds?.height

        // antv is not great at dynamic heights
        // using react-measure to get the container height
        let updatedHeight = 0

        // antv height
        if (height && _.isFinite(height)) {
          updatedHeight = height - INNER_CONTENT_VETICAL_PADDING * 2 - ANTV_TITLE_HEIGHT - 8
        }

        return (
          <div ref={measureRef} style={{ height: '100%' }}>
            {render(updatedHeight)}
          </div>
        )
      }}
    </Measure>
  )
}

export default DynamicPlotHeightWrapper

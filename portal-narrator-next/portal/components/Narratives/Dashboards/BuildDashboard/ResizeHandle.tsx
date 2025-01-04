import { Box } from 'components/shared/jawns'
import React, { LegacyRef } from 'react'

interface Props {
  handleOnHover: () => void
  handleOnExitHover: () => void
}

const ResizeHandle = React.forwardRef((props: Props, ref) => {
  const { handleOnHover, handleOnExitHover } = props

  return (
    <Box onMouseEnter={handleOnHover} onMouseLeave={handleOnExitHover}>
      <div
        ref={ref as LegacyRef<HTMLDivElement> | undefined}
        {...props}
        style={{ bottom: 4, right: 4 }}
        className="react-resizable-handle react-resizable-handle-se"
      />
    </Box>
  )
})

export default ResizeHandle

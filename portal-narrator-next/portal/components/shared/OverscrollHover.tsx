import React, { ReactElement, useState } from 'react'
import { useEffect } from 'react'

//
// If given true will prevent navigating back on trackpad scroll
// Can use this directly to disable unneeded navigation when an element exists
//

const OVERSCROLL_CLASS = 'no-overscroll'

const useOverscroll = (disableOverscroll = true) => {
  useEffect(() => {
    if (disableOverscroll) {
      document.body.classList.add(OVERSCROLL_CLASS)
    } else {
      document.body.classList.remove(OVERSCROLL_CLASS)
    }

    return () => {
      document.body.classList.remove(OVERSCROLL_CLASS)
    }
  }, [disableOverscroll])

  return null
}

//
// Automatically applies overscroll to an element on hover
//

interface OverscrollHoverProps {
  children: ReactElement | ReactElement[]
  style?: React.CSSProperties
}

const OverscrollHover: React.FC<OverscrollHoverProps> = ({ children, style }) => {
  const [hovering, setHovering] = useState(true)
  useOverscroll(hovering)

  return (
    <div
      style={style}
      onMouseEnter={() => {
        setHovering(true)
      }}
      onMouseLeave={() => {
        setHovering(false)
      }}
    >
      {children}
    </div>
  )
}

export default OverscrollHover

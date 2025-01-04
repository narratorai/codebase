import { clamp } from 'lodash'
import { NumberSize, Resizable } from 're-resizable'
import { Direction } from 're-resizable/lib/resizer'
import React, { useState } from 'react'

interface Props {
  children: React.ReactNode
  height: number
  minHeight?: number
  minWidth?: string | number
  onResize: (size: { height: number; width: number | string }) => void
  resizeDirection?: 'horizontal' | 'vertical' | 'both' | 'none'
  style?: React.CSSProperties

  /** Width of the container in percentage. */
  width?: string
}

/**
 * Resizable container for the content of custom tiptap nodes.
 */
export default function ResizableNodeContentContainer({
  children,
  height,
  minHeight = 200,
  minWidth = '10%',
  onResize,
  resizeDirection = 'none',
  style,
  width = '100%',
}: Props) {
  const isResizable = resizeDirection !== 'none'
  const [size, setSize] = useState({ width, height: height ?? 450 })

  const handleResizeStop = (e: unknown, direction: Direction, ref: HTMLElement, d: NumberSize) => {
    const nextHeight = size.height + d.height
    const parentWidth = ref.parentElement?.clientWidth as number
    const nextWidth = clamp((ref.clientWidth / parentWidth) * 100, 10, 100)

    setSize({ width: `${nextWidth}%`, height: nextHeight })
    onResize({ width: `${nextWidth}%`, height: nextHeight })
  }

  return (
    <Resizable
      enable={
        isResizable
          ? {
              bottom: resizeDirection === 'vertical' || resizeDirection === 'both',
              bottomLeft: false,
              bottomRight: resizeDirection === 'both',
              left: false,
              right: resizeDirection === 'horizontal' || resizeDirection === 'both',
              top: false,
              topLeft: false,
              topRight: false,
            }
          : false
      }
      grid={[10, 10]}
      maxWidth="100%"
      minHeight={minHeight}
      minWidth={minWidth}
      onResizeStop={handleResizeStop}
      size={size}
      style={style}
    >
      {children}
    </Resizable>
  )
}

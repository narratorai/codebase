import copy from 'copy-to-clipboard'
import React, { ReactElement } from 'react'

interface Props {
  text: string
  children: ReactElement
  onCopy?: (text: string, result: boolean) => void
  options?: {
    debug: boolean
    message: string
    format: string
  }
}

const CopyToClipboard = ({ text, children, onCopy, options }: Props) => {
  const handleClick = (event: MouseEvent) => {
    event.stopPropagation()

    const result = copy(text, options)
    onCopy?.(text, result)
  }

  const elem = React.Children.only(children)
  return React.cloneElement(elem, { onClick: handleClick })
}

export default CopyToClipboard

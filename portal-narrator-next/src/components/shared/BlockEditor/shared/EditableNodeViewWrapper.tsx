import { NodeViewWrapper, NodeViewWrapperProps } from '@tiptap/react'
import { Children as ReactChildren } from 'react'

import { useFloatingMenu } from '@/hooks'

interface Props extends NodeViewWrapperProps {
  children: [React.ReactNode, React.ReactNode]
}

/**
 * Component that wraps a node view with a floating menu.
 */
export default function EditableNodeViewWrapper({ children, ...props }: Props) {
  const [reference, floatingMenu] = ReactChildren.toArray(children)

  const { refs, getFloatingProps, getReferenceProps, floatingStyles, isOpen } = useFloatingMenu()

  return (
    <NodeViewWrapper {...props}>
      <div ref={refs.setReference} {...getReferenceProps()}>
        {reference}
      </div>

      {isOpen && (
        <div ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
          {floatingMenu}
        </div>
      )}
    </NodeViewWrapper>
  )
}

'use client'

import '../../../styles/tiptap.css'

import { ForwardedRef, forwardRef, Suspense } from 'react'
import { useDeepCompareMemo } from 'use-deep-compare'

import { IReportNodeCompileContext } from '@/stores/reports/interfaces'

import Spin from '../Spin'
import type { Props as BlockEditorWithExtensionsProps } from './BlockEditorWithExtensions'
import BlockEditorWithExtensions, { BlockEditorWithExtensionsRef } from './BlockEditorWithExtensions'
import { getAllExtensions } from './extensions'

interface Props extends Omit<BlockEditorWithExtensionsProps, 'extensionsPromise'> {
  /** Context for compiling nodes */
  compileContext: IReportNodeCompileContext
}

/**
 * A tiptap editor component.
 */
function BlockEditor({ compileContext, ...props }: Props, ref: ForwardedRef<BlockEditorWithExtensionsRef>) {
  const extensionsPromise = useDeepCompareMemo(
    () => getAllExtensions(props.readOnly ?? true, compileContext),
    [props.readOnly, compileContext]
  )

  return (
    <Suspense
      fallback={
        <div className="p-10">
          <Spin className="mx-auto size-8 text-gray-100" />
        </div>
      }
    >
      <BlockEditorWithExtensions extensionsPromise={extensionsPromise} ref={ref} {...props} />
    </Suspense>
  )
}

export default forwardRef(BlockEditor)

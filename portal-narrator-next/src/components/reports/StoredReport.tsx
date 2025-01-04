'use client'

import { JSONContent } from '@tiptap/core'
import clsx from 'clsx'
import { useRef } from 'react'

import BlockEditor from '@/components/shared/BlockEditor'
import Spin from '@/components/shared/Spin'
import { useKeyboardShortcut } from '@/hooks'
import { ContentAdapter, useReportUI } from '@/stores/reports'
import { IRemoteReportContentMeta } from '@/stores/reports/interfaces'

import { BlockEditorWithExtensionsRef } from '../shared/BlockEditor/BlockEditorWithExtensions'
import AutoSaveReport from './AutoSaveReport'
import { useReportQuery, useStoredReport } from './hooks'
import ToggleEditModeButton from './ToggleEditModeButton'

interface Props {
  id: string
}

export default function StoredReport({ id }: Props) {
  const editorRef = useRef<BlockEditorWithExtensionsRef>(null)
  const { fullWidth, readOnly, autoSave, toggleSaving, toggleReadOnly } = useReportUI()
  const { isSuccess, isError, error } = useReportQuery(id)
  const { content, lastRun, canEdit, onChange } = useStoredReport()

  const saveContent = () => editorRef.current?.saveContent()
  useKeyboardShortcut(['meta+s', 'shift+meta+s'], () => saveContent())

  const handleChange = async (
    value: JSONContent,
    meta: IRemoteReportContentMeta,
    textContent: string,
    firstNodeText?: string
  ) => {
    try {
      toggleSaving(true)
      await onChange(value, meta, textContent, firstNodeText)
    } finally {
      toggleSaving(false)
    }
  }

  const handleToggleReadOnly = () => {
    if (!readOnly) saveContent()?.finally(() => toggleReadOnly())
    else toggleReadOnly()
  }

  return (
    <section className={clsx('mx-auto space-y-8 py-10', { 'max-w-screen-lg': !fullWidth })}>
      {isError ? <div className="mx-auto p-10 text-red-600">{error.message}</div> : null}
      {isSuccess ? (
        <>
          {canEdit ? (
            <div className="px-10">
              <ToggleEditModeButton inEditMode={!readOnly} onClick={handleToggleReadOnly} />
            </div>
          ) : null}
          <BlockEditor
            compileContext={{
              reportId: id,
              runKey: lastRun?.key,
            }}
            content={ContentAdapter.getJSONContent(content)}
            key={`readOnly:${readOnly}`}
            onChange={handleChange}
            readOnly={readOnly || !canEdit}
            ref={editorRef}
          />
          {autoSave ? <AutoSaveReport changeInterval={30_000} onChange={saveContent} /> : null}
        </>
      ) : (
        <Spin className="mx-auto size-8 text-gray-100" />
      )}
    </section>
  )
}

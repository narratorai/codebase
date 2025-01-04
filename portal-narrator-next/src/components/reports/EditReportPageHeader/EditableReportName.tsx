'use client'

import { useRef } from 'react'
import { useClickAway, useToggle } from 'react-use'
import { useShallow } from 'zustand/react/shallow'

import { useReport } from '@/stores/reports'

import ReportNameForm, { ReportNameFormData } from './ReportNameForm'

export default function EditableReportName() {
  const containerRef = useRef(null)
  const [showForm, toggleForm] = useToggle(false)
  const [name, save] = useReport(useShallow((state) => [state.name, state.save]))

  useClickAway(containerRef, () => toggleForm(false))

  const handleSubmit = async (values: ReportNameFormData) => {
    toggleForm(false)
    await save(values)
  }

  return (
    <div ref={containerRef}>
      {showForm ? (
        <ReportNameForm onSubmit={handleSubmit} values={{ name }} />
      ) : (
        <button onClick={toggleForm}>{name}</button>
      )}
    </div>
  )
}

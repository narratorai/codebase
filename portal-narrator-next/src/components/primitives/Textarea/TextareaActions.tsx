import React from 'react'

interface Props {
  children: React.ReactNode
}

const TextareaActions = ({ children }: Props) => <div className="flex justify-between p-2">{children}</div>

export default TextareaActions

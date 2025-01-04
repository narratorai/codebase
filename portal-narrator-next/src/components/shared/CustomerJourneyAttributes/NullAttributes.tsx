import React from 'react'

interface Props {
  nullAttributes: string[]
}

const NullAttributes = ({ nullAttributes }: Props) => {
  if (nullAttributes.length === 0) return null
  return (
    <div className="gap-2 flex-y">
      <span className="px-1 text-base">Null Attributes</span>
      <div className="w-full border-t border-gray-200"></div>
      <span className="text-wrap px-1 text-xs">{nullAttributes.join(', ')}</span>
    </div>
  )
}

export default NullAttributes

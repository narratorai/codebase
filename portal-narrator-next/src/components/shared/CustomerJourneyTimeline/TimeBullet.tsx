import React from 'react'

interface Props {
  last: boolean
}

const TimeBullet = ({ last }: Props) => (
  <div className="relative w-6">
    {!last && <div className="absolute bottom-0 left-[11.5px] top-0 border-l border-gray-200"></div>}
    <div className="absolute size-6 rounded-full bg-white p-1">
      <div className="size-4 rounded-full border-4 border-blue-600" />
    </div>
  </div>
)

export default TimeBullet

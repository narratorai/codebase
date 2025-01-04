import React from 'react'

interface Props {
  first: boolean
}

const DateBullet = ({ first }: Props) => (
  <div className="relative w-6 px-1.5">
    {first && <div className="absolute bottom-0 left-[11.5px] top-1.5 border-l border-gray-200"></div>}
    {!first && <div className="absolute bottom-0 left-[11.5px] top-0 border-l border-gray-200"></div>}
    <div className="absolute top-1.5 size-3 rounded-full bg-white p-0.5">
      <div className="size-2 rounded-full bg-gray-200" />
    </div>
  </div>
)

export default DateBullet

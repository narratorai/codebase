import clsx from 'clsx'

import { SIZES } from './constants'

interface Props {
  size: keyof typeof SIZES
}

const Placeholder = ({ size }: Props) => (
  <div
    className={clsx(
      'relative w-full overflow-hidden rounded border border-dashed border-gray-400 opacity-75',
      SIZES[size]
    )}
  >
    <svg className="absolute inset-0 h-full w-full stroke-gray-900/10" fill="none">
      <defs>
        <pattern
          height="10"
          id="pattern-f8a573d1-c77b-4155-beef-3dfeb1425661"
          patternUnits="userSpaceOnUse"
          width="10"
          x="0"
          y="0"
        >
          <path d="M-3 13 15-5M-5 5l18-18M-1 21 17 3"></path>
        </pattern>
      </defs>
      <rect fill="url(#pattern-f8a573d1-c77b-4155-beef-3dfeb1425661)" height="100%" stroke="none" width="100%"></rect>
    </svg>
  </div>
)

export default Placeholder

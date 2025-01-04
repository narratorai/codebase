import type { TooltipArrowProps } from '@radix-ui/react-tooltip'
import * as Tooltip from '@radix-ui/react-tooltip'
import React from 'react'

type Props = TooltipArrowProps & React.RefAttributes<SVGSVGElement>

const Content = ({ ...props }: Props) => <Tooltip.Arrow {...props} className="fill-gray-1000 stroke-pink-purple-800" />

export default Content

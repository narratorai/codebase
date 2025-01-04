import { Button as HeadlessButton } from '@headlessui/react'
import clsx from 'clsx'
import { forwardRef } from 'react'

import { Link, LinkRef } from '../Link'
import {
  BASE_BUTTON_STYLES,
  CIRCLE_BUTTON_SIZES,
  ICON_BUTTON_SIZES,
  OUTLINE_BUTTON_STYLES,
  PILL_BUTTON_SIZES,
  PLAIN_BUTTON_STYLES,
  PLAIN_ICON_BUTTON_STYLES,
  RECTANGLE_BUTTON_SIZES,
  SOLID_BUTTON_STYLES,
  SOLID_ICON_BUTTON_STYLES,
} from './constants'
import { CircleButtonSize, IButton, IconButtonSize, PillButtonSize, RectangleButtonSize } from './interfaces'
import TouchTarget from './TouchTarget'

type ButtonRef = React.ForwardedRef<HTMLElement>

type Props = IButton

const Button = (
  { children, circle, icon, label, outline = false, pill, plain = false, size = 'sm', ...props }: Props,
  ref: ButtonRef
) => {
  let TYPE = SOLID_BUTTON_STYLES
  if (icon) TYPE = SOLID_ICON_BUTTON_STYLES
  if (plain) TYPE = PLAIN_BUTTON_STYLES
  if (icon && plain) TYPE = PLAIN_ICON_BUTTON_STYLES
  if (outline) TYPE = OUTLINE_BUTTON_STYLES

  let SIZE = RECTANGLE_BUTTON_SIZES[size as RectangleButtonSize]
  if (circle) SIZE = CIRCLE_BUTTON_SIZES[size as CircleButtonSize]
  if (pill) SIZE = PILL_BUTTON_SIZES[size as PillButtonSize]
  if (icon) SIZE = ICON_BUTTON_SIZES[size as IconButtonSize]

  const className = clsx(BASE_BUTTON_STYLES, TYPE, SIZE)

  if ('href' in props) {
    return (
      <Link {...props} className={className} href={props.href} ref={ref as LinkRef}>
        <TouchTarget>
          {children}
          {icon && <span className="sr-only">{label}</span>}
        </TouchTarget>
      </Link>
    )
  }

  return (
    <HeadlessButton {...props} className={clsx(className, 'cursor-default')} ref={ref}>
      <TouchTarget>
        {children}
        {icon && <span className="sr-only">{label}</span>}
      </TouchTarget>
    </HeadlessButton>
  )
}

export default forwardRef(Button)

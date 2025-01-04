import { Button as HeadlessButton } from '@headlessui/react'
import { ChevronUpDownIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { forwardRef } from 'react'

import {
  BASE_BUTTON_STYLES,
  OUTLINE_BUTTON_STYLES,
  PLAIN_BUTTON_STYLES,
  SOLID_BUTTON_STYLES,
  TRIGGER_BUTTON_SIZE,
  TRIGGER_BUTTON_STYLES,
} from './constants'
import { ISelectButton } from './interfaces'
import TouchTarget from './TouchTarget'

type Ref = React.ForwardedRef<HTMLElement>

type Props<T> = ISelectButton<T>

const SingleSelectButton = <T,>(
  {
    displayValue = (value: T) => JSON.stringify(value),
    outline = false,
    placeholder,
    plain = false,
    value,
    ...props
  }: Props<T>,
  ref: Ref
) => {
  let TYPE = SOLID_BUTTON_STYLES
  if (plain) TYPE = PLAIN_BUTTON_STYLES
  if (outline) TYPE = OUTLINE_BUTTON_STYLES

  const classes = clsx(BASE_BUTTON_STYLES, TYPE, TRIGGER_BUTTON_SIZE)

  return (
    <HeadlessButton {...props} className={classes} ref={ref}>
      <TouchTarget>
        {!value && placeholder && <span className={clsx(TRIGGER_BUTTON_STYLES.placeholder)}>{placeholder}</span>}
        {value && <span className={clsx(TRIGGER_BUTTON_STYLES.value)}>{displayValue(value)}</span>}
        <ChevronUpDownIcon aria-hidden="true" />
      </TouchTarget>
    </HeadlessButton>
  )
}

export default forwardRef(SingleSelectButton) as <T>(
  props: { ref?: Ref } & Props<T>
) => ReturnType<typeof SingleSelectButton>

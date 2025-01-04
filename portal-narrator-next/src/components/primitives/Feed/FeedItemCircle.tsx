import React from 'react'

type Props = Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const FeedItemCircle = (props: Props) => (
  <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white" {...props} />
)

export default FeedItemCircle

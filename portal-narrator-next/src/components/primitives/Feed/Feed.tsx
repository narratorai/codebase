import React from 'react'

type Props = Omit<React.ComponentPropsWithoutRef<'ul'>, 'className'>

const Feed = (props: Props) => <ul {...props} className="space-y-6" />

export default Feed

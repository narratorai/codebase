import type React from 'react'

type Props = React.ComponentPropsWithoutRef<'thead'>

const TableHead = (props: Props) => <thead className="text-zinc-500 dark:text-zinc-400" {...props} />

export default TableHead

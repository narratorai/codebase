import clsx from 'clsx'
import { useForm } from 'react-hook-form'

interface Props {
  className?: string
  onChange: (value: string) => void
}

export default function EmojiSearchForm({ onChange, className }: Props) {
  const form = useForm({
    defaultValues: { search: '' },
  })

  const onSubmit = (data: { search: string }) => onChange(data.search)

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input
        className={clsx('w-full rounded px-3 py-1 text-sm bordered-gray-200', className)}
        placeholder="Search"
        {...form.register('search')}
      />
    </form>
  )
}

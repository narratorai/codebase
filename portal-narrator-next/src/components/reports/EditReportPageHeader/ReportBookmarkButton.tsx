'use client'

import { ArrowPathIcon, BookmarkIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

import { Button } from '@/components/primitives/Button'

import useBookmarkMutation from './useBookmarkMutation'

export default function ReportBookmarkButton() {
  const { favorited, isPending, toggle } = useBookmarkMutation()

  const handleClick = () => {
    toggle()
  }

  return (
    <Button
      disabled={isPending}
      onClick={handleClick}
      plain
      title={favorited ? 'Unmark report as favorite' : 'Mark report as favorite'}
    >
      {isPending ? (
        <ArrowPathIcon className="animate-spin" />
      ) : (
        <BookmarkIcon className={clsx({ 'fill-gray-400': favorited })} />
      )}
    </Button>
  )
}

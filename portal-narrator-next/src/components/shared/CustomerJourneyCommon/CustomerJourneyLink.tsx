import Link from 'next/link'
import React from 'react'
import LinkIcon from 'static/mavis/icons/link.svg'

interface Props {
  href: string
}

const CustomerJourneyLink = ({ href }: Props) => (
  <Link href={href}>
    <LinkIcon className="size-6 stroke-blue-600" />
  </Link>
)

export default CustomerJourneyLink

interface Props {
  alt?: string
  initials: string
}

const AvatarInitials = ({ alt, initials }: Props) => {
  return (
    <svg
      aria-hidden={alt ? undefined : 'true'}
      className="size-full select-none fill-current p-[5%] text-[48px] font-medium uppercase"
      viewBox="0 0 100 100"
    >
      {alt && <title>{alt}</title>}
      <text alignmentBaseline="middle" dominantBaseline="middle" dy=".125em" textAnchor="middle" x="50%" y="50%">
        {initials}
      </text>
    </svg>
  )
}

export default AvatarInitials

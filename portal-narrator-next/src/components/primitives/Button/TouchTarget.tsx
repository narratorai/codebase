interface Props {
  children: React.ReactNode
}

/**
 * Expand the hit area to at least 44×44px on touch devices
 */
const TouchTarget = ({ children }: Props) => (
  <>
    <span
      aria-hidden="true"
      className="absolute left-1/2 top-1/2 size-[max(100%,2.75rem)] -translate-x-1/2 -translate-y-1/2 [@media(pointer:fine)]:hidden"
    />
    {children}
  </>
)

export default TouchTarget

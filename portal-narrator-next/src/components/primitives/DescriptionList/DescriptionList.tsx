type Props = React.ComponentPropsWithoutRef<'dl'>

const DescriptionList = (props: Props) => (
  <dl {...props} className="grid grid-cols-1 text-base/6 sm:grid-cols-[min(50%,theme(spacing.80))_auto] sm:text-sm/6" />
)

export default DescriptionList

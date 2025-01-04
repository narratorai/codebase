type Props = Omit<React.ComponentPropsWithoutRef<'time'>, 'className'>

const FeedItemTime = (props: Props) => <time className="flex-none py-0.5 text-xs/5 text-gray-500" {...props} />

export default FeedItemTime

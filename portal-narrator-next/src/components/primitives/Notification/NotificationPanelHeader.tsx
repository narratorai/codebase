interface Props {
  description?: string
  title: string
}

const NotificationPanelHeader = ({ description, title }: Props) => {
  return (
    <div className="w-0 flex-1 pt-0.5">
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
    </div>
  )
}

export default NotificationPanelHeader

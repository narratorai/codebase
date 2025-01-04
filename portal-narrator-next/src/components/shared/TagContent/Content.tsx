interface Props {
  children: React.ReactNode
}

const Content = ({ children }: Props) => (
  <div className="flex flex-row flex-wrap gap-1 rounded-lg bg-white p-2 text-sm font-medium bordered-gray-200">
    {children}
  </div>
)

export default Content

interface Props {
  description?: string
  label?: string
  percent: number
}

const Progress = ({ description, label, percent }: Props) => (
  <div>
    <h4 className="sr-only">{label}</h4>
    <div className="flex flex-row justify-between gap-4">
      <p className="text-sm font-medium text-gray-900">{description}</p>
      <p className="text-sm font-medium text-gray-900">{percent}%</p>
    </div>
    <div aria-hidden="true" className="mt-1">
      <div className="overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-indigo-600 transition-all duration-300 ease-in-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  </div>
)

export default Progress

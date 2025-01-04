interface Props extends React.RefAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Label = ({ children, ...props }: Props) => (
  <div {...props} className="badge-label">
    {children}
  </div>
)

export default Label

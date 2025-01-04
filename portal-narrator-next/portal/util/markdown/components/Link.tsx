interface Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  node: Node
}

const Link = ({ node, children, ...props }: Props) => {
  return (
    // include props for things like href, target, etc
    <a target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  )
}

export default Link

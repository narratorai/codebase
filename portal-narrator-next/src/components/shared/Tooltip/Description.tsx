import React from 'react'
interface Props extends React.RefAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

const Description = ({ children, ...props }: Props) => (
  <p {...props} className="text-xs text-gray-400">
    {children}
  </p>
)

export default Description

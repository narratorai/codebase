import { FieldProps } from '@rjsf/core'
import React from 'react'
import Confetti from 'react-confetti'

const ConfettiField: React.FC<FieldProps> = () => (
  <Confetti recycle={false} gravity={0.3} style={{ position: 'fixed' }} />
)

export default ConfettiField

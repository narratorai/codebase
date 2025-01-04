import { includes, isEmpty } from 'lodash'
import { Field } from 'react-final-form'

interface Props {
  when: string
  children: any
  is?: string
  isNot?: string
  isIn?: string[]
  exists?: boolean
}

const Condition = ({ when, is, isIn = [], isNot, children, exists }: Props) => {
  return (
    <Field name={when} subscription={{ value: true }}>
      {({ input: { value } }) => {
        // If you pass in props exists, you just care that the value has been entered already
        if (exists && !isEmpty(value)) {
          return children
        }

        // If you pass props.isIn, value could be isIn a collection
        if (!isEmpty(isIn) && includes(isIn, value)) {
          return children
        }

        // if you pass props.is, it's about equivalency
        if (value === is) {
          return children
        }

        // if you pass props.is, it's about equivalency
        if (isNot && value !== isNot) {
          return children
        }

        return null
      }}
    </Field>
  )
}

export default Condition

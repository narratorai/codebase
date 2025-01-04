type Props = React.ComponentPropsWithoutRef<'div'>

const FieldGroup = (props: Props) => <div className="space-y-8" data-slot="control" {...props} />

export default FieldGroup

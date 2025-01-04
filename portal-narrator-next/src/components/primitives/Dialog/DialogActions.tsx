type Props = React.ComponentPropsWithoutRef<'div'>

const DialogActions = (props: Props) => (
  <div
    {...props}
    className="mt-8 flex flex-col-reverse items-center justify-end gap-3 *:w-full sm:flex-row sm:*:w-auto"
  />
)

export default DialogActions

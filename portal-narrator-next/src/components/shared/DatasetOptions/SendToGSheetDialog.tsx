/* eslint-disable react/jsx-max-depth */
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'

import { Button } from '@/components/primitives/Button'
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/primitives/Dialog'
import { Field, FieldGroup, Fieldset, Label } from '@/components/primitives/Fieldset'
import { Input } from '@/components/primitives/Input'
import { Strong } from '@/components/primitives/Text'

import { ISendToGSheetFormData, ISendToGSheetFormSubmitData, schema } from './interfaces'

const resolver = zodResolver(schema)

interface Props {
  onCancel: () => void
  onSubmit: (submitData: ISendToGSheetFormSubmitData) => Promise<void>
  open: boolean
}

const SendToGSheetDialog = ({ open, onCancel, onSubmit }: Props) => {
  const methods = useForm<ISendToGSheetFormData>({ resolver })
  const { register, handleSubmit, formState, reset } = methods
  const { isSubmitting } = formState

  const submitForm = handleSubmit(async (formData: ISendToGSheetFormData) => {
    const { gsheetUrl } = formData
    const url = new URL(gsheetUrl)
    const sheetKey = url.pathname.split('/')[3]
    await onSubmit({ sheetKey })
    reset()
  })

  const handleCancel = () => {
    reset()
    onCancel()
  }

  return (
    <Dialog onClose={handleCancel} open={open}>
      <DialogTitle>Share The Sheet</DialogTitle>
      <DialogDescription size="sm">
        Share the sheet with <Strong>reports@narrator.ai</Strong> to give our system access to the data.
      </DialogDescription>
      <FormProvider {...methods}>
        <form onSubmit={submitForm}>
          <DialogBody>
            <Fieldset disabled={isSubmitting}>
              <FieldGroup>
                <Field>
                  <Label>Gsheet URL</Label>
                  <Input {...register('gsheetUrl')} />
                </Field>
              </FieldGroup>
            </Fieldset>
          </DialogBody>

          <DialogActions>
            <Button autoFocus disabled={isSubmitting} onClick={handleCancel} plain>
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              Submit
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  )
}

export default SendToGSheetDialog

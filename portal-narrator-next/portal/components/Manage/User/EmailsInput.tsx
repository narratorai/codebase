import { SelectValue } from 'antd/lib/select'
import { Select } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { handleParseCsvEmails } from 'components/Manage/helpers'
import { Box, Typography } from 'components/shared/jawns'
import { ICompany_User } from 'graph/generated'
import { filter, includes, isArray, isEmpty, join, map } from 'lodash'
import { Controller, useFormContext, Validate } from 'react-hook-form'
import styled from 'styled-components'
import { areEmails, required } from 'util/forms'

type KeyBoardDownEvent = Event & { target: HTMLInputElement; code: string }

const StyledSelect = styled(Select)`
  .antd5-select-selector {
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
  }

  .antd5-select-arrow {
    display: none;
  }
`

interface Props {
  companyUsers?: ICompany_User[]
}

const EmailsInput = ({ companyUsers }: Props) => {
  const { control, watch, setValue } = useFormContext()
  const emailsToAdd = watch('emails') || []

  const handleValidate = (emails: string[]) => {
    const requiredError = required(emails)
    const invalidEmails = areEmails(emails)

    const existingEmails = map(companyUsers, (companyUser) => companyUser?.user?.email)
    const duplicateEmails = filter(existingEmails, (existingEmail) => includes(emails, existingEmail))

    if (isEmpty(invalidEmails) && isEmpty(duplicateEmails) && !requiredError) {
      return undefined
    }

    return (
      <Box>
        {requiredError && <Typography>{requiredError}</Typography>}
        {!isEmpty(invalidEmails) && <Typography>{invalidEmails}</Typography>}
        {!isEmpty(duplicateEmails) && (
          <Typography>{`The following users already exist: ${join(duplicateEmails, ', ')}`}</Typography>
        )}
      </Box>
    )
  }

  const handleOnType = (event: KeyBoardDownEvent) => {
    const { code, target } = event
    const valueTyped = target?.value

    // Programatically parse the typed value on "Space", "Comma", "Enter"
    const shouldParse = !isEmpty(valueTyped) && (code === 'Space' || code === 'Comma' || code === 'Enter')

    // Do not submit on enter (just add tag below)
    if (code === 'Enter') {
      event.preventDefault()
    }

    if (shouldParse) {
      // add the typed value as a tag
      const formattedValue = handleParseCsvEmails([...emailsToAdd, valueTyped])
      // trigger blur to clear out valueTyped
      target.blur()
      // update field value with newly added tag

      setValue('emails', formattedValue, { shouldValidate: true })
      // refocus so they can keep typing/adding more tags
      target.focus()
    }

    // otherwise do nothing
    return null
  }

  // make sure to parse the emails before submitting
  const handleOnChange = (value: SelectValue) => {
    let preFormatValue = value
    if (!isArray(preFormatValue)) preFormatValue = [value as string]

    const formattedValue = handleParseCsvEmails(preFormatValue as string[])
    setValue('emails', formattedValue, { shouldValidate: true })
  }

  return (
    <Controller
      control={control}
      rules={{
        validate: handleValidate as Validate<unknown, unknown>,
      }}
      name={'emails'}
      render={({ field, fieldState: { isTouched: touched, error } }) => (
        <FormItem meta={{ touched, error: error?.message }} layout="vertical" label="Emails" required>
          <StyledSelect
            style={{ width: '424px' }}
            placeholder="Enter Emails"
            mode="tags"
            // hi-jacking select for multiple tags (input wont do it)
            // so never want to show dropdown
            open={false}
            allowClear
            onInputKeyDown={(e) => {
              const typedEvent = e as unknown
              handleOnType(typedEvent as KeyBoardDownEvent)
            }}
            {...field}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: allow onChange override
            onChange={handleOnChange}
          />
        </FormItem>
      )}
    />
  )
}

export default EmailsInput

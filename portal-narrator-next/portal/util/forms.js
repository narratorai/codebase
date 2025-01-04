import _ from 'lodash'
import { isEmail as validatorIsEmail, isURL } from 'validator'
import { isValidCron } from 'cron-validator'
import { notCompanySlugs } from '@/util/auth'
import { handleApproximateCron } from 'util/helpers'
// eslint-disable-next-line
import FinalFormArrayMutators from 'final-form-arrays'

///////////////// HELPERS /////////////////

/**
 * JSON.stringify with replacer that converts undefined values to null
 * @param arg - JSON.stringify argument
 */
export const stringifyWithUndefined = (arg) =>
  JSON.stringify(arg, (k, v) => {
    if (v === undefined) {
      return null
    }
    return v
  })

///////////////// VALIDATORS /////////////////

export const jsonValidation = (value) => {
  try {
    if (_.isString(value)) {
      JSON.parse(value)
    }
  } catch (error) {
    return 'Invalid JSON'
  }
  return value ? undefined : 'Required'
}

export const jsonArrayValidation = (value) => {
  const jsonErrors = jsonValidation(value)
  if (jsonErrors) {
    return jsonErrors
  }

  let arr = value
  if (_.isString(value)) {
    arr = JSON.parse(arr)
  }

  if (!Array.isArray(arr)) {
    return 'JSON must be an array'
  }
}

// Allow for positive/negative check as well as required
// Used by <NumberField />
export const numberValidator = ({ value, isPositiveOnly = false, isRequired = true }) => {
  if (isPositiveOnly) {
    const integerValue = _.toInteger(value)
    if (integerValue < 0) {
      return 'Cannot be negative'
    }
  }

  if (isRequired) {
    return required(value)
  }
}

export const cronValidator = ({ value, isRequired = true }) => {
  if (isRequired && required(value)) {
    return required(value)
  }

  // escape early if there is no value and it is not required
  if (!isRequired && _.isEmpty(value)) {
    return null
  }

  const { formattedCronTab } = handleApproximateCron(value)

  if (formattedCronTab && !isValidCron(formattedCronTab, { seconds: true })) {
    return 'Invalid Cron Tab'
  }

  return null
}

export const required = (value) => {
  // for arrays specifically
  if (_.isArray(value) && _.isEmpty(value)) {
    return 'Required'
  }
  // for numbers as 0 is considered false
  if (_.isNumber(value)) {
    return value || value === 0 ? undefined : 'Required'
  }
  return value ? undefined : 'Required'
}

export const isEmail = (value) => {
  const requiredError = required(value)
  if (requiredError) {
    return requiredError
  }
  return validatorIsEmail(value) ? undefined : 'Invalid Email'
}

export const areEmails = (emails, isRequired = false) => {
  const requiredError = required(emails)
  if (isRequired && requiredError) {
    return requiredError
  }

  const invalidEmails = []
  _.forEach(emails, (email) => {
    if (!validatorIsEmail(email)) {
      invalidEmails.push(email)
    }
  })

  return _.isEmpty(invalidEmails) ? undefined : `The following emails are invalid: ${_.join(invalidEmails, ', ')}`
}

export const isValidWebhookUrl = (value, message) => {
  const requiredError = required(value)
  if (requiredError) {
    return requiredError
  }

  return isURL(value, { protocols: ['https'], require_protocol: true })
    ? undefined
    : message || 'Webhook url requires HTTPS'
}

export const isValidKlaviyoListUrl = (value) => {
  const requiredError = required(value)
  if (requiredError) {
    return requiredError
  }

  return isURL(value, {
    protocols: ['https'],
    host_whitelist: ['www.klaviyo.com', 'mc.sendgrid.com'],
    require_protocol: true,
    disallow_auth: true,
  })
    ? undefined
    : 'Not a valid Klaviyo/Sendgrid URL.'
}

export const isUnique = (value, list) => {
  if (!value) return undefined

  return _.includes(list, value) ? `${value} already exists.` : undefined
}

export const isValidCompanySlug = (value) => {
  const slugRegex = /^[a-z][a-z0-9-]*[a-z0-9]$/
  return slugRegex.test(value)
    ? undefined
    : 'A slug can only contain lowercase letters, numbers, and dashes (-), must start with a letter, and cannot end with a dash'
}

export const isCompanySlug = (value) => {
  return composeValidators(required, isNotForbiddenCompanySlug, isValidCompanySlug)(value)
}

export const isNotForbiddenCompanySlug = (value) => {
  const lowerValue = _.toLower(value)
  if (_.includes(notCompanySlugs, lowerValue)) {
    return `${value} is a reserved name`
  }
}

// composes multiple validators into a single validation function
export const composeValidators =
  (...validators) =>
  (value) =>
    validators.reduce((error, validator) => error || validator(value), undefined)

// used to validate field configs in Build Narrative inputs
export const fieldValidator = (error) => (error?.message ? () => error.message : () => {})

// insert is very broken in narratives (and I imagine elsewhere)
// this overrides react-final-form-array's extra increment logic added to insert
// that breaks our forms
export const arrayMutators = {
  ...FinalFormArrayMutators,
  // https://github.com/final-form/react-final-form-arrays/issues/138#issuecomment-681958884
  insert: ([name, index, value], state, { changeValue }) => {
    changeValue(state, name, (array) => {
      const copy = [...(array || [])]
      copy.splice(index, 0, value)
      return copy
    })
  },
}

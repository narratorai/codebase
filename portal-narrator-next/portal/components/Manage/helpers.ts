import _ from 'lodash'

// Used in AddUsersOverlay
// User can paste a bunch of comma separated emails into input
// and this is used to sanitize/format it
export const handleParseCsvEmails = (emails: string[]) => {
  // make sure there are no duplicates
  const parsedValue = _.uniq(
    _.flatMap(emails, (email) => {
      // handle pasting in comma separated emails
      const separatedEmails = email.split(',')
      // remove white-space around emails
      return _.map(separatedEmails, (email) => _.trim(email))
    })
  )

  return parsedValue
}

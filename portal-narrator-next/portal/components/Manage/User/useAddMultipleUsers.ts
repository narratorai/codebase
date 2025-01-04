import { ICompany_User_Role_Enum } from 'graph/generated'
import { useCallback, useEffect, useState } from 'react'
import { useLazyCallMavis } from 'util/useCallMavis'

export type EmailErrors = Record<string, string | undefined>[]
type CurrentEmailBeingAdded = string | undefined
type EmailsInvited = string[]

interface IAddMultipleUsersReturn {
  currentEmailBeingAdded: CurrentEmailBeingAdded
  emailsInvited: EmailsInvited
  emailsFailed: EmailErrors
  loading: boolean
}

const useAddMultipleUsers = (): [(emails: string[]) => Promise<void>, IAddMultipleUsersReturn] => {
  // keep track of current email being added
  const [currentEmailBeingAdded, setCurrentEmailBeingAdded] = useState<CurrentEmailBeingAdded>()

  // keep track of successful invitations sent (by email)
  const [emailsInvited, setEmailsInvited] = useState<EmailsInvited>([])

  // keep track of failed invitations sent (by email: error message)
  const [emailsFailed, setEmailsFailed] = useState<EmailErrors>([])

  // keep track of state/stop of add multiple users
  const [loading, setLoading] = useState(false)

  // Adds a singular user
  const [addUser, { error: addUserError }] = useLazyCallMavis<FormData>({
    method: 'POST',
    path: '/admin/v1/user/new',
    hideErrorNotification: true,
  })

  // update emailsFailed per each addUserError
  useEffect(() => {
    if (addUserError && currentEmailBeingAdded) {
      setEmailsFailed((prevEmailsFailed) => [...prevEmailsFailed, { [currentEmailBeingAdded]: addUserError?.message }])
    }
  }, [addUserError, currentEmailBeingAdded])

  const addMultipleUsers = useCallback(
    async (emails: string[]) => {
      setLoading(true)
      setEmailsInvited([])
      setEmailsFailed([])

      // add each user sequentially
      for (const email of emails) {
        try {
          setCurrentEmailBeingAdded(email)

          const resp = await addUser({
            body: {
              email,
              role: ICompany_User_Role_Enum.User,
            },
          })

          if (resp) {
            setEmailsInvited((prevEmailsInvited) => [...prevEmailsInvited, email])
          }
        } catch (error: any) {
          // since useLazyCallMavis handles error, we don't need to do anything here
          // (update by listening to addUserError above)
        } finally {
          setCurrentEmailBeingAdded(undefined)
        }
      }

      // done adding all the users
      setLoading(false)
    },
    [addUser]
  )

  return [
    addMultipleUsers,
    {
      currentEmailBeingAdded,
      emailsInvited,
      emailsFailed,
      loading,
    },
  ]
}

export default useAddMultipleUsers

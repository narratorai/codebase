import { Progress } from 'antd-next'
import { Box, Typography } from 'components/shared/jawns'
import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { EmailErrors } from './useAddMultipleUsers'

interface Props {
  currentEmailBeingAdded?: string
  emailsInvited?: string[]
  emailsFailed?: EmailErrors
  loading: boolean
}

const ProgressBar = ({ currentEmailBeingAdded, emailsInvited, emailsFailed, loading }: Props) => {
  const [showProgressBar, setShowProgressBar] = useState(loading)
  const { watch } = useFormContext()

  const emailsToAdd = watch('emails') || []
  const stepsCompleted = (emailsInvited?.length || 0) + (emailsFailed?.length || 0)
  const totalSteps = emailsToAdd.length
  const percentDone = Math.round((stepsCompleted / totalSteps) * 100)

  // toggle whether to show progress bar or not
  useEffect(() => {
    // show progress bar any time it's loading
    if (loading) {
      setShowProgressBar(true)
    }

    // hide progress bar when loading is done
    // with slight delay so user can see complete
    if (!loading && showProgressBar) {
      setTimeout(() => {
        setShowProgressBar(false)
      }, 2000)
    }
  }, [loading, showProgressBar])

  // don't show anything if not loading
  if (!showProgressBar) return null
  return (
    <Box>
      <Progress percent={percentDone} steps={totalSteps} />
      {currentEmailBeingAdded && <Typography>Adding {currentEmailBeingAdded}</Typography>}
    </Box>
  )
}

export default ProgressBar

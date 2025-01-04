import { Button, Progress, Result } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Box, Link, Typography } from 'components/shared/jawns'
import Page from 'components/shared/Page'
import { ICompany_Status_Enum, useCompanySubscription } from 'graph/generated'
import moment from 'moment-timezone'
import { useEffect, useState } from 'react'

// let's set the MAX to a number slightly less
// than 100% so that the progress bar doesn't
// fully fill up. Hopefully, privisioning is
// done by then, but there is the chance that
// the user will get stuck on 98% indefinitely.
// TODO: handle this better!
const MAX_PERCENT = 98
const MIN_PERCENT = 5

// Just an average wait time (in minutes) that
// it takes to provision resources. We may need
// to adjust this if things take longer
const AVG_WAIT_TIME = 6

// The interval at which the progress indicator
// updates with the new value
const INTERVAL = 15 * 1000

const momentNow = moment.utc()

// initial percent is calculated based on the number
// of minutes that have passed since company.created_at.
// It is a percentage diff based off of `AVG_WAIT_TIME`
const getInitialPercent = (companyCreatedAt?: string) => {
  if (!companyCreatedAt) return MIN_PERCENT

  const momentCreatedAt = moment(companyCreatedAt)
  const diffInMinutes = momentNow.diff(momentCreatedAt, 'minutes')
  const diffPercent = (diffInMinutes / AVG_WAIT_TIME) * 100

  // let's make sure we never exceed `MAX_PERCENT` just in
  // case the diff minutes is larger than `AVG_WAIT_TIME`
  const initialPercent = Math.min(MAX_PERCENT, diffPercent)

  // Finally, let's make sure the initial percent is never less than `MIN_PERCENT`
  return initialPercent < MIN_PERCENT ? MIN_PERCENT : initialPercent
}

const Provisioning = () => {
  const company = useCompany()
  const [percent, setPercent] = useState(MIN_PERCENT)

  const { data: companyStatusData } = useCompanySubscription({
    variables: { company_slug: company.slug },
  })

  const companySubscriptionObject = companyStatusData?.company[0]
  const companyCreatedAt = companySubscriptionObject?.created_at
  const companyStatusOnboarding = companySubscriptionObject?.status === ICompany_Status_Enum.Onboarding
  const companyStatusProvisioning = companySubscriptionObject?.status !== ICompany_Status_Enum.Onboarding
  // const companyStatusActive = companySubscriptionObject?.status === 'active'

  const progressStatus = companyStatusProvisioning && percent <= MAX_PERCENT ? 'active' : undefined
  const progressPercent = companyStatusOnboarding ? 100 : percent

  // Set the initial progress % based on company.created_at value
  useEffect(() => {
    const initialPercent = getInitialPercent(companyCreatedAt)
    setPercent(initialPercent)
  }, [companyCreatedAt])

  useEffect(() => {
    const intervalID = setInterval(() => {
      // pick random number between 5-10 to update percentage
      const updatedPercent = Math.max(Math.floor(Math.random() * 10), 5)

      setPercent((p) => {
        // if we've exceeded `MAX_PERCENT`, clear the interval
        // so we don't keep it running forever
        if (p > MAX_PERCENT) {
          clearInterval(intervalID)
        }

        // Make sure the value is never less than `MIN_PERCENT` and also
        // never more than `MAX_PERCENT`
        const minUpdatedPercent = p + updatedPercent < MIN_PERCENT ? MIN_PERCENT : p + updatedPercent
        return Math.min(MAX_PERCENT, minUpdatedPercent)
      })
    }, INTERVAL)
  }, [setPercent])

  // TODO
  // if companyStatusActive
  // redirect out of here!

  return (
    <Page title="Provisioning..." bg="transparent" data-public>
      {(companyStatusProvisioning || companyStatusOnboarding) && (
        <Result
          style={{ paddingBottom: 0 }}
          icon={
            <Box px={3} maxWidth="500px" style={{ margin: 'auto' }}>
              <Progress percent={progressPercent} status={progressStatus} showInfo={false} />
            </Box>
          }
          title={companyStatusProvisioning ? 'Narrator is provisioning your resources' : "You're ready to go!"}
          subTitle={
            companyStatusProvisioning ? (
              <>
                <Typography mb={1}>This can take up to 5 minutes.</Typography>
                <Typography>You’ll receive an email once provisioning is complete.</Typography>
              </>
            ) : (
              'Next step is to connect your data warehouse'
            )
          }
          extra={
            !companyStatusProvisioning && (
              <Link unstyled to="/manage/warehouse">
                <Button type="primary">Connect Warehouse</Button>
              </Link>
            )
          }
        />
      )}
    </Page>
  )
}

export default Provisioning

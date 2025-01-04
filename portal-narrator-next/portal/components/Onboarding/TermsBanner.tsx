import { NotificationPlacement } from 'antd/es/notification'
import { App, Button, Space, Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useTerms, useUser } from 'components/context/user/hooks'
import TermsModal from 'components/Onboarding/TermsModal'
import { Typography } from 'components/shared/jawns'
import { IUpdateUserAcceptTermsMutation, useUpdateUserAcceptTermsMutation } from 'graph/generated'
import { useCallback, useEffect, useState } from 'react'
import { Form } from 'react-final-form'
import { colors } from 'util/constants'

const TermsBanner = () => {
  const { notification } = App.useApp()
  const company = useCompany()
  const isDemoCompany = !!company.demo_company
  const { user } = useUser()
  const terms = useTerms()
  const { markdown: termsMarkdown } = terms

  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(false)

  // On success hide the banner!
  const onUpdateSuccess = (data: IUpdateUserAcceptTermsMutation) => {
    const updatedVersion = data?.update_user?.returning?.[0]?.accepted_terms_version
    if (updatedVersion === terms.id) {
      setShowBanner(true)
    }
  }

  const [updateUser, { loading: updateLoading, error: updateError }] = useUpdateUserAcceptTermsMutation({
    onCompleted: onUpdateSuccess,
  })

  const onSubmit = (form: any) => {
    if (form.ok_terms) {
      updateUser({
        variables: {
          user_id: user.id,
          accepted_terms_version: terms.id,
        },
      })
    }
  }

  const openModal = () => {
    setShowTermsModal(true)
    notification.destroy('updated-terms-banner')
  }

  const openNotification = useCallback(() => {
    // we need to destroy the existing notification before
    // showing this one so that notifications work across
    // page/route changes. Otherwise, antd will not show
    // the notification again when navigating between pages
    notification.destroy()

    notification.info({
      key: 'updated-terms-banner',
      message: 'Updated Terms/Policies',
      placement: 'bottomLeft' as NotificationPlacement,
      style: {
        backgroundColor: colors.blue100,
      },
      description: (
        <>
          <Typography mb={3}>
            Please review and accept the updated{' '}
            <a href="https://www.narrator.ai/terms/" target="_blank" rel="noopener noreferrer">
              Terms of Use
            </a>
            {', '}
            <a
              href="https://www.narratordata.com/legal/data-processing-agreement/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Data Processing Agreement
            </a>
            {', and '}
            <a href="https://www.narrator.ai/privacy-policy/" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>{' '}
            documents.
          </Typography>
          <Space align="center">
            <Button size="small" onClick={openModal} data-test="update-terms-review-confirm-button">
              Review and Confirm
            </Button>
            {updateLoading && <Spin size="small" />}
          </Space>
        </>
      ),
      duration: 0,
      closeIcon: <span />,
    })
  }, [updateLoading, notification])

  useEffect(() => {
    if (updateError?.message) {
      notification.error({
        message: 'Error Accepting Terms',
        description: updateError?.message,
        duration: 0,
      })
    }
  }, [updateError, notification])

  useEffect(() => {
    // User needs to sign our terms again IF the terms doc they signed is out of date
    if (!showBanner && user.accepted_terms_version !== terms.id) {
      setShowBanner(true)
    }
  }, [terms.id, user.accepted_terms_version, showBanner])

  useEffect(() => {
    if (showBanner && !bannerVisible && !isDemoCompany) {
      openNotification()
      setBannerVisible(true)
    }
  }, [openNotification, showBanner, bannerVisible, isDemoCompany])

  if (!termsMarkdown) return null
  return (
    <Form
      onSubmit={onSubmit}
      render={({ handleSubmit }) => (
        <TermsModal
          isOpen={showTermsModal}
          onAccept={() => {
            handleSubmit()
            setShowTermsModal(false)
          }}
        />
      )}
    />
  )
}

export default TermsBanner

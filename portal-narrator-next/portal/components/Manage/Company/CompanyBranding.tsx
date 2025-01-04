import { App, Button, Input, Popconfirm, Popover } from 'antd-next'
import { Divider } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { useUpdateCompanyBrandingMutation } from 'graph/generated'
import { isEmpty, map } from 'lodash'
import React, { useCallback } from 'react'
import { ChromePicker } from 'react-color'
import { Field, Form } from 'react-final-form'
import AnswerIcon from 'static/svg/Analyses/Answer.svg'
import MavisLogo from 'static/svg/Analyses/MavisLogo.svg'
import styled from 'styled-components'
import { colors } from 'util/constants'

const StyledColorPicker = styled(Flex)`
  .chrome-picker {
    box-shadow: none !important;
    width: 100% !important;
  }
`

const StyledPlotBox = styled(Box)`
  height: 24px;
  width: 24px;
  border: 1px solid black;

  &:hover {
    cursor: pointer;
  }
`

const DEFAULT_PLOT_COLORS = [
  '#35a1ff',
  '#dc3912',
  '#ff9900',
  '#aa0dfe',
  '#3283fe',
  '#85660d',
  '#782ab6',
  '#565656',
  '#1c8356',
  '#16ff32',
  '#1cbe4f',
  '#c4451c',
  '#dea0fd',
  '#fe00fa',
  '#325a9b',
  '#feaf16',
  '#f8a195',
  '#90ad1c',
  '#f6222e',
  '#1cffce',
  '#2ed9ff',
  '#b10da1',
  '#c075a6',
  '#fc1cbf',
  '#b00068',
  '#fbe426',
]

const DEFAULT_BRANDING_COLOR = colors.blue800

const BrandingSectionHeader = ({ header, description }: { header: string; description?: string }) => {
  return (
    <Box mb={3}>
      <Typography type="title300">{header}</Typography>

      {description && (
        <Typography mt={1} color="gray500" style={{ whiteSpace: 'pre-line' }}>
          {description}
        </Typography>
      )}
    </Box>
  )
}

const CompanyBranding = () => {
  const { notification } = App.useApp()
  const company = useCompany()
  const { isCompanyAdmin } = useUser()

  const handleSuccess = () => {
    notification.success({
      key: 'update-branding-success',
      message: 'Branding Updated',
      description: 'Narratives will be updated to reflect your changes.',
    })
  }

  const handleError = (error: any) => {
    notification.error({
      key: 'update-branding-error',
      message: 'There was an error updating your branding.',
      description: error.message,
    })
  }

  const [updateCompanyBranding, { loading: updatingBranding }] = useUpdateCompanyBrandingMutation({
    onCompleted: handleSuccess,
    onError: handleError,
  })

  const submitBrandingChanges = useCallback(
    (form: any) => {
      if (isCompanyAdmin) {
        const logoUrl = form?.logo_url ? form?.logo_url : null
        // don't persist default color
        const brandingColor = form?.branding_color === DEFAULT_BRANDING_COLOR ? null : form?.branding_color
        // plot colors are treated as an array in form, but saved as a string
        const plotColors = form?.plot_colors ? form?.plot_colors.join(',') : DEFAULT_PLOT_COLORS.join(',')

        updateCompanyBranding({
          variables: {
            company_id: company.id,
            logo_url: logoUrl,
            branding_color: brandingColor,
            plot_colors: plotColors,
          },
        })
      } else {
        // This should never happen as non-company admins can't get to this page
        // But incase code changes upstream we have this extra check
        notification.error({
          key: 'not-authorized-to-update-branding',
          message: 'You do not have permission to update.',
          description: "Contact your company's admin to update.",
        })
      }
    },
    [isCompanyAdmin, company, updateCompanyBranding, notification]
  )

  const initialValues = {
    logo_url: company?.logo_url,
    branding_color: company?.branding_color || DEFAULT_BRANDING_COLOR,
    // plot_colors is an array in form - but converted to string in submit
    plot_colors: company?.plot_colors ? company?.plot_colors.split(',') : DEFAULT_PLOT_COLORS,
  }

  return (
    <Form
      onSubmit={submitBrandingChanges}
      initialValues={initialValues}
      render={({ handleSubmit, values }) => (
        <Box pb={5}>
          <Typography type="title100" fontWeight="bold" mb={1}>
            Branding
          </Typography>
          <Typography>Branding allows you to personalize your narratives with your own stlyes and logos.</Typography>
          <Typography>Add a logo or color below and your narratives will be updated to use your selections.</Typography>

          {/* Logo Picker */}
          <Box mt={7} mb={3}>
            <BrandingSectionHeader
              header="Company Logo"
              description={
                'Add an image url to change the logo shown in Narratives.\nSquare images are preferred for proportionality.'
              }
            />

            <Flex justifyContent="space-between">
              <Flex alignItems="center" style={{ width: '45%' }} mb={1}>
                <Field name="logo_url" render={({ input }) => <Input {...input} placeholder="Company Logo Url" />} />
              </Flex>
              <Box style={{ width: '45%' }}>
                <Flex flexWrap="wrap">
                  <Box mr={2}>
                    <Typography>Small size</Typography>
                    {isEmpty(values.logo_url) ? (
                      <AnswerIcon width={40} height={36} />
                    ) : (
                      <img
                        src={values.logo_url}
                        alt={`${company.slug} logo preview`}
                        style={{ maxWidth: '40px', maxHeight: '40px' }}
                      />
                    )}
                  </Box>
                  <Box>
                    <Typography>Medium size</Typography>
                    {isEmpty(values.logo_url) ? (
                      <MavisLogo width={120} height={120} />
                    ) : (
                      <img
                        src={values.logo_url}
                        alt={`${company.slug} logo preview`}
                        style={{ maxWidth: '120px', maxHeight: '120px' }}
                      />
                    )}
                  </Box>
                </Flex>
              </Box>
            </Flex>
          </Box>

          <Divider />

          {/* Branding Color Picker */}
          <Box my={3}>
            <BrandingSectionHeader
              header="Background Color"
              description="This will be the background color of Narrative headers."
            />
            <Field
              name="branding_color"
              render={({ input: { onChange, value } }) => (
                <StyledColorPicker justifyContent="space-between">
                  <Box style={{ width: '45%' }}>
                    <ChromePicker onChangeComplete={(value) => onChange(value.hex)} color={value} disableAlpha />
                  </Box>

                  <Box style={{ width: '45%' }}>
                    <Button onClick={() => onChange(DEFAULT_BRANDING_COLOR)} size="small">
                      Revert to Default
                    </Button>
                  </Box>
                </StyledColorPicker>
              )}
            />
          </Box>

          <Divider />

          {/* Plot Colors Pickers */}
          <Box my={3}>
            <BrandingSectionHeader
              header="Plot Colors"
              description="Control the default color palette used for plotting."
            />
            <Flex flexWrap="wrap" pr="80px">
              <Field
                name="plot_colors"
                render={({ input: { onChange, value: colors } }) =>
                  map(colors, (color: string, index: number) => (
                    <Popover
                      key={color}
                      content={
                        <Box p={1}>
                          <ChromePicker
                            onChangeComplete={(value) => {
                              const updatedColors = [...colors]
                              updatedColors[index] = value.hex
                              onChange(updatedColors)
                            }}
                            color={color}
                            disableAlpha
                          />
                        </Box>
                      }
                      placement="top"
                    >
                      <StyledPlotBox mr={1} mb={1} style={{ backgroundColor: color }} />
                    </Popover>
                  ))
                }
              />
            </Flex>
          </Box>

          {/* Update Company Branding Button */}
          <Flex py={4}>
            <Popconfirm
              title={
                <Box>
                  <Typography mb={1} type="title400">
                    Are you sure you want to update your branding?
                  </Typography>
                  <Typography>All narratives will be updated with these changes.</Typography>
                </Box>
              }
              onConfirm={handleSubmit}
              okText="Yes"
              cancelText="No"
            >
              <Button type="primary" loading={updatingBranding} disabled={!isCompanyAdmin}>
                Update Company Branding
              </Button>
            </Popconfirm>
          </Flex>
        </Box>
      )}
    />
  )
}

export default CompanyBranding

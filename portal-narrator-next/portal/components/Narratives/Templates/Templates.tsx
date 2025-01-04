import { useMachine } from '@xstate/react'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { Box, Typography } from 'components/shared/jawns'
import { FixedSider, LayoutContent } from 'components/shared/layout/LayoutWithFixedSider'
import Page from 'components/shared/Page'
import { machineServices, narrativeFromTemplateMachine } from 'machines/narrativeTemplates'
import styled from 'styled-components'
import { colors, semiBoldWeight } from 'util/constants'

import { isProduction } from '@/util/env'

import TemplateContext from './TemplateContext'
import TemplateForm from './TemplateForm'
import TemplateMetaDisplay from './TemplateMetaDisplay'
import TemplatePreview from './TemplatePreview'
import TemplateSearch from './TemplateSearch'

const StyledPreviewHeader = styled(Box)`
  position: absolute;
  bottom: -48px;
  left: 0;
  right: 0;
  overflow: hidden;
  text-align: center;
  padding: 8px 0;
  background-color: white;

  & > span {
    position: relative;
    z-index: 1;
    display: inline-block;
    background-color: white;
    padding: 4px 20px;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 50% 0 -4px;
    border: 2px solid ${colors.gray200};
    display: block;
  }
`

const Templates = () => {
  const company = useCompany()
  const { getTokenSilently } = useAuth0()

  const [machineCurrent, machineSend] = useMachine<typeof narrativeFromTemplateMachine>(
    narrativeFromTemplateMachine.withConfig({
      services: machineServices({
        company,
        getToken: getTokenSilently,
      }),
    }),
    { devTools: !isProduction }
  )

  const selectedTemplate = machineCurrent.context.graph_narrative_template

  const inSearchMode = machineCurrent.matches({ main: 'search' })
  const inPreviewMode = inSearchMode && !!selectedTemplate
  const inCustomizeMode = !inSearchMode

  return (
    <Page title="Build Narrative from Template | Narrator" hideChat>
      <TemplateContext.Provider
        value={{
          // current and send are from state machine
          machineCurrent,
          machineSend,
        }}
      >
        <FixedSider>
          <Box p={3}>
            <Box>
              <Typography mb={2} as="div" type="title300">
                Narrative Templates
              </Typography>
              <Typography mb={2}>
                <strong>Narratives</strong> are actionable data analyses in a story-like format.
              </Typography>
              <Typography mb={3}>
                <strong>Narrative Templates</strong> are ...
              </Typography>
            </Box>
          </Box>
        </FixedSider>
        <LayoutContent style={{ paddingTop: 0 }}>
          <Box maxWidth="1200px" mx="auto">
            {inSearchMode && (
              <>
                <Box
                  pt={3}
                  bg="white"
                  style={{
                    position: 'sticky',
                    zIndex: 1,
                    top: 0,
                  }}
                >
                  <Box p={6} bg="gray100">
                    <TemplateSearch />

                    {selectedTemplate && (
                      <TemplateMetaDisplay selectedTemplate={selectedTemplate} preview={inPreviewMode} />
                    )}

                    {inPreviewMode && (
                      <StyledPreviewHeader>
                        <Typography as="span" type="title300" color="gray500" fontWeight={semiBoldWeight}>
                          Narrator Demo Preview - Customize to get started
                        </Typography>
                      </StyledPreviewHeader>
                    )}
                  </Box>
                </Box>
                {inPreviewMode && (
                  <Box mt={5}>
                    <TemplatePreview />
                  </Box>
                )}
              </>
            )}

            {inCustomizeMode && (
              <Box pt={5} maxWidth="1200px" mx="auto">
                <Box p={6} mb={4} bg="blue100">
                  <TemplateMetaDisplay selectedTemplate={selectedTemplate} />
                </Box>

                <TemplateForm />
              </Box>
            )}
          </Box>
        </LayoutContent>
      </TemplateContext.Provider>
    </Page>
  )
}

export default Templates

import SectionTakeaway from 'components/Narratives/shared/SectionTakeaway'
import { Box, Flex } from 'components/shared/jawns'
import { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useEffectOnce } from 'react-use'
import styled from 'styled-components'
import { CONTENT_MAXWIDTH, COPY_MAXWIDTH } from 'util/analyses/constants'
import { breakpoints } from 'util/constants'

import AnalysisContext from './AnalysisContext'
import AnalysisSectionContent from './AnalysisSectionContent'
import AnalysisSectionHeader from './AnalysisSectionHeader'

const SectionContainer = styled(Flex)`
  @media only screen and (max-width: ${breakpoints.md}) {
    margin-top: 0;
  }
`

interface Props {
  index: number
  takeaway: any
  title: string
  content: any[]
}

const AnalysisContent = ({ index, takeaway, title, content }: Props) => {
  const { hash } = useLocation()
  const { selectedSectionIndex, setForceRenderPlots, noQuestionsGoalsRecsTakeaways } = useContext(AnalysisContext)
  const [sectionUrl, setSectionUrl] = useState('')

  // hide the first sections border and reduce spacing if noQuestionsGoalsRecsTakeaways
  const hideTopContent = index === 0 && noQuestionsGoalsRecsTakeaways

  const scrollElementIntoView = (selector: string, options?: ScrollIntoViewOptions) => {
    const element = document.querySelector<HTMLDivElement>(selector)
    if (element) {
      window.requestAnimationFrame(() => element.scrollIntoView(options))
    }
  }

  useEffectOnce(() => {
    setForceRenderPlots(true)
  })

  // set section URL to be used by the copy to clipboard util below
  useEffect(() => {
    const url = new URL(window.location.href)
    url.hash = `#step-${index + 1}`
    setSectionUrl(url.toString())
  }, [index])

  // useEffect + setTimeout combo so we can trigger a window.scroll()
  // to the correct position if there is a #hash in the URL and it matches a section ID
  useEffect(() => {
    const stepNumber = hash ? Number(hash.match(/#step-([\d]+)/)?.[1]) : undefined

    if (hash && stepNumber) {
      setTimeout(() => {
        scrollElementIntoView(hash)
      }, 0)
    }
  }, [hash])

  // If user clicks on any of the summary links, scroll to that section denoted by `selectedSectionIndex`
  useEffect(() => {
    if (selectedSectionIndex === index) {
      setTimeout(() => {
        scrollElementIntoView(`#step-${index + 1}`, { behavior: 'smooth' })
      }, 0)
    }
  }, [index, selectedSectionIndex])

  return (
    <SectionContainer
      id={`step-${index + 1}`}
      pb={2}
      pt={hideTopContent ? 0 : 2}
      px={[2, 2, noQuestionsGoalsRecsTakeaways ? 0 : 7]}
      mt={hideTopContent ? 0 : 5}
      bg="white"
      justifyContent="center"
    >
      <Box flexGrow={1} width={'100%'} maxWidth={['initial', 'initial', CONTENT_MAXWIDTH]}>
        <AnalysisSectionHeader
          index={index}
          title={title}
          sectionUrl={sectionUrl}
          noQuestionsGoalsRecsTakeaways={noQuestionsGoalsRecsTakeaways}
        />
        <AnalysisSectionContent content={content} />

        {takeaway && (
          <Box mx="auto" maxWidth={COPY_MAXWIDTH}>
            <SectionTakeaway takeaway={takeaway} />
          </Box>
        )}
      </Box>
    </SectionContainer>
  )
}

export default AnalysisContent

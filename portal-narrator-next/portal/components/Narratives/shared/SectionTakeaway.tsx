import { useCompany } from 'components/context/company/hooks'
import AnalysisContext from 'components/Narratives/Narrative/AnalysisContext'
import { Box, Flex, Typography } from 'components/shared/jawns'
import LargeScreenOnly from 'components/shared/LargeScreenOnly'
import { isEmpty } from 'lodash'
import { useContext } from 'react'
import AnswerIcon from 'static/svg/Analyses/Answer.svg'
import { semiBoldWeight } from 'util/constants'

interface Props {
  takeaway: { title?: string }
}

const SectionTakeaway = ({ takeaway }: Props) => {
  const company = useCompany()
  const { noQuestionsGoalsRecsTakeaways } = useContext(AnalysisContext)

  return (
    <Flex
      pt={3}
      ml={['0px', '0px', noQuestionsGoalsRecsTakeaways ? '0px' : '-48px']}
      alignItems="flex-start"
      data-test="section-conclusion-takweaway"
    >
      <LargeScreenOnly mr={1} mt={'5px'}>
        {isEmpty(company?.logo_url) ? (
          <AnswerIcon width={40} height={36} />
        ) : (
          <img
            src={company.logo_url || undefined}
            alt={`${company.name} Logo`}
            style={{ maxWidth: '40px', maxHeight: '40px' }}
          />
        )}
      </LargeScreenOnly>
      <Box>
        <Typography type="body50" color="gray500" fontWeight={semiBoldWeight}>
          Conclusion
        </Typography>
        <Typography type="title300" fontWeight={semiBoldWeight} data-test="narrative-section-takeaway-preview">
          {takeaway?.title}
        </Typography>
      </Box>
    </Flex>
  )
}

export default SectionTakeaway

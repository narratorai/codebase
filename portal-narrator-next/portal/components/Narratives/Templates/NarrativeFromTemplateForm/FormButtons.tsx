import { Button } from 'antd-next'
import TemplateContext from 'components/Narratives/Templates/TemplateContext'
import { Box, Flex } from 'components/shared/jawns'
import React, { useContext } from 'react'

interface Props {
  onNext(): void
}

const FormButtons = ({ onNext }: Props) => {
  const { machineCurrent, machineSend } = useContext(TemplateContext)

  const onPrevious = () => {
    machineSend('PREVIOUS_STEP')
  }

  const shouldDisableBack = machineCurrent.matches({ main: 'activity_mapping' })
  const finalNextButton = machineCurrent.matches({ main: 'word_mappings' })

  return (
    <Flex justifyContent="center">
      <Box mr={2}>
        <Button size="large" onClick={onPrevious} disabled={shouldDisableBack}>
          Back
        </Button>
      </Box>
      <Button size="large" onClick={onNext} type={finalNextButton ? 'primary' : 'default'}>
        {finalNextButton ? 'Submit' : 'Next'}
      </Button>
    </Flex>
  )
}

export default FormButtons

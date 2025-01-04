import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Modal, Result } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { find, isEqual, map, startCase, template } from 'lodash'
import { useContext, useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { colors } from 'util/constants'
import { activityNameFromActivityIds, OCCURRENCE_CUSTOM, RELATIONSHIP_OPTIONS } from 'util/datasets'
import { OccurrenceOptions } from 'util/datasets/interfaces'
import { ordinalSuffixOf } from 'util/helpers'
import useKeyPress from 'util/useKeyPress'
import usePrevious from 'util/usePrevious'

import MiniDefinition from './MiniDefinition'
import RelationshipAnimationTable from './RelationshipAnimationTable'
import relationshipConstants from './relationshipConstants'
import RelationshipCustomerJourney from './RelationshipCustomerJourney'

// Global Steps:
// 1 - Start <Result>
const WIZARD_PRE_START = 'WIZARD_PRE_START'

// 2 - Show full width table that we're going to build
const WIZARD_PRE_TABLE_EXAMPLE = 'WIZARD_PRE_TABLE_EXAMPLE'

// 3 - Show abstracted version of the table we're going to build
const WIZARD_PRE_TABLE_EXAMPLE_COLSPAN = 'WIZARD_PRE_TABLE_EXAMPLE_COLSPAN'

// 4 - custom per relationship wizard steps (RELATIONSHIP_ANIMATION_STEPS)
const IN_WIZARD = 'IN_WIZARD'

// final step - Show end <Result>
const WIZARD_END = 'WIZARD_END'

interface Props {
  appendActivityFieldName: string
  onClose(): void
  visible: boolean
}

const RelationshipAnimationModal = ({ appendActivityFieldName, onClose, visible }: Props) => {
  const { streamActivities } = useContext(DatasetFormContext)
  const [globalStep, setGlobalStep] = useState(WIZARD_PRE_START)
  const [step, setStep] = useState(0)

  const { watch } = useFormContext()
  const cohortActivityConfig = watch('cohort')
  const appendActivityConfig = watch(appendActivityFieldName)

  // Called by final <Result> if the user wants to restart the wizard over
  const handleRestart = () => {
    setStep(0)
    setGlobalStep(WIZARD_PRE_TABLE_EXAMPLE)
  }

  // Reset the entire wizard if the user closes it:
  const handleClose = () => {
    onClose()
    // Modals fade out when closed, so this prevents the user seeing it being reset:
    setTimeout(() => {
      setStep(0)
      setGlobalStep(WIZARD_PRE_START)
    }, 200)
  }

  const occurrenceSlug = cohortActivityConfig.occurrence_filter?.occurrence as OccurrenceOptions
  const sameActivity = isEqual(cohortActivityConfig.activity_ids, appendActivityConfig.activity_ids)
  const configKey = sameActivity ? 'same' : 'default'

  // Get the proper relationship specific constants:
  // - Find it by relationship_slug.occurrence_slug
  // - for example "first_in_between"."all"
  const {
    PRIMARY_CUSTOMER,
    RELATIONSHIP_CONTEXT,
    RELATIONSHIP_ANIMATION_STEPS,
    RELATIONSHIP_TABLE_ROWS,
    CUSTOMER_JOURNEY_COHORT_LABELS,
  } = relationshipConstants?.[appendActivityConfig.relationship_slug]?.[occurrenceSlug]?.[configKey] || {}

  const next = () => {
    if (globalStep === WIZARD_PRE_START) {
      return setGlobalStep(WIZARD_PRE_TABLE_EXAMPLE)
    }

    if (globalStep === WIZARD_PRE_TABLE_EXAMPLE) {
      return setGlobalStep(WIZARD_PRE_TABLE_EXAMPLE_COLSPAN)
    }

    if (globalStep === WIZARD_PRE_TABLE_EXAMPLE_COLSPAN) {
      return setGlobalStep(IN_WIZARD)
    }

    // You're on the last step of the wizard, show the end state:
    if (RELATIONSHIP_ANIMATION_STEPS?.length - 1 === step) {
      return setGlobalStep(WIZARD_END)
    }

    if (globalStep === IN_WIZARD) {
      return setStep(step + 1)
    }
  }

  const previous = () => {
    if (globalStep === WIZARD_PRE_TABLE_EXAMPLE) {
      return setGlobalStep(WIZARD_PRE_START)
    }

    if (globalStep === WIZARD_PRE_TABLE_EXAMPLE_COLSPAN) {
      return setGlobalStep(WIZARD_PRE_TABLE_EXAMPLE)
    }

    if (step === 0) {
      return setGlobalStep(WIZARD_PRE_TABLE_EXAMPLE_COLSPAN)
    }
    setStep(step - 1)
  }

  const leftArrowPressed = useKeyPress('ArrowLeft')
  const prevLeftArrowPressed = usePrevious(leftArrowPressed)
  const rightArrowPressed = useKeyPress('ArrowRight')
  const prevRightArrowPressed = usePrevious(rightArrowPressed)

  // move through the animation flow via left and right arrow keypress events
  useEffect(() => {
    if (!prevLeftArrowPressed && leftArrowPressed && globalStep !== WIZARD_PRE_START) {
      previous()
    }

    if (!prevRightArrowPressed && rightArrowPressed && globalStep !== WIZARD_END) {
      next()
    }
  }, [globalStep, prevLeftArrowPressed, leftArrowPressed, prevRightArrowPressed, rightArrowPressed, previous, next])

  // TODO - remove this once we have all the relationshipConstants are set up!
  if (!relationshipConstants[appendActivityConfig.relationship_slug]) {
    return (
      <Modal onCancel={handleClose} footer={null} open={visible}>
        Cannot find wizard constants
      </Modal>
    )
  }

  const occurrenceLabel =
    occurrenceSlug === OCCURRENCE_CUSTOM && cohortActivityConfig.occurrence_filter?.occurrence_value
      ? ordinalSuffixOf(cohortActivityConfig.occurrence_filter?.occurrence_value)
      : occurrenceSlug
        ? startCase(occurrenceSlug)
        : null

  const cohortActivityName = activityNameFromActivityIds(streamActivities, cohortActivityConfig.activity_ids || [])
  const appendActivityName = activityNameFromActivityIds(streamActivities, appendActivityConfig.activity_ids || [])
  const relationship = find(RELATIONSHIP_OPTIONS, ['value', appendActivityConfig.relationship_slug])

  const stepConfig = RELATIONSHIP_ANIMATION_STEPS[step]

  const customer = stepConfig.customerName || PRIMARY_CUSTOMER
  const activeCustomer = stepConfig.customerJourney.show ? customer : 'N/A'

  const compiledStepTitle = template(stepConfig.title)
  const stepTitle = compiledStepTitle({ cohortActivityName, appendActivityName, customer: customer })

  const showWizardStartingResult = globalStep === WIZARD_PRE_START
  const showWizardEndingResult = globalStep === WIZARD_END
  const showWizardSteps = !showWizardStartingResult && !showWizardEndingResult
  const showFullTable = globalStep === WIZARD_PRE_TABLE_EXAMPLE || globalStep === WIZARD_PRE_TABLE_EXAMPLE_COLSPAN

  const compiledDescription = template(RELATIONSHIP_CONTEXT.description)
  const description = compiledDescription({ cohortActivityName, appendActivityName })

  return (
    <Modal
      footer={null}
      onCancel={handleClose}
      title={<Typography type="title400">Temporal Join - {relationship?.label}</Typography>}
      open={visible}
      // Matches ComputedOverlay:
      width="85%"
      style={{ top: 50, maxWidth: 1240 }}
    >
      {/* Start State -  Tells the user a wizard is about to start! */}
      {showWizardStartingResult && (
        <Result
          title={
            <Flex justifyContent="center" mb="40px">
              <div>
                Learn how the <b>"{relationship?.label}"</b> join <br />
                adds data to your dataset.
              </div>
            </Flex>
          }
          icon={
            <Box mb="40px">
              <MiniDefinition
                appendActivityName={appendActivityName}
                cohortActivityName={cohortActivityName}
                occurrenceLabel={occurrenceLabel || ''}
                relationshipLabel={relationship?.label || ''}
              />
            </Box>
          }
          extra={
            <Button type="primary" key="console" onClick={next}>
              Begin
            </Button>
          }
        />
      )}

      {/* End State - Congrats, you completed the wizard! */}
      {showWizardEndingResult && (
        <Result
          title={
            <Flex justifyContent="center" mb="40px">
              <div>
                That’s it! You’ve assembled your table using the <b>"{relationship?.label}"</b> join.
              </div>
            </Flex>
          }
          icon={
            <Box mb="40px">
              <MiniDefinition
                appendActivityName={appendActivityName}
                cohortActivityName={cohortActivityName}
                occurrenceLabel={occurrenceLabel || ''}
                relationshipLabel={relationship?.label || ''}
              />
            </Box>
          }
          extra={
            <>
              <Button key="Restart" onClick={handleRestart}>
                Restart
              </Button>
              <Button type="primary" key="close" onClick={handleClose}>
                Close
              </Button>
            </>
          }
        />
      )}

      {/* The wizard itself! */}
      {showWizardSteps && (
        <>
          <MiniDefinition
            appendActivityName={appendActivityName}
            cohortActivityName={cohortActivityName}
            occurrenceLabel={occurrenceLabel || ''}
            relationshipLabel={relationship?.label || ''}
          />
          <Box mb={3} p={2} style={{ border: `1px solid ${colors.gray500}`, borderRadius: 2 }}>
            <Flex justifyContent="space-between" mb={3}>
              <Box style={{ maxWidth: 640 }}>
                <Typography type="title400" fontWeight="bold">
                  {showFullTable
                    ? "We're going to figure out how to assemble this table"
                    : `Step ${step + 1} - ${stepTitle}`}
                </Typography>
              </Box>
              <Flex>
                <Box pr={1}>
                  <Button onClick={previous} shape="circle" icon={<LeftOutlined />} />
                </Box>
                <Button onClick={next} shape="circle" icon={<RightOutlined />} />
              </Flex>
            </Flex>

            <Flex>
              {/* Pre Steps - WIZARD_PRE_TABLE_EXAMPLE and WIZARD_PRE_TABLE_EXAMPLE_COLSPAN */}
              {showFullTable && (
                <RelationshipAnimationTable
                  appendActivityConfig={appendActivityConfig}
                  appendActivityName={appendActivityName}
                  cohortActivityConfig={cohortActivityConfig}
                  cohortActivityName={cohortActivityName}
                  customer={customer}
                  tableConfig={stepConfig.table}
                  tableRows={RELATIONSHIP_TABLE_ROWS}
                  fullTableType={globalStep === WIZARD_PRE_TABLE_EXAMPLE ? 'columns' : 'colspan'}
                />
              )}

              {/* Relationship Steps - Table plus customer journey */}
              {!showFullTable && (
                <>
                  <Box width={1 / 2} pr={2}>
                    <Box mb={1}>
                      <Typography style={{ textTransform: 'uppercase', textAlign: 'center' }} fontWeight="bold">
                        Dataset
                      </Typography>
                    </Box>
                    {stepConfig.table.show && (
                      <RelationshipAnimationTable
                        appendActivityConfig={appendActivityConfig}
                        appendActivityName={appendActivityName}
                        cohortActivityConfig={cohortActivityConfig}
                        cohortActivityName={cohortActivityName}
                        customer={customer}
                        tableConfig={stepConfig.table}
                        tableRows={RELATIONSHIP_TABLE_ROWS}
                      />
                    )}
                  </Box>
                  <Box width={1 / 2} pl={2}>
                    <Box mb={3}>
                      <Typography style={{ textTransform: 'uppercase', textAlign: 'center' }} fontWeight="bold">
                        Customer Journey - {activeCustomer}
                      </Typography>
                    </Box>
                    {stepConfig.customerJourney.show && (
                      <RelationshipCustomerJourney
                        activeCustomer={activeCustomer}
                        appendActivityName={appendActivityName}
                        cohortActivityName={cohortActivityName}
                        customerJourneyConfig={stepConfig.customerJourney}
                        customerJourneyLabelConfig={CUSTOMER_JOURNEY_COHORT_LABELS}
                      />
                    )}
                  </Box>
                </>
              )}
            </Flex>
          </Box>
        </>
      )}

      <Flex>
        <Box width={1 / 2} pr={4}>
          <Typography style={{ textTransform: 'uppercase' }} mb={1} fontWeight="bold">
            What is {relationship?.label}?
          </Typography>

          <Typography mb={1}>{description}</Typography>

          <Typography>
            Learn more in our{' '}
            <a target="_blank" rel="noopener noreferrer" href={RELATIONSHIP_CONTEXT.link}>
              docs
            </a>
            .
          </Typography>
        </Box>
        <Box width={1 / 2} pl={4}>
          <Typography style={{ textTransform: 'uppercase' }} mb={1} fontWeight="bold">
            Common Uses
          </Typography>

          <ul style={{ paddingInlineStart: '2rem', marginBlockEnd: '1em' }}>
            {map(RELATIONSHIP_CONTEXT.common_uses, (useCase) => (
              <li key={useCase.key}>{useCase.text}</li>
            ))}
          </ul>
        </Box>
      </Flex>
    </Modal>
  )
}

export default RelationshipAnimationModal

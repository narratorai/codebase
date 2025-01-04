import { Alert } from 'antd-next'
import { useBuildNarrativeContext } from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import AddMenu from 'components/Narratives/BuildNarrative/Sections/AddMenu'
import ContentBox from 'components/Narratives/BuildNarrative/Sections/ContentBox'
import ContentOptions from 'components/Narratives/BuildNarrative/Sections/ContentOptions'
import * as SharedLayout from 'components/Narratives/BuildNarrative/Sections/SharedLayout'
import { useCompileContent } from 'components/Narratives/hooks'
import { Condition } from 'components/shared/forms'
import { Box, Flex, ListItemCard, Typography } from 'components/shared/jawns'
import { head, includes, noop, toString } from 'lodash'
import React, { lazy, Suspense, useCallback, useState } from 'react'
import { Field, useField } from 'react-final-form'
import styled, { css } from 'styled-components'
import { GenericBlockOption } from 'util/blocks/interfaces'
import { ALL_BASIC_CONTENT_TYPES, assembledSectionContentIsVisible, CONTENT_TYPE_MARKDOWN } from 'util/narratives'

import { getLogger } from '@/util/logger'

import BasicContent from './BasicContent/BasicContent'
import BlockTypeContent from './BlockTypeContent'
import MarkdownContent from './MarkdownContent'

const logger = getLogger()

const MarkdownField = lazy(
  () => import(/* webpackChunkName: "markdown-field" */ 'components/shared/jawns/forms/MarkdownField')
)

const ContentWrapper = styled(ListItemCard)<{ shouldshow?: boolean }>`
  &:hover {
    .icon-actions {
      opacity: 1;
    }
  }

  ${({ shouldshow }) =>
    shouldshow &&
    css`
      /* stylelint-disable-next-line no-descending-specificity */
      .icon-actions {
        opacity: 1;
      }
    `}
`

interface Props {
  fields: any
  index: number
  isLast?: boolean
  fieldName: any
  sectionFieldName: any
  genericBlockOptions?: GenericBlockOption[] | null
  sectionHiddenInAssembled?: boolean
}

const ContentItem = ({
  fields,
  index,
  isLast = false,
  fieldName,
  sectionFieldName,
  genericBlockOptions,
  sectionHiddenInAssembled = false,
}: Props) => {
  const { autocomplete, contentSelectOptions } = useBuildNarrativeContext()
  const blockTypeSlugs = (genericBlockOptions || []).map((opt) => opt.slug)

  const {
    input: { value: conditionedOnValue },
  } = useField(`${fieldName}.conditioned_on`, { subscription: { value: true } })

  const {
    input: { value: type },
  } = useField(`${fieldName}.type`, { subscription: { value: true } })

  const [showCondition, setShowCondition] = useState(!!conditionedOnValue)
  const handleToggleShowCondition = () => {
    setShowCondition((prevCondition) => !prevCondition)
  }

  const insertContent = useCallback(
    (value: unknown) => {
      logger.debug({ index: index + 1 }, `Inserting`)
      fields.insert(index + 1, value)
    },
    [fields, index]
  )

  const { response: compiledConditionResponse } = useCompileContent({
    contents: [
      {
        condition: conditionedOnValue,
      },
    ],
  })
  const compiledCondition = head(compiledConditionResponse)?.condition

  const contentVisibleInAssembled = assembledSectionContentIsVisible({
    input: conditionedOnValue,
    compiled: compiledCondition,
  })

  // If the section is already blurred, don't double blur the content
  const shouldBlur = !contentVisibleInAssembled && !sectionHiddenInAssembled
  const contentHidden = !contentVisibleInAssembled || sectionHiddenInAssembled

  return (
    <ContentWrapper
      p={0}
      mb={0}
      bg="transparent"
      onClose={noop}
      removable={false}
      shouldshow={showCondition || contentHidden}
    >
      {(showCondition || contentHidden) && (
        <Field
          name={`${fieldName}.conditioned_on`}
          render={({ input, meta }) => {
            return (
              <Flex>
                <SharedLayout.EditorBox pt={2}>
                  <Alert
                    message={
                      <>
                        <Typography mb={1}>
                          If the condition evaluates to false, this content will not be shown in the assembled
                          narrative.
                        </Typography>
                        <Typography mb={1}>
                          Compiled field below is: <strong>{toString(compiledCondition).toUpperCase()}</strong>
                        </Typography>
                        <Box data-test="content-visible-condition">
                          <Suspense fallback={null}>
                            <MarkdownField
                              {...input}
                              meta={meta}
                              options={{
                                autocomplete,
                              }}
                            />
                          </Suspense>
                        </Box>
                      </>
                    }
                  />
                </SharedLayout.EditorBox>
                <SharedLayout.PreviewBox p={0}>
                  <ContentBox>
                    <Alert
                      message={
                        <Typography data-test="content-visible-text">
                          This content will {contentHidden && <strong>NOT</strong>} be shown.
                        </Typography>
                      }
                    />
                  </ContentBox>
                </SharedLayout.PreviewBox>
              </Flex>
            )
          }}
        />
      )}

      <Box data-private>
        <Condition when={`${fieldName}.type`} isIn={[CONTENT_TYPE_MARKDOWN]}>
          <div data-test="mardown-content">
            <SharedLayout.EditorBox>
              <ContentOptions
                showCondition={showCondition}
                contentHidden={contentHidden}
                contentVisibleInAssembled={contentVisibleInAssembled}
                index={index}
                isLast={isLast}
                handleToggleShowCondition={handleToggleShowCondition}
                sectionFieldName={sectionFieldName}
              />
            </SharedLayout.EditorBox>
            <MarkdownContent fieldName={fieldName} shouldBlur={shouldBlur} />
          </div>
        </Condition>

        <Condition when={`${fieldName}.type`} isIn={blockTypeSlugs}>
          <SharedLayout.EditorBox>
            <ContentOptions
              showCondition={showCondition}
              contentHidden={contentHidden}
              contentVisibleInAssembled={contentVisibleInAssembled}
              index={index}
              isLast={isLast}
              handleToggleShowCondition={handleToggleShowCondition}
              sectionFieldName={sectionFieldName}
            />
          </SharedLayout.EditorBox>

          <BlockTypeContent fieldName={fieldName} genericBlockOptions={genericBlockOptions} shouldBlur={shouldBlur} />
        </Condition>

        {/* Basic content types */}
        {includes(ALL_BASIC_CONTENT_TYPES, type) && (
          <BasicContent
            type={type}
            fieldName={fieldName}
            showCondition={showCondition}
            contentHidden={contentHidden}
            contentVisibleInAssembled={contentVisibleInAssembled}
            index={index}
            isLast={isLast}
            handleToggleShowCondition={handleToggleShowCondition}
            sectionFieldName={sectionFieldName}
          />
        )}

        {/* Backfill for old narative fieldName structure */}
        <Condition when={`${fieldName}.block`} isIn={blockTypeSlugs}>
          <SharedLayout.EditorBox>
            <ContentOptions
              showCondition={showCondition}
              contentHidden={contentHidden}
              contentVisibleInAssembled={contentVisibleInAssembled}
              index={index}
              isLast={isLast}
              handleToggleShowCondition={handleToggleShowCondition}
              sectionFieldName={sectionFieldName}
            />
          </SharedLayout.EditorBox>

          <BlockTypeContent fieldName={fieldName} genericBlockOptions={genericBlockOptions} shouldBlur={shouldBlur} />
        </Condition>
      </Box>

      {!isLast && contentSelectOptions && (
        <Flex>
          <SharedLayout.EditorBox>
            <AddMenu options={contentSelectOptions} clickCallback={insertContent} asEditor />
          </SharedLayout.EditorBox>
          <SharedLayout.PreviewBox p={0} minHeight={0} />
        </Flex>
      )}
    </ContentWrapper>
  )
}

export default React.memo(ContentItem)

import { useCompileContent } from 'components/Narratives/hooks'
import { Flex } from 'components/shared/jawns'
import ContentLoader from 'components/shared/layout/ContentLoader'
import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import { head } from 'lodash'
import React, { lazy, Suspense } from 'react'
import { Field, useField } from 'react-final-form'
import { COPY_MAXWIDTH } from 'util/analyses/constants'
import { required } from 'util/forms'
import { highlightSourceTokens, shouldSkipCompile } from 'util/narratives/helpers'
import usePrevious from 'util/usePrevious'

import NarrativeMarkdownStyle from '../../shared/NarrativeMarkdownStyle'
import { useBuildNarrativeContext } from '../BuildNarrativeProvider'
import ContentBox from './ContentBox'
import { EditorBox, PreviewBox } from './SharedLayout'

const MarkdownField = lazy(
  () => import(/* webpackChunkName: "markdown-field" */ 'components/shared/jawns/forms/MarkdownField')
)

interface Props {
  fieldName: string
  shouldBlur?: boolean
}

const MarkdownContent = ({ fieldName, shouldBlur = false }: Props) => {
  const { autocomplete, updatedFields } = useBuildNarrativeContext()

  const {
    input: { value },
  } = useField(`${fieldName}.text`, {
    subscription: {
      value: true,
    },
  })
  const prevValue = usePrevious(value)

  const newInput = !value

  const {
    loading: compiling,
    error: compileError,
    response,
  } = useCompileContent({
    contents: [
      {
        type: 'markdown',
        text: value,
      },
    ],
    skip: shouldSkipCompile({ value, prevValue, updatedFields }),
  })

  const responseText = response ? head(response)?.text : value
  const previewText = compileError || responseText

  return (
    <Flex>
      <EditorBox py={2} newInput={newInput}>
        <Suspense fallback={null}>
          <Field
            name={`${fieldName}.text`}
            validate={required}
            render={({ input, meta }) => (
              <MarkdownField
                {...input}
                meta={meta}
                options={{
                  default_height: 150,
                  autocomplete,
                }}
              />
            )}
          />
        </Suspense>
      </EditorBox>

      <PreviewBox style={{ opacity: shouldBlur ? 0.5 : 1 }}>
        <ContentLoader loading={compiling}>
          <ContentBox>
            <NarrativeMarkdownStyle maxWidth={COPY_MAXWIDTH}>
              <MarkdownRenderer source={highlightSourceTokens(previewText)} isEditorPreview />
            </NarrativeMarkdownStyle>
          </ContentBox>
        </ContentLoader>
      </PreviewBox>
    </Flex>
  )
}

// Memoize by default so it doesn't cause unnecessary re-renders:
export default React.memo(MarkdownContent)

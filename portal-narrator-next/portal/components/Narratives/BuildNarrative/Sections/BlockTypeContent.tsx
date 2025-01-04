import { Button } from 'antd-next'
import { useBlockOverlayContext } from 'components/BlockOverlay/BlockOverlayProvider'
import { useBuildNarrativeContext } from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import ContentBox from 'components/Narratives/BuildNarrative/Sections/ContentBox'
import * as SharedLayout from 'components/Narratives/BuildNarrative/Sections/SharedLayout'
import { useCompileContent } from 'components/Narratives/hooks'
import DynamicContent from 'components/shared/Blocks/DynamicContent'
import { Box, Flex, Typography } from 'components/shared/jawns'
import ContentLoader from 'components/shared/layout/ContentLoader'
import { isString, omit } from 'lodash'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useField } from 'react-final-form'
import styled, { css } from 'styled-components'
import { BlockContent, GenericBlockOption, SubmitResult } from 'util/blocks/interfaces'
import { colors } from 'util/constants'
import { CONTENT_TYPE_BLOCK } from 'util/narratives/constants'

interface Props {
  fieldName: string
  genericBlockOptions?: GenericBlockOption[] | null
  shouldBlur?: boolean
}

interface IPreviewBlockHeights {
  [key: string]: number
}

const PREVIEW_BLOCK_HEIGHTS: IPreviewBlockHeights = {
  dataset_plotter: 556, //deprecated
  narrative_plotter: 556,
  impact_calculator: 540,
}

const StyledContentLoader = styled(ContentLoader)`
  ${({ highlighted }: { highlighted: boolean }) =>
    highlighted &&
    css`
      z-index: ${(props) => props.theme.zIndex.overlay + 1};
      pointer-events: none;

      /* This is a little hack to make sure all child elements
         inherit the pointer-events property set above, so that
         the user cannot accidentally scroll away from the content
         when a modal is visible/highlighted
       */
      & * {
        pointer-events: inherit !important;
      }
    `}
`

const BlockTypeContent = ({ fieldName, genericBlockOptions, shouldBlur = false }: Props) => {
  const { assembledFieldsResponse } = useBuildNarrativeContext()

  const [highlighted, setHighlighted] = useState(false)
  const [overlayToggled, setOverlayToggled] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)

  // Let's get the full value for this content block
  // which includes `type` and `block`. We will use this
  // as the `slug` value for our machine
  const {
    input: { value: fieldInputValue },
  } = useField(fieldName)
  // blockSlug is a backfill for old narrative fields
  const { type: typeSlug, block: blockSlug }: { type: string; block: string } = fieldInputValue || {}
  const slug = blockSlug || typeSlug

  // to reduce the UI from jumping around while graphs load,
  // we get the plot type (via its slug) and apply some height
  // css below from the `PREVIEW_BLOCK_HEIGHTS` const above
  const previewBoxHeight = PREVIEW_BLOCK_HEIGHTS[slug]

  const blockOptions = (genericBlockOptions || []).find((opts: GenericBlockOption) => opts.slug === slug)
  const { version, title, description, advanced } = blockOptions || {}

  const { handleOpenOverlay, visible } = useBlockOverlayContext()

  // Here we just want to get the `data` part of the
  // content block, which will be used for our preview
  // and Block overlay processing
  const {
    input: { value: inputValue, onChange: onChangeConfig },
  } = useField(`${fieldName}.data`, {
    subscription: { value: true, valid: true },
    format: (value) => {
      try {
        return isString(value) ? JSON.parse(value) : value
      } catch (_err) {
        return value
      }
    },
  })

  // If we don't have a value yet, it means this
  // is a new content block
  const newInput = !inputValue

  const submitCallback = useCallback(
    ({ formData }: SubmitResult) => {
      if (!formData) {
        return null
      }

      // Mavis uses "_raw_fields", but is unneccessary in form state
      // and it can get really huge and slow down the app - so remove it
      const sanitizedFormData = omit(formData, '_raw_fields')
      onChangeConfig(JSON.stringify(sanitizedFormData, null, 4))
    },
    [onChangeConfig]
  )

  const openOverlay = useCallback(() => {
    handleOpenOverlay({
      formSlug: slug,
      submitCallback: { callback: submitCallback },
      version,
      justify: 'flex-start',
      formData: inputValue,
      fields: assembledFieldsResponse?.fields,
      width: '35%',
    })

    // Let's highlight and center the content box into the viewport
    setHighlighted(true)
    setTimeout(() => {
      if (contentRef.current) {
        contentRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      }
    }, 0)
  }, [handleOpenOverlay, slug, inputValue, submitCallback, version, assembledFieldsResponse?.fields])

  const {
    loading: compiling,
    error: compileError,
    response: blockContents = [],
  } = useCompileContent({
    fieldName,
    contents: [
      {
        type: CONTENT_TYPE_BLOCK,
        block: slug,
        data: inputValue,
      },
    ],
  })

  // if there's no data yet (meaning, we
  // are adding a new block content), pop
  // open the overlay
  useEffect(() => {
    if (newInput && !overlayToggled && !visible && advanced) {
      openOverlay()
      setOverlayToggled(true)
    }
  }, [newInput, overlayToggled, openOverlay, visible])

  useEffect(() => {
    if (!visible && highlighted) {
      setHighlighted(false)
    }
  }, [visible, highlighted])

  return (
    <Suspense fallback={null}>
      <div className="block-type-content" ref={contentRef}>
        <Flex data-private>
          <SharedLayout.EditorBox newInput={newInput}>
            <Box mb={2}>
              {advanced && (
                <Typography type="title400" data-test="block-type-content-title">
                  {title}
                </Typography>
              )}
              <Typography type="title500">{description}</Typography>
            </Box>
            {advanced && (
              <Box>
                <Button type="primary" onClick={openOverlay}>
                  Edit
                </Button>
              </Box>
            )}
          </SharedLayout.EditorBox>

          <SharedLayout.PreviewBox minHeight={previewBoxHeight} style={{ opacity: shouldBlur ? 0.5 : 1 }}>
            <StyledContentLoader loading={compiling} highlighted={highlighted}>
              <ContentBox
                style={{
                  minHeight: 260,
                  border: compileError ? `2px solid ${colors.red500}` : 'none',
                }}
              >
                {compileError ? (
                  <Typography type="title400" color="red600">
                    {compileError}
                  </Typography>
                ) : (
                  blockContents.map((block, index) => (
                    <DynamicContent key={`${block.type}.${index}`} content={block as unknown as BlockContent} />
                  ))
                )}
              </ContentBox>
            </StyledContentLoader>
          </SharedLayout.PreviewBox>
        </Flex>
      </div>
    </Suspense>
  )
}

export default BlockTypeContent

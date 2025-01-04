import { useBuildNarrativeContext } from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import AddMenu from 'components/Narratives/BuildNarrative/Sections/AddMenu'
import ContentItem from 'components/Narratives/BuildNarrative/Sections/ContentItem'
import * as SharedLayout from 'components/Narratives/BuildNarrative/Sections/SharedLayout'
import { Flex } from 'components/shared/jawns'
import React from 'react'
import { useFieldArray } from 'react-final-form-arrays'
import { GenericBlockOption } from 'util/blocks/interfaces'

interface Props {
  sectionFieldName: string
  sectionHiddenInAssembled: any
}

const Content = ({ sectionFieldName, sectionHiddenInAssembled }: Props) => {
  const { blockOptions, contentSelectOptions } = useBuildNarrativeContext()

  const { fields } = useFieldArray(`${sectionFieldName}.content`, {
    subscription: {
      length: true,
    },
  })

  const appendNew = (value: unknown) => {
    fields.push(value)
  }

  return (
    <>
      {fields.map((fieldName, index) => {
        return (
          <ContentItem
            key={`${fieldName}.${index}`}
            isLast={(fields.length && index === fields.length - 1) as boolean}
            fields={fields}
            fieldName={fieldName}
            sectionFieldName={sectionFieldName}
            index={index}
            genericBlockOptions={(blockOptions?.narrative_blocks || []) as GenericBlockOption[]}
            sectionHiddenInAssembled={sectionHiddenInAssembled}
          />
        )
      })}
      <Flex data-public>
        <SharedLayout.EditorBox>
          <AddMenu options={contentSelectOptions || []} clickCallback={appendNew} asEditor />
        </SharedLayout.EditorBox>
        <SharedLayout.PreviewBox p={0} minHeight={0} />
      </Flex>
    </>
  )
}

export default React.memo(Content)

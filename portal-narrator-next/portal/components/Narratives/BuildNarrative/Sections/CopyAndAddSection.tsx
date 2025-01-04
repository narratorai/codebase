import { DiffOutlined, PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd-next'
import { useBuildNarrativeContext } from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import { Flex } from 'components/shared/jawns'
import React from 'react'
import { FieldArrayRenderProps } from 'react-final-form-arrays'

interface Props {
  fieldNames: FieldArrayRenderProps<any, any>['fields']
  index: number
}

const CopyAndAddSection = ({ fieldNames, index }: Props) => {
  const { setCopiedSection, copiedSection } = useBuildNarrativeContext()

  return (
    <Flex bg="white" justifyContent="flex-end">
      {copiedSection && (
        <Button
          style={{ marginRight: '8px' }}
          size="small"
          onClick={() => {
            fieldNames.insert(index + 1, copiedSection)
            setCopiedSection(undefined)
          }}
          icon={<DiffOutlined />}
        >
          Add Copied Section
        </Button>
      )}

      <Button
        data-test="narrative-add-section-cta"
        size="small"
        type="dashed"
        onClick={() => fieldNames.insert(index + 1, { title: null, takeaway: null, conditioned_on: null })}
        icon={<PlusOutlined />}
      >
        Add Section
      </Button>
    </Flex>
  )
}

export default CopyAndAddSection

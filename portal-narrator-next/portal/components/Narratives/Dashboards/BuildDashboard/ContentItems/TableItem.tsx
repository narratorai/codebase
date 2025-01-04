import { useBuildNarrativeContext } from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import { CompiledResponse } from 'components/Narratives/BuildNarrative/Sections/BasicContent/TableContent'
import { useCompileContent } from 'components/Narratives/hooks'
import { IContent } from 'components/Narratives/interfaces'
import NarrativeDataTable from 'components/Narratives/Narrative/ContentWidget/NarrativeDataTable'
import { CenteredLoader } from 'components/shared/icons/Loader'
import MarkdownTableRenderer from 'components/shared/MarkdownTableRender'
import _ from 'lodash'
import React, { useMemo } from 'react'
import { useField } from 'react-final-form'
import styled from 'styled-components'
import { CONTENT_TYPE_TABLE_V2 } from 'util/narratives/constants'
import { makeTableCopiedContent } from 'util/shared_content/helpers'

import CompileErrorMessage from './CompileErrorMessage'
import InnerContent from './InnerContent'

// Make sure the compile spinner shows above the table
const StyledSpinnerContainer = styled.div`
  .antd5-spin-spinning {
    position: absolute;
    z-index: 1;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
`

interface Props {
  content: IContent
  fieldName: string
}

const TableItem = ({ content, fieldName }: Props) => {
  const { data } = content
  const { assembledFieldsResponse } = useBuildNarrativeContext()
  const fields = assembledFieldsResponse?.fields

  const {
    input: { value: columnOrderValue, onChange: onChangeColumnOrder },
  } = useField(`${fieldName}.column_order`)

  const valuesForCompile = useMemo(() => {
    // only return if it has the minimum values
    // dataset, group
    if (!data?.dataset_slug || !data?.group_slug) {
      return {}
    }

    return {
      dataset_slug: data.dataset_slug,
      group_slug: data.group_slug,
      as_data_table: !!data.as_data_table,
      title: data.title || null,
      limit: data.limit || null,
      column_order: columnOrderValue,
    }
  }, [data, columnOrderValue])

  const {
    loading: compiling,
    response: compiledResponse = [],
    error: compileError,
    callback: runCompile,
  } = useCompileContent({
    contents: [
      {
        type: CONTENT_TYPE_TABLE_V2,
        data: valuesForCompile as any,
      },
    ],
  })

  const handleRunCompile = () => {
    runCompile({
      contents: [
        {
          type: CONTENT_TYPE_TABLE_V2,
          data: valuesForCompile as any,
        },
      ],
      fields,
    })
  }

  const compiledResponseData = (compiledResponse?.[0]?.value || {}) as CompiledResponse['value']
  const compiledResponseIsMarkdown = _.isString(compiledResponseData)

  const copyContentValues =
    !_.isEmpty(valuesForCompile) &&
    _.isString(valuesForCompile?.dataset_slug) &&
    _.isString(valuesForCompile?.group_slug) &&
    _.isBoolean(valuesForCompile?.as_data_table)
      ? makeTableCopiedContent({
          ...valuesForCompile,
          dataset_slug: valuesForCompile.dataset_slug,
          group_slug: valuesForCompile.group_slug,
          as_data_table: valuesForCompile.as_data_table,
        })
      : undefined

  return (
    <InnerContent content={content} handleCompileContent={handleRunCompile}>
      {compiling && (
        <StyledSpinnerContainer>
          <CenteredLoader />
        </StyledSpinnerContainer>
      )}

      {!_.isEmpty(compiledResponseData) &&
        !compileError &&
        (compiledResponseIsMarkdown ? (
          // show markdown for string values (hasn't check use data table)
          <MarkdownTableRenderer source={compiledResponseData} copyContentValues={copyContentValues} />
        ) : (
          // show table if passed columns/rows
          <div style={{ height: 'inherit', width: '100%', overflowY: 'hidden' }}>
            <NarrativeDataTable
              content={{ ...compiledResponseData }}
              copyContentValues={copyContentValues}
              isDashboard
              onUpdateColumnOrder={onChangeColumnOrder}
              columnOrder={columnOrderValue}
            />
          </div>
        ))}

      {compileError && <CompileErrorMessage message={compileError} />}
    </InnerContent>
  )
}

export default TableItem

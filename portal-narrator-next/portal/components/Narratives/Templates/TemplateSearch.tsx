import { SearchOutlined } from '@ant-design/icons'
import { Input, Spin } from 'antd-next'
import TemplateContext from 'components/Narratives/Templates/TemplateContext'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { INarrative_Template, INarrative_Template_States_Enum, useListNarrativeTemplatesQuery } from 'graph/generated'
import { filter, find, get, includes, isEmpty, lowerCase, map, some } from 'lodash'
import { useContext, useState } from 'react'

import TemplateOption from './TemplateOption'

const TemplateSearch = () => {
  const [searchedValue, setSearchedValue] = useState<string>()

  const { machineSend, machineCurrent } = useContext(TemplateContext)
  const selectedTemplate = machineCurrent.context.graph_narrative_template

  const { data, loading } = useListNarrativeTemplatesQuery()
  // For now, only make templates that are published globally available in search
  const narrativeTemplates = filter(data?.templates, [
    'state',
    INarrative_Template_States_Enum.PublishedGlobally,
  ]) as INarrative_Template[]

  const onInputChange = (event: any) => {
    setSearchedValue(event.target.value)
  }

  const validSearchLength = searchedValue && searchedValue.length >= 2
  const filteredTemplates = validSearchLength
    ? filter(narrativeTemplates, (template) => {
        return some(['question', 'description'], (path) => {
          const value = get(template, path)
          return includes(lowerCase(value), lowerCase(searchedValue))
        })
      })
    : []

  const onSelectTemplate = (templateId: string) => {
    const template = find(narrativeTemplates, ['id', templateId]) as INarrative_Template
    if (template) {
      machineSend('SELECT_TEMPLATE', { graph_narrative_template: template })
    }
  }

  return (
    <Spin spinning={loading}>
      <Box>
        <Box mb={2}>
          <Input
            value={searchedValue}
            onChange={onInputChange}
            size="large"
            prefix={<SearchOutlined />}
            placeholder="Start typing to search..."
          />
        </Box>

        {!selectedTemplate && (
          <Flex mb={3} justifyContent="flex-start" alignItems="center" flexDirection="column">
            <Typography color="gray500">
              <i>Which attribution model should we use?</i>
            </Typography>
            <Typography color="gray500">
              <i>How are emails performing?</i>
            </Typography>

            {validSearchLength && filteredTemplates.length === 0 && (
              <Box mt={2}>
                <Typography>Try a different search.</Typography>
                <Typography>No results for &quot;{searchedValue}&quot;.</Typography>
              </Box>
            )}
          </Flex>
        )}
      </Box>

      {!isEmpty(filteredTemplates) && (
        <Box bg="white" mb={4}>
          {!isEmpty(searchedValue) && (
            <Box>
              {map(filteredTemplates, (template) => (
                <TemplateOption
                  key={template.id}
                  onClick={() => {
                    onSelectTemplate(template.id)
                    setSearchedValue('')
                  }}
                  template={template}
                />
              ))}
            </Box>
          )}
        </Box>
      )}
    </Spin>
  )
}

export default TemplateSearch

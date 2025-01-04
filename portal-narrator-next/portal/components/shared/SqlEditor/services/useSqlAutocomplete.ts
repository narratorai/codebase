import { useState, useEffect } from 'react'
import useFieldsWarehouseSource from './useFieldsWarehouseSource'
import {
  BasicCompletionServiceAsync,
  IAutocomplete,
  IBasicCompletionDefinition,
  MultiCompletionService,
  SqlCompletionService,
} from '@narratorai/the-sequel'
import _ from 'lodash'

// Unfortunate naming: these fields are not Narrative fields -- they're SQL prebuilt fields
// used in transformations
export interface IField {
  name: string
  display_name: string
  description: string
  sql: string
}

const useSqlAutocomplete = (fields: IField[] = []): IAutocomplete | undefined => {
  const sqlAutocompleteSource = useFieldsWarehouseSource()
  const [autoComplete, setAutoComplete] = useState<IAutocomplete>()

  // Get data for autocomplete that can be used for any SqlEditor components
  useEffect(() => {
    if (sqlAutocompleteSource && !autoComplete) {
      const sqlService = new SqlCompletionService(sqlAutocompleteSource)

      if (!_.isEmpty(fields)) {
        const getFieldsDefinition = (): IBasicCompletionDefinition[] => {
          return [
            {
              triggerCharacters: ['{'],
              onlyCompleteBetween: ['{', '}'],
              limitToSqlBlock: true,
              completionItems: fields.map((field) => {
                return {
                  label: field.name,
                  insertText: field.sql,
                  documentation: field.description,
                  kind: 2,
                  range: null as any,
                }
              }),
            },
          ]
        }

        // This is how we run two autocomplete services in one editor for the same language
        const fieldsService = new BasicCompletionServiceAsync(getFieldsDefinition, ['{'])
        setAutoComplete(new MultiCompletionService([fieldsService, sqlService]))
      } else {
        setAutoComplete(sqlService)
      }
    }
  }, [sqlAutocompleteSource, fields])

  return autoComplete
}

export default useSqlAutocomplete

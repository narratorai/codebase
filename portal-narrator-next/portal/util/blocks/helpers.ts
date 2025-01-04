import _ from 'lodash'
import { ObjectFieldTemplateProps } from '@rjsf/core'
import {
  BlockContent,
  BlockContentType,
  IFormContext,
  RefreshConfig,
  GroupedTab,
  TabConfig,
  TabsConfig,
  FieldConfig,
} from './interfaces'

export const triggerSchemaAndDataUpdates = (formContext: IFormContext, options: RefreshConfig, id: string) => {
  if (
    (options.update_schema || options.process_data || options.submit_form) &&
    formContext?.onRefreshConfigRequest &&
    formContext?.version === 1
  ) {
    formContext.onRefreshConfigRequest({
      field_slug: id,
      ...options,
    })
  }
}

export const findBlockContentByType = <T extends BlockContent>(
  type: BlockContentType,
  blockContent: BlockContent[] | null
): T | undefined => {
  return blockContent?.find((block) => block.type === type) as T
}

export const findAllBlockContentByType = <T extends BlockContent[]>(
  type: BlockContentType,
  blockContent: BlockContent[] | null
): T | undefined => {
  return _.compact(
    _.map(blockContent, (block) => {
      if (block.type === type) return block
      return null
    })
  ) as T
}

// Tab support in ObjectFieldTemplate
export const groupPropertiesByTab = (
  tabsConfig: TabsConfig,
  properties: ObjectFieldTemplateProps['properties']
): GroupedTab[] => {
  // Use the property_names from each tabConfig to assemble root properties in each tab:
  const selectedTabs = _.reduce(
    tabsConfig.tabs,
    (result: any, tab: TabConfig) => {
      const selectedProperties = _.filter(properties, (property) => _.includes(tab.property_names, property.name))
      return [
        ...result,
        {
          ...tab,
          label: tab.label,
          properties: selectedProperties,
          tab_id: tab.tab_id,
          redirect_tab_ids: tab.redirect_tab_ids,
        },
      ]
    },
    []
  )

  return selectedTabs
}

export const getDependentFieldsForField = ({
  fieldConfig,
  fieldConfigs,
}: {
  fieldConfig: FieldConfig
  fieldConfigs: FieldConfig[]
}): string[] => {
  // `map` through all fields to get all dependencies of a given field
  return _.compact(
    _.map(fieldConfigs, (f) => {
      if (_.includes(f.field_depends_on, fieldConfig.name)) {
        return f.name
      }
    })
  )
}

export const getAllDependentFields = (fields: FieldConfig[]) => {
  // - `filter` all fields that have `field_depends_on`
  // - `map` through the fields and get all of the `field_depends_on` values
  // - `flatten` the nested arrays (since `field_depends_on` is an array of values)
  // - `uniq` the end result to rid of duplicates
  const fieldDependsOn = fields.filter((f) => f.field_depends_on).map((field) => field.field_depends_on || [])
  return _.uniq(_.flatten(fieldDependsOn))
}

import _ from 'lodash'
import { INTEGRATIONS_CONFIG, BI_POWER_BI, BI_DATA_STUDIO, BI_OTHER } from 'util/datasets/v2/integrations/constants'
import { BiToolType } from 'util/datasets/v2/integrations/interfaces'

export const getIntegrationConfig = (type: string) => {
  if (_.isEmpty(INTEGRATIONS_CONFIG[type])) {
    return {
      displayName: _.startCase(type),
      disableParentGroup: false,
    }
  }

  return INTEGRATIONS_CONFIG[type]
}

export const makeBiToolLabel = (type: BiToolType) => {
  if (type === BI_POWER_BI) {
    return 'Power BI'
  }

  if (type === BI_DATA_STUDIO) {
    return 'Data Studio'
  }

  if (type === BI_OTHER) {
    return 'Other BI'
  }

  return _.startCase(type)
}

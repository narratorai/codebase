import { PlusOutlined } from '@ant-design/icons'
import { Button, Dropdown, Tooltip } from 'antd-next'
import { COMPANY_ADMIN_ONLY_NOTICE } from 'components/context/auth/protectedComponents'
import { useUser } from 'components/context/user/hooks'
import { DEFUALT_CRON_VALUE } from 'components/shared/jawns/forms/CronSelectFormItem'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { includes } from 'lodash'
import React from 'react'
import { useFieldArray } from 'react-final-form-arrays'
import {
  INTEGRATION_TYPE_CSV,
  INTEGRATION_TYPE_KLAVIYO,
  INTEGRATION_TYPE_MATERIALIZED,
  INTEGRATION_TYPE_POSTMARK,
  INTEGRATION_TYPE_SHEETS,
  INTEGRATION_TYPE_TEXT,
  INTEGRATION_TYPE_VIEW,
  INTEGRATION_TYPE_WEBHOOK,
  NON_COMPANY_ADMIN_INTEGRATION_TYPES,
} from 'util/datasets/v2/integrations/constants'
import { getIntegrationConfig } from 'util/datasets/v2/integrations/helpers'

const DEFAULT_MATERIALIZED_CONFIG = {
  // Every Monday at 7AM:
  company_task: {
    schedule: DEFUALT_CRON_VALUE,
  },
  days_to_resync: 30,
  group_slug: null,
  type: INTEGRATION_TYPE_MATERIALIZED,
}

const DEFAULT_WEBHOOK_CONFIG = {
  // Every Monday at 7AM:
  company_task: {
    schedule: DEFUALT_CRON_VALUE,
  },
  group_slug: null,
  type: INTEGRATION_TYPE_WEBHOOK,
}

const DEFAULT_POSTMARK_CONFIG = {
  // Every Monday at 7AM:
  company_task: {
    schedule: DEFUALT_CRON_VALUE,
  },
  group_slug: null,
  type: INTEGRATION_TYPE_POSTMARK,
}

const DEFAULT_VIEW_CONFIG = {
  group_slug: null,
  type: INTEGRATION_TYPE_VIEW,
}

const DEFAULT_SHEET_CONFIG = {
  // Every Monday at 7AM:
  company_task: {
    schedule: DEFUALT_CRON_VALUE,
  },
  group_slug: null,
  type: INTEGRATION_TYPE_SHEETS,
}

const DEFAULT_EMAIL_CSV = {
  // On Demand:
  company_task: {
    schedule: '1 1 1 1 1',
  },
  group_slug: null,
  type: INTEGRATION_TYPE_CSV,
}

const DEFAULT_TEXT = {
  // Every Monday at 7AM:
  company_task: {
    schedule: DEFUALT_CRON_VALUE,
  },
  group_slug: null,
  type: INTEGRATION_TYPE_TEXT,
}

const DEFAULT_KLAVIYO = {
  // Every Monday at 7AM:
  company_task: {
    schedule: DEFUALT_CRON_VALUE,
  },
  group_slug: null,
  type: INTEGRATION_TYPE_KLAVIYO,
}

const AddIntegrationButton = () => {
  const flags = useFlags()
  const { isCompanyAdmin } = useUser()
  const { fields } = useFieldArray('materializations')

  const ALL_MATERIALIZATION_TYPES = [
    INTEGRATION_TYPE_MATERIALIZED,
    INTEGRATION_TYPE_VIEW,
    INTEGRATION_TYPE_WEBHOOK,
    INTEGRATION_TYPE_POSTMARK,
    INTEGRATION_TYPE_SHEETS,
    INTEGRATION_TYPE_CSV,
    INTEGRATION_TYPE_KLAVIYO,
  ]

  if (flags['text-csv']) {
    ALL_MATERIALIZATION_TYPES.push(INTEGRATION_TYPE_TEXT)
  }

  const handleMenuClick = ({ key }: any) => {
    if (key === INTEGRATION_TYPE_MATERIALIZED) {
      fields.push(DEFAULT_MATERIALIZED_CONFIG)
    }
    if (key === INTEGRATION_TYPE_SHEETS) {
      fields.push(DEFAULT_SHEET_CONFIG)
    }
    if (key === INTEGRATION_TYPE_VIEW) {
      fields.push(DEFAULT_VIEW_CONFIG)
    }
    if (key === INTEGRATION_TYPE_WEBHOOK) {
      fields.push(DEFAULT_WEBHOOK_CONFIG)
    }
    if (key === INTEGRATION_TYPE_POSTMARK) {
      fields.push(DEFAULT_POSTMARK_CONFIG)
    }
    if (key === INTEGRATION_TYPE_CSV) {
      fields.push(DEFAULT_EMAIL_CSV)
    }
    if (key === INTEGRATION_TYPE_TEXT) {
      fields.push(DEFAULT_TEXT)
    }
    if (key === INTEGRATION_TYPE_KLAVIYO) {
      fields.push(DEFAULT_KLAVIYO)
    }
  }

  const menuItems = ALL_MATERIALIZATION_TYPES.map((type) => {
    const shouldDisable = !isCompanyAdmin && !includes(NON_COMPANY_ADMIN_INTEGRATION_TYPES, type)

    if (shouldDisable) {
      return {
        key: type,
        disabled: true,
        label: (
          <Tooltip title={COMPANY_ADMIN_ONLY_NOTICE}>
            <div data-test="integrations-menu-option-disabled">{getIntegrationConfig(type).displayName}</div>
          </Tooltip>
        ),
      }
    }

    return {
      key: type,
      label: <span data-test="integrations-menu-option">{getIntegrationConfig(type).displayName}</span>,
    }
  })

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: menuItems,
        onClick: handleMenuClick,
      }}
    >
      <Button icon={<PlusOutlined />} data-test="add-integrations-cta">
        Add Integration
      </Button>
    </Dropdown>
  )
}

export default AddIntegrationButton

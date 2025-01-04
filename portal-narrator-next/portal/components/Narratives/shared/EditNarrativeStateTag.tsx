import { CaretDownFilled } from '@ant-design/icons'
import { App, Dropdown, Spin } from 'antd-next'
import { useUpdateNarrativeMeta } from 'components/Narratives/hooks'
import NarrativeStateTag from 'components/Narratives/shared/NarrativeStateTag'
import { INarrative, IStatus_Enum } from 'graph/generated'
import { MenuInfo } from 'rc-menu/es/interface'
import { useEffect } from 'react'
import { getNarrativeStateLabel } from 'util/narratives'
import { handleMavisErrorNotification } from 'util/useCallMavis'

interface Props {
  narrative: Partial<INarrative>
  refetchNarrative?: () => void
}

const EditNarrativeStateTag = ({ narrative, refetchNarrative }: Props) => {
  const { notification } = App.useApp()
  const [updateNarrative, { loading: updateLoading, error: updateError, saved: updateSaved }] = useUpdateNarrativeMeta()

  const updateNarrativeState = ({ key }: MenuInfo) => {
    if (narrative) {
      updateNarrative({
        narrative_id: narrative?.id,
        name: narrative.name!,
        slug: narrative.slug!,
        state: key as string,
        description: narrative.description || '',
        category: narrative?.company_category?.category,
        isEdit: true,
        created_by: narrative.created_by,
        type: narrative.type,
      })
    }
  }

  // refetch narrative after successful update
  useEffect(() => {
    if (updateSaved && refetchNarrative) {
      refetchNarrative()
    }
  }, [updateSaved, refetchNarrative])

  // update error notification
  useEffect(() => {
    if (updateError) {
      handleMavisErrorNotification({ error: updateError, notification })
    }
  }, [updateError, notification])

  //  State Dropdown Menu
  const menuItems = [IStatus_Enum.InProgress, IStatus_Enum.Live, IStatus_Enum.Archived]
    .filter((state) => state !== narrative?.state)
    .map((item) => ({
      key: item,
      label: getNarrativeStateLabel({ state: item }),
    }))

  if (!narrative?.state) {
    return null
  }

  return (
    <Spin spinning={updateLoading}>
      <Dropdown
        menu={{
          items: menuItems,
          onClick: updateNarrativeState,
        }}
        trigger={['click']}
      >
        <NarrativeStateTag state={narrative?.state} icon={<CaretDownFilled style={{ fontSize: 10 }} />} />
      </Dropdown>
    </Spin>
  )
}

export default EditNarrativeStateTag

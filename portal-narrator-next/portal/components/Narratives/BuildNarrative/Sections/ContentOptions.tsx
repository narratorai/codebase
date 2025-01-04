import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CaretRightOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import { App, Button, Dropdown, Modal, Radio, Tooltip } from 'antd-next'
import { Box, Flex } from 'components/shared/jawns'
import { includes, isFunction } from 'lodash'
import { useCallback, useState } from 'react'
import { useFieldArray } from 'react-final-form-arrays'
import { colors } from 'util/constants'
import { ALL_PLOT_TYPES } from 'util/narratives/constants'
import { makePlotCopiedContent, setCopiedContentToLocalStorage } from 'util/shared_content/helpers'

interface Props {
  compileDisabled?: boolean
  handleCompileCallback?: () => void
  contentVisibleInAssembled: boolean
  handleToggleShowCondition: () => void
  index: number
  isLast: boolean
  sectionFieldName: string
  showCondition: boolean
  contentHidden: boolean
}

const ContentOptions = ({
  compileDisabled,
  handleCompileCallback,
  contentVisibleInAssembled,
  handleToggleShowCondition,
  index,
  isLast,
  sectionFieldName,
  showCondition,
  contentHidden,
}: Props) => {
  const { notification } = App.useApp()

  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const toggleDeleteModalVisible = () => setDeleteModalVisible((prevVisible) => !prevVisible)

  // Subscribe to fields to access full field value for functions below:
  const { fields } = useFieldArray(`${sectionFieldName}.content`, { subscription: { value: true } })

  const copyContent = useCallback(() => {
    let contentValues = { ...fields.value[index] }

    // format plots - so they can be shared throughout portal
    if (includes(ALL_PLOT_TYPES, contentValues?.type)) {
      const datasetSlug = contentValues?.data?.dataset_slug
      const groupSlug = contentValues?.data?.group_slug
      const plotSlug = contentValues?.data?.plot_slug

      // don't copy if plot doesn't have the correct slugs
      if (!datasetSlug || !groupSlug || !plotSlug) {
        return null
      }

      contentValues = makePlotCopiedContent({ datasetSlug, groupSlug, plotSlug, extraPlotData: contentValues?.data })
    }

    setCopiedContentToLocalStorage(contentValues)

    notification.success({
      message: 'Content copied',
      placement: 'topRight',
      duration: 2,
    })
  }, [fields.value, index])

  const deleteContent = useCallback(() => {
    fields.remove(index)
    toggleDeleteModalVisible()
  }, [fields, index, toggleDeleteModalVisible])

  const moveContentUp = useCallback(() => {
    fields.move(index, index - 1)
  }, [fields, index])

  const moveContentDown = useCallback(() => {
    fields.move(index, index + 1)
  }, [fields, index])

  const menuItems = [
    {
      key: 'conditional-content',
      onClick: handleToggleShowCondition,
      icon: contentVisibleInAssembled ? (
        <EyeOutlined style={{ color: showCondition || contentHidden ? colors.blue500 : 'inherit' }} />
      ) : (
        <EyeInvisibleOutlined style={{ color: colors.red500 }} />
      ),
      label: 'Hide/Show Content',
    },

    {
      key: 'copy-content',
      onClick: copyContent,
      icon: <CopyOutlined />,
      label: 'Copy Content',
    },

    {
      key: 'delete-content',
      onClick: toggleDeleteModalVisible,
      icon: <DeleteOutlined style={{ color: colors.red500 }} data-test="delete-content-item" />,
      label: 'Delete Content',
    },
  ]

  return (
    <Flex justifyContent="flex-end" data-index={index} data-test="icon-actions">
      {/* show run/compile button for basic options */}
      {isFunction(handleCompileCallback) && (
        <Box mr={1}>
          <Tooltip
            title={compileDisabled ? 'Please fill out all required fields' : 'Compile content'}
            getPopupContainer={(trigger: HTMLElement) => trigger.parentNode as HTMLElement}
          >
            <div>
              <Button
                size="small"
                disabled={compileDisabled}
                onClick={() => handleCompileCallback && handleCompileCallback()}
                icon={<CaretRightOutlined style={{ color: colors.green500 }} />}
              />
            </div>
          </Tooltip>
        </Box>
      )}

      {/* high-jacking Radio.Group since Button.Group has been deprecated
            give Radio.Group a fake value so all the buttons aren't blue
            (let the buttons handle up/down/delete events)
        */}
      <Radio.Group value="not-a-real-value" size="small" buttonStyle="solid">
        <Radio.Button onClick={moveContentDown} disabled={isLast} data-test="move-content-down-button">
          <ArrowDownOutlined />
        </Radio.Button>

        <Radio.Button onClick={moveContentUp} disabled={index === 0} data-test="move-content-up-button">
          <ArrowUpOutlined />
        </Radio.Button>

        <Dropdown
          menu={{
            items: menuItems,
          }}
        >
          <Radio.Button>
            <MoreOutlined />
          </Radio.Button>
        </Dropdown>
      </Radio.Group>

      <Modal
        open={deleteModalVisible}
        title="Delete section content"
        onOk={deleteContent}
        onCancel={toggleDeleteModalVisible}
        okButtonProps={{ 'data-test': 'confirm-delete-section-content-cta' }}
      >
        Are you sure you want to delete this section content?
      </Modal>
    </Flex>
  )
}

export default ContentOptions

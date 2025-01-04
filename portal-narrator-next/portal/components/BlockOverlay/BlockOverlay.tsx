import { Modal } from 'components/antd/staged'
import { useBlockOverlayContext } from 'components/BlockOverlay/BlockOverlayProvider'
import GenericBlock from 'components/shared/Blocks/GenericBlock'
import { SimpleLoader } from 'components/shared/icons/Loader'
import { SubmitResult } from 'util/blocks/interfaces'
import { reportError } from 'util/errors'

const BlockOverlay = () => {
  const {
    formSlug,
    visible,
    submitCallback,
    formData,
    width,
    justify,
    closeOnSubmit,
    version,
    handleCloseOverlay,
    previewTypes,
    fields,
  } = useBlockOverlayContext()

  const callbackSubmit = async ({ content, formData }: SubmitResult) => {
    if (submitCallback?.callback) {
      try {
        await submitCallback.callback({ content, formData })
      } catch (e) {
        reportError('BlockOverlay submit callback failed', e as Error, { formSlug, content, formData })
      }
    }

    if (closeOnSubmit) {
      handleCloseOverlay()
    }
  }

  if (!visible) {
    return null
  }

  return (
    <Modal
      full
      open={visible}
      width={width}
      justify={justify}
      footer={null}
      onCancel={handleCloseOverlay}
      style={{
        zIndex: 1001, // so dropdowns appear on top of preview
      }}
    >
      <div data-test="block-overlay">
        {/* All these checks are to ensure all needed data is available before showing form */}
        {!formSlug ? (
          <SimpleLoader />
        ) : (
          <GenericBlock
            key={`${formSlug}_${version}`}
            initialFormData={formData}
            fields={fields}
            version={version}
            slug={formSlug}
            submitCallback={callbackSubmit}
            previewTypes={previewTypes}
            padded={false}
            bg="white"
          />
        )}
      </div>
    </Modal>
  )
}

export default BlockOverlay

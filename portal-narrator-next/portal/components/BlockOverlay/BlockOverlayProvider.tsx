import React, { useContext, useState } from 'react'
import { SubmitResult } from 'util/blocks/interfaces'

export declare namespace IBlockOverlayProvider {
  interface SubmitCallback {
    callback?(args: SubmitResult): void
  }

  interface Props {
    fields?: Record<string, unknown>[]
    formSlug?: string
    setFormSlug: Function
    submitCallback: SubmitCallback
    closeOnSubmit?: boolean
    setCloseOnSubmit?: Function
    visible: boolean
    setVisible: Function
    formData: Record<string, unknown>
    setFormData: Function
    handleOpenOverlay: Function
    handleCloseOverlay: () => void
    width?: number | string
    setWidth: Function
    justify?: string
    setJustify: Function
    version: number
    setVersion: Function
    previewTypes?: string[]
  }

  interface HandleOpenOverlayProps {
    formSlug: string
    submitCallback: SubmitCallback
    closeOnSubmit?: boolean
    width?: number | string
    justify?: string
    version?: number
    formData?: Record<string, unknown>
    fields?: Record<string, unknown>[]
    previewTypes?: string[]
  }
}

const defaultBlockOverlayProviderProps: IBlockOverlayProvider.Props = {
  formSlug: undefined,
  setFormSlug: () => {},
  submitCallback: {},
  closeOnSubmit: false,
  setCloseOnSubmit: () => {},
  visible: false,
  setVisible: () => {},
  handleOpenOverlay: () => {},
  handleCloseOverlay: () => {},
  width: undefined,
  setWidth: () => {},
  justify: 'center',
  setJustify: () => {},
  version: 0,
  setVersion: () => {},
  formData: {},
  fields: [],
  setFormData: () => {},
  previewTypes: undefined,
}

export const BlockOverlayContext = React.createContext<IBlockOverlayProvider.Props>(defaultBlockOverlayProviderProps)
export const useBlockOverlayContext = () => useContext(BlockOverlayContext)

interface Props {
  children: React.ReactNode
}

const BlockOverlayProvider = ({ children }: Props) => {
  const [formData, setFormData] = useState(defaultBlockOverlayProviderProps.formData)
  const [fields, setFields] = useState(defaultBlockOverlayProviderProps.fields)
  const [version, setVersion] = useState(defaultBlockOverlayProviderProps.version)
  const [formSlug, setFormSlug] = useState(defaultBlockOverlayProviderProps.formSlug)
  const [visible, setVisible] = useState(defaultBlockOverlayProviderProps.visible)
  const [width, setWidth] = useState(defaultBlockOverlayProviderProps.width)
  const [justify, setJustify] = useState(defaultBlockOverlayProviderProps.justify)
  const [submitCallback, setSubmitCallback] = useState(defaultBlockOverlayProviderProps.submitCallback)
  const [closeOnSubmit, setCloseOnSubmit] = useState(defaultBlockOverlayProviderProps.closeOnSubmit)

  const [previewTypes, setPreviewTypes] = useState<string[] | undefined>(defaultBlockOverlayProviderProps.previewTypes)

  const handleOpenOverlay = ({
    formSlug,
    submitCallback = defaultBlockOverlayProviderProps.submitCallback,
    closeOnSubmit = defaultBlockOverlayProviderProps.closeOnSubmit,
    width = defaultBlockOverlayProviderProps.width,
    justify = defaultBlockOverlayProviderProps.justify,
    version = defaultBlockOverlayProviderProps.version,
    formData = defaultBlockOverlayProviderProps.formData,
    fields = defaultBlockOverlayProviderProps.fields,
    previewTypes,
  }: IBlockOverlayProvider.HandleOpenOverlayProps) => {
    // nosemgrep: javascript.react.correctness.hooks.set-state-no-op.calling-set-state-on-current-state
    setFields(fields)
    // nosemgrep: javascript.react.correctness.hooks.set-state-no-op.calling-set-state-on-current-state
    setVersion(version)
    // nosemgrep: javascript.react.correctness.hooks.set-state-no-op.calling-set-state-on-current-state
    setFormSlug(formSlug)
    // nosemgrep: javascript.react.correctness.hooks.set-state-no-op.calling-set-state-on-current-state
    setWidth(width)
    // nosemgrep: javascript.react.correctness.hooks.set-state-no-op.calling-set-state-on-current-state
    setJustify(justify)
    // nosemgrep: javascript.react.correctness.hooks.set-state-no-op.calling-set-state-on-current-state
    setSubmitCallback(submitCallback)
    // nosemgrep: javascript.react.correctness.hooks.set-state-no-op.calling-set-state-on-current-state
    setCloseOnSubmit(closeOnSubmit)
    // nosemgrep: javascript.react.correctness.hooks.set-state-no-op.calling-set-state-on-current-state
    setFormData(formData)
    // nosemgrep: javascript.react.correctness.hooks.set-state-no-op.calling-set-state-on-current-state
    setPreviewTypes(previewTypes)
    setVisible(true)
  }

  const handleCloseOverlay = () => {
    setVisible(false)
    setVersion(defaultBlockOverlayProviderProps.version)
    setFormSlug(undefined)
    setSubmitCallback(defaultBlockOverlayProviderProps.submitCallback)
    setFormData(defaultBlockOverlayProviderProps.formData)
    setPreviewTypes(defaultBlockOverlayProviderProps.previewTypes)
  }

  return (
    <BlockOverlayContext.Provider
      value={{
        visible,
        setVisible,
        submitCallback,
        closeOnSubmit,
        formSlug,
        setFormSlug,
        formData,
        handleOpenOverlay,
        handleCloseOverlay,
        width,
        setWidth,
        justify,
        setJustify,
        setVersion,
        version,
        setFormData,
        previewTypes,
        fields,
      }}
    >
      {children}
    </BlockOverlayContext.Provider>
  )
}

export default BlockOverlayProvider

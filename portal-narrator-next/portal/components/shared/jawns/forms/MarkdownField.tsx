import OverscrollHover from 'components/shared/OverscrollHover'
import React from 'react'

import BasicEditorField, { Props as BasicEditorFieldProps } from './BasicEditorField'

type Props = Omit<BasicEditorFieldProps, 'language'>

const MarkdownField = ({ options, ...props }: Props) => (
  <OverscrollHover>
    <BasicEditorField
      language="markdown"
      options={{
        lazy: true,
        resizable: true,
        default_height: 30,
        ...options,
      }}
      {...props}
    />
  </OverscrollHover>
)

export default MarkdownField

import { RcFile } from 'antd-next/es/upload/interface'

// https://ant.design/components/upload#components-upload-demo-avatar
export const getBase64 = (img: RcFile, callback: (url: string) => void) => {
  const reader = new FileReader()
  reader.addEventListener('load', () => callback(reader.result as string))
  reader.readAsDataURL(img)
}

import { CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { ChangeEvent } from 'react'

import { Card } from '@/components/primitives/Card'

import { uploadFile } from '../FileHandler/util'

interface Props {
  onUpload: (dataSrc: string, title: string, mimeType: string) => void
}

export default function RemoteFileNodePlaceholder({ onUpload }: Props) {
  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null

    if (file) {
      uploadFile(file).then((response) => {
        const dataSrc = `${response.id}.${response.fileExtension}`
        onUpload(dataSrc, file.name, file.type)
      })
    }
  }

  return (
    <Card well>
      <label
        className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:bg-gray-100"
        htmlFor="dropzone-file"
      >
        <div className="flex flex-col items-center justify-center p-6">
          <CloudArrowUpIcon className="mb-4 size-10 stroke-gray-500" />
          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click to upload</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            .pdf, .doc(x), .xls(x), .ppt(x), .txt, .csv, .zip, .pages, .numbers, .mp3 or .wav
          </p>
        </div>
        <input
          accept="application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, text/plain, text/csv, application/zip, audio/mpeg, audio/wav, application/vnd.apple.pages, application/vnd.apple.numbers, application/vnd.apple.keynote"
          className="hidden"
          id="dropzone-file"
          onChange={handleUpload}
          type="file"
        />
      </label>
    </Card>
  )
}

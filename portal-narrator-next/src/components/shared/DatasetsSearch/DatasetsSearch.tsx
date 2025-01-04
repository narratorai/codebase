'use client'

import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { IRemoteCollectionDataset } from '@/stores/datasets'

import DatasetsSearchDialog from './DatasetsSearchDialog'

interface Props {
  name: string
  Trigger: React.ElementType
}

const DatasetsSearch = ({ name, Trigger }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const { watch, setValue } = useFormContext()
  const value = watch(name)

  const handleChange = (value: IRemoteCollectionDataset) => {
    setValue(name, value)
    setIsOpen(false)
  }

  const handleClear = () => {
    setValue(name, undefined)
  }

  return (
    <>
      <Trigger onClear={handleClear} onClick={() => setIsOpen(true)} value={value} />
      <DatasetsSearchDialog name={name} onChange={handleChange} open={isOpen} setOpen={setIsOpen} value={value} />
    </>
  )
}

export default DatasetsSearch

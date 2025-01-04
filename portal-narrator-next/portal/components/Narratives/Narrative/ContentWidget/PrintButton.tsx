import { PrinterOutlined } from '@ant-design/icons'
import { Button } from 'antd-next'
import AnalysisContext from 'components/Narratives/Narrative/AnalysisContext'
import { every } from 'lodash'
import React, { useCallback, useContext, useEffect, useState } from 'react'

const PrintButton = () => {
  const { plotsLoaded, setForceRenderPlots } = useContext(AnalysisContext)
  const [shouldPrint, setShouldPrint] = useState(false)

  // check that all plots have intiialized
  // so we can print with plots
  const allPlotsLoaded = every(plotsLoaded, Boolean)

  const handlePrint = async () => {
    setForceRenderPlots(true)
    setShouldPrint(true)
  }

  // highjack the (cmd + p) hotkey to allow plots to load
  const handleQuickPrint = useCallback(
    (event: KeyboardEvent) => {
      // handle (cmd + p) hotkey
      if ((event.ctrlKey || event.metaKey) && event.keyCode == 80) {
        // stop browser from opening print dialogue
        event.preventDefault()

        handlePrint()
      }
    },
    [handlePrint]
  )

  useEffect(() => {
    if (shouldPrint && allPlotsLoaded) {
      setShouldPrint(false)
      // timeout helps page rerender before print dialogue
      setTimeout(() => {
        window.print()
      }, 0)
    }
  }, [shouldPrint, allPlotsLoaded])

  useEffect(() => {
    // add listener for cmd + p
    document.addEventListener('keydown', handleQuickPrint)

    return () => {
      // remove listener for cmd + p
      document.removeEventListener('keydown', handleQuickPrint)
    }
  }, [handleQuickPrint])

  return (
    <Button
      onClick={handlePrint}
      size="small"
      type="link"
      style={{ padding: 0 }}
      icon={<PrinterOutlined style={{ fontSize: '20px' }} />}
    />
  )
}

export default PrintButton

import { ICellEditorParams } from '@ag-grid-community/core'

// Simple javascript class to render a readonly html input
// We use this for our cell editor. This could be a react component but that's
// more trouble
export default class ReadonlyCellEditor {
  private _inputElement: HTMLInputElement
  private _value: any

  constructor() {
    this._inputElement = document.createElement('input')
    this._inputElement.setAttribute('readonly', 'true')
    this._inputElement.setAttribute('type', 'text')
    this._inputElement.className = 'ag-input-field-input ag-text-field-input'
  }

  init(params: ICellEditorParams) {
    this._inputElement.value = params.value
    this._value = params.value
  }

  getGui() {
    return this._inputElement
  }

  afterGuiAttached() {
    this._inputElement.focus()
    this._inputElement.select()
  }

  getValue() {
    return this._value
  }
}

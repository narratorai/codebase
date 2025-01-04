import React, { useRef, useEffect, useState, useCallback, MutableRefObject } from 'react'
import Measure, { ContentRect } from 'react-measure'
import monaco from '../monaco'

import MonacoEditor, { MonacoEditorProps } from 'react-monaco-editor'

import { IAutocomplete, ICompletionResult, IBasicCompletionDefinition } from '..';
import { ITextModel, IPosition } from '../autocomplete/textInterfaces';
import { ICompletionContext, ProviderResult } from '../autocomplete/autocompleteInterfaces';
import BasicCompletionService from '../autocomplete/BasicCompletionService';

import '../theme/monacoTheme.ts'; // register the global narrator-light theme with Monaco
import '../styles.css'

// A basic text editor with decent defaults based on Monaco
// Handles registering a completion provider

// Sizing
//  width can be '100%' or a number. Default is 100%
//
//  height can be 'auto', '100%', or a number. Default is auto.
//  - If height is 100% it'll resize to fit its parent
//  - If height is auto it'll resize to fit its content
//  - Setting minAutoHeight and maxAutoHeight will constrain the auto height
//
//  If you want a min width or min height on the editor when it's sizing at 100%
//  just put a parent div around it and constrain it that way

// Performance
// if changeOnBlurOnly is set to true:
// - Since performance in a text editor is important this will NOT notify
// onChange handlers on every keystroke. It will call onChange when it loses
// focus (onBlur)

// Using autocomplete: either pass in a service that implements IAutocomplete
// or pass in an array of IBasicCompletionDefinition.

export interface BasicEditorProps extends MonacoEditorProps {
  language: string
  autoComplete?: IAutocomplete | IBasicCompletionDefinition[]
  onChange?(value: string | undefined): void
  onBlur?(value: string | undefined): void
  onFocus?(): void
  onLoaded?(editor: monaco.editor.IStandaloneCodeEditor): void
  // PERFORMANCE prop - Only allow the onChange event to fire when onBlur is called:
  changeOnBlurOnly?: boolean
  // Not supported by monaco so we rolled our own:
  disabled?: boolean
  minAutoHeight?: number
  maxAutoHeight?: number
  editorRef?: MutableRefObject<EditorApi | undefined>
}

const defaultOptions = {
  wordBasedSuggestions: false,
  minimap: { enabled: false },
  suggest: { snippetsPreventQuickSuggestions: false },
  scrollBeyondLastLine: false,
  hideCursorInOverviewRuler: true,
  overviewRulerLanes: 0,
  renderLineHighlight: 'none' as 'none',
  renderIndentGuides: false,
  folding: false,
  links: false,
  fontSize: 13,
  scrollbar: {
    useShadows: false,
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8,
    alwaysConsumeMouseWheel: false
  },
  suggestLineHeight: 32,
  suggestFontSize: 14
}

const BasicEditor: React.FC<BasicEditorProps> = ({
  autoComplete,
  changeOnBlurOnly = false,
  disabled,
  onBlur,
  onChange,
  onFocus,
  onLoaded,
  options = {},
  theme = "narrator-light",
  height,
  minAutoHeight,
  maxAutoHeight,
  width,
  editorRef,
  ...props
}) => {
  const monacoEditor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const completionService = useRef<IAutocomplete | null>(null)
  const completionProvider = useRef<monaco.IDisposable | null>(null)

  const [computedHeight, setComputedHeight] = useState<number>() // do not initialize these with a value - makes first render of Monaco have the wrong auto height
  const [computedWidth, setComputedWidth] = useState<number>()

  //
  // Initial Setup
  //
  const editorDidMount = useCallback<NonNullable<MonacoEditorProps["editorDidMount"]>>(
    (editor) => {
      if (editorRef)  {
        editorRef.current = new EditorApi(editor)
      }
      monacoEditor.current = editor
      editor.onDidBlurEditorText(onBlurOverride)
      editor.onDidFocusEditorText(() => onFocus && onFocus())

      // set up auto height callbacks
      updateAutoHeight()
      editor.onDidChangeModelDecorations(() => {
        if (options?.folding === true) {
          requestAnimationFrame(updateAutoHeight) // folding
        }
      })

      editor.onDidContentSizeChange(() => {
        updateAutoHeight()
      })

      // TODO: Line nums and wordwrap state doesn't persist across rerenders.
      //       In theory we could fix that, but in practice we're not 
      //       rerendering the editor while a user is interacting with it

      // Add toggling line numbers to the context menu
      const onMode = typeof(options?.lineNumbers) === 'function' ? options.lineNumbers : "on"
      editor.addAction({
        id: 'toggle-line-numbers',
        label: 'Toggle Line Numbers',
        contextMenuGroupId: 'toggle',
        contextMenuOrder: 9,
        run: (editor) => {
          const mode = editor.getOption(monaco.editor.EditorOption.lineNumbers)

          // renderType === 1 means 'on'. renderFn being defined means 'on' also -- we've passed down 
          // a custom function. 
          const newMode = (mode.renderType === 1 || mode.renderFn) ? "off" : onMode
          editor.updateOptions({ lineNumbers: newMode })
        }
      })

      // Add toggle wordwrap to the context menu
      editor.addAction({
        id: 'toggle-wordwrap',
        label: 'Toggle Wordrap',
        keybindings: [
          monaco.KeyMod.Alt | monaco.KeyCode.KEY_Z,
        ],
        contextMenuGroupId: 'toggle',
        contextMenuOrder: 10,
        run: (editor) => {
          const mode = editor.getOption(monaco.editor.EditorOption.wordWrap)
          const newMode = mode !== "off" ? "off" : "on"
          editor.updateOptions({ wordWrap: newMode })
        }
      })

      // user-supplied callback
      onLoaded && onLoaded(editor)
    }, []
  )

  //
  // Width and Height computation
  //

  // Handle height / width = '100%': Update computed width / height when parent resizes
  const handleResize = useCallback(
    (contentRect: ContentRect) => {
      if (!contentRect.entry) {
        return
      }

      if (isPercent(width)) {
        setComputedWidth(contentRect.entry.width)
        updateAutoHeight() // we'll have more (or fewer) lines so the auto height might have changed
      }

      if (isPercent(height)) {
        setComputedHeight(contentRect.entry.height)
      }
    }, [height, width]
  )


  // Handle height='auto'
  const updateAutoHeight = useCallback(
    () => {
      const editor = monacoEditor.current

      if (!editor || height !== 'auto') {
        return
      }

      let newHeight = editor.getContentHeight()

      if (minAutoHeight && newHeight < minAutoHeight) {
        newHeight = minAutoHeight
      }

      if (maxAutoHeight && newHeight > maxAutoHeight) {
        newHeight = maxAutoHeight
      }

      setComputedHeight(newHeight)
    }, [monacoEditor, height, minAutoHeight, maxAutoHeight]
  )

  //
  // Autocomplete setup and teardown
  //
  useEffect(() => {
    // cleanup - we want this one to ONLY be called on component mount / unmount
    return function cleanup() {
      completionProvider.current?.dispose()
    }
  }, [])

  useEffect(() => {
    if (autoComplete && props.language) {

      // If autoComplete changes we only need to update the completion service ref
      // to return the new values
      if ((autoComplete as IBasicCompletionDefinition[])?.length) {
        // user passed in a completion definition, so let's build the IAutocomplete object for them
        completionService.current = new BasicCompletionService(autoComplete as IBasicCompletionDefinition[])
      } else {
        completionService.current = autoComplete as IAutocomplete
      }

      // Register autocomplete - just once
      // Means we can't provide new triggerCharacters while an editor is live, but that's not needed currently
      if (!completionProvider.current) {
        const provider = monaco.languages.registerCompletionItemProvider(props.language, {
          triggerCharacters: completionService.current.triggerCharacters,
          provideCompletionItems: provideCompletion,
        })
        // we only save the provider in order to dispose of it properly
        completionProvider.current = provider
      }
    }
  }, [autoComplete, props.language])

  function provideCompletion(content: ITextModel, position: IPosition, context: ICompletionContext): ProviderResult<ICompletionResult> {
    // This wrapper function ensures that an autocomplete provider only runs on the instance
    // of the model it was registered for. Registering a provider is done globally.
    if (monacoEditor.current?.getModel() === content && completionService.current) {

      // TODO: 
      // Now that we support promises it would be nice to immediately show the suggestions UI
      // with a 'loading' message while waiting for the async call
      // By default Monaco shows nothing at all until the promise resolves. 
      // To show it immediately we need to manually trigger suggestions on editor contents change. 
      // See this: https://github.com/microsoft/monaco-editor/issues/2755

      return completionService.current.provideCompletionItems?.(content, position, context)
    }

    return {
      suggestions: []
    }
  }

  const onBlurOverride = useCallback(
    (): void  => {
      const currentValue = monacoEditor.current?.getValue()
      // For performance reasons we only fire the change event when the editor loses focus
      if (changeOnBlurOnly) {
        onChange && onChange(currentValue)
      }

      onBlur && onBlur(currentValue)
    }, [monacoEditor]
  )



  // Roll our own disabled prop:
  const disabledOptions = disabled ? { extraEditorClassName: 'monaco-disabled', readOnly: true } : { extraEditorClassName: '', readOnly: false }

  const finalHeight = isNumber(height) ? height : computedHeight
  const finalWidth = isNumber(width) ? width : computedWidth

  return (
    <Measure
      bounds
      onResize={handleResize}
    >
      {({ measureRef }) => {
        return (
          <div style={{ height: '100%' }} ref={measureRef}>
            <MonacoEditor
              height={finalHeight}
              width={finalWidth}
              editorDidMount={editorDidMount}
              onChange={changeOnBlurOnly ? () => {} : onChange}
              theme={theme}
              options={{ ...defaultOptions, ...disabledOptions, ...options}}
              overrideServices={{

                // Provide our own implementation of
                // IStorageService (https://github.com/microsoft/vscode/blob/master/src/vs/platform/storage/common/storage.ts)
                // This is hack to make the autocomplete documentation panel always open. In Monaco it's implemented as a user
                // preference that gets saved the first time the user opens the panel.
                // By replacing the service we can always have it be open (because no one will ever figure out how to open it).
                // This implementation doesn't save preferences, so it effectively disables all other saved preferences from working, but
                // we don't use them (stuff like intellisense, search history, etc)
                // If random stuff breaks we can disable this.
                storageService: {
                  get() {},
                  getBoolean(key: string) {
                    if (key === "expandSuggestionDocs")
                        return true;
                    return false;
                  },
                  store() {},
                  remove() {},
                  onWillSaveState() {},
                  onDidChangeStorage() {}
                }
              }}
              {...props}
            />
          </div>
        )
      }}
    </Measure>
  )
}

BasicEditor.defaultProps = {
  height: 'auto',
  width: '100%'
}

const isNumber = (input: any) => {
  return typeof input === "number"
}

const isPercent = (input: any) => {
  return !isNumber(input) && input !== "auto"
}


// API we expose for calling things directly
export class EditorApi {
  private _editor: monaco.editor.IStandaloneCodeEditor

  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this._editor = editor
  }

  focus() {
    this._editor.focus()
  }
}


export default BasicEditor

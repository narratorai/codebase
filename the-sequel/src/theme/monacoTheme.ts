import MarkdownProvider from '../autocomplete/SqlAutocomplete/Providers/MarkdownProvider';
import monaco from '../monaco'
import { markdownTokens, markdownConfig } from './markdownTokens';

//
// This file redefines Markdown's tokenization and creates a narrator-specific theme
//

const markdown = "markdown"

// disable loading the markdown language definition (required for built-in languages)
monaco.languages.getLanguages().forEach(function (lang) {
  if ([markdown].includes(lang.id)) {
    //@ts-ignore
    lang.loader = function () {
      return { then: function () {} };
    };
  }
});

// now we can override markdown (to support autocomplete inside {})
monaco.languages.setMonarchTokensProvider(markdown, markdownTokens as any)
monaco.languages.setLanguageConfiguration(markdown, markdownConfig as any)
monaco.languages.registerCompletionItemProvider(markdown, new MarkdownProvider())

// BigQuery: a project name can contain dashes and backticks. 
// When we're in sql (e.g. inside a markdown code block) we want `my-project` to be a single word (for autocomplete)
monaco.languages.setLanguageConfiguration('sql', {
  // this pattern describes word separators
  // allow ` and - in words by not having them in this regex
  wordPattern: /(-?\d*\.\d\w*)|([^\~\!\#\%\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
})

// and define our custom theme
monaco.editor.defineTheme('narrator-light', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'curly-brace', foreground: '234567' },
    { token: 'header', fontStyle: 'bold' },
    { token: 'keyword', foreground: '0451a5' }  // the default blue is a bit too intense
  ],

  // how to theme monaco editor's default colors
  // https://github.com/microsoft/monaco-editor/blob/master/test/playground.generated/customizing-the-appearence-exposed-colors.html
  colors: {
    'editorLineNumber.foreground': '#888888',
    'editorSuggestWidget.background': '#fff',
    'editorSuggestWidget.border': '#e5e5e5',
    'editorSuggestWidget.selectedBackground': '#58b3eb'
  }
} as any);

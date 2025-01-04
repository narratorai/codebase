// 
// Define our own tokens for parsing Markdown.
//
// Code taken from here: https://github.com/microsoft/monaco-languages/blob/master/src/markdown/markdown.ts
// Can play with it here: https://microsoft.github.io/monaco-editor/monarch.html
//
// The ONLY reason we're redefining markdown's tokenization is to rename the rule for {} to be 
// its own custom thing instead of string.target
//
// Any token with the name 'string' is special-cased in Monaco to not allow autocomplete. We want to autocomplete
// with curly braces, so this what we have to do
// 
export const markdownTokens = {
  defaultToken: '',
  tokenPostfix: '.md',

  // escape codes
  control: /[\\`*_\[\]{}()#+\-\.!]/,
  noncontrol: /[^\\`*_\[\]{}()#+\-\.!]/,
  escapes: /\\(?:@control)/,

  // escape codes for javascript/CSS strings
  jsescapes: /\\(?:[btnfr\\"']|[0-7][0-7]?|[0-3][0-7]{2})/,

  // non matched elements
  empty: [
    'area', 'base', 'basefont', 'br', 'col', 'frame',
    'hr', 'img', 'input', 'isindex', 'link', 'meta', 'param'
  ],

  tokenizer: {
    root: [

      // We redefined headers from 'keyword' to 'header' just so we can make it bold
      // headers (with #)
      [/^(\s{0,3})(#+)((?:[^\\]|@escapes)+)((?:#+)?)/, 'header'],

      // headers (with =)
      [/^\s*(=+|\-+)\s*$/, 'keyword'],

      // headers (with ***)
      [/^\s*((\*[ ]?)+)\s*$/, 'meta.separator'],

      // quote
      [/^\s*>+/, 'comment'],

      // list (starting with * or number)
      [/^\s*([\*\-+:]|\d+\.)\s/, 'keyword'],

      // code block (4 spaces indent)
      // [/^(\t|[ ]{4})[^ ].*$/, 'string'],   <-- turn this one off: multiline curly brace code is intented 4 spaces also and this would block autocomplete

      // code block (3 tilde)
      [/^\s*~~~\s*((?:\w|[\/\-#])+)?\s*$/, { token: 'string', next: '@codeblock' }],

      // github style code blocks (with backticks and language)
      [/^\s*```\s*((?:\w|[\/\-#])+)\s*$/, { token: 'string', next: '@codeblockgh', nextEmbedded: '$1' }],

      // github style code blocks (with backticks but no language)
      [/^\s*```\s*$/, { token: 'string', next: '@codeblock' }],

      // markup within lines
      { include: '@linecontent' },
    ],

    codeblock: [
      [/^\s*~~~\s*$/, { token: 'string', next: '@pop' }],
      [/^\s*```\s*$/, { token: 'string', next: '@pop' }],
      [/.*$/, 'variable.source'],
    ],

    // github style code blocks
    codeblockgh: [
      [/```\s*$/, { token: 'variable.source', next: '@pop', nextEmbedded: '@pop' }],
      [/[^`]+/, 'variable.source'],
    ],

    linecontent: [

      // escapes
      [/&\w+;/, 'string.escape'],
      [/@escapes/, 'escape'],

      // various markup
      [/\b__([^\\_]|@escapes|_(?!_))+__\b/, 'strong'],
      [/\*\*([^\\*]|@escapes|\*(?!\*))+\*\*/, 'strong'],
      [/\b_[^_]+_\b/, 'emphasis'],
      [/\*([^\\*]|@escapes)+\*/, 'emphasis'],
      [/`([^\\`]|@escapes)+`/, 'variable'],

      // links
      [/\{+[^}]+\}+/, 'curly-brace'],   // <------------- this is the change!!!! 
      [/(!?\[)((?:[^\]\\]|@escapes)*)(\]\([^\)]+\))/, ['string.link', '', 'string.link']],
      [/(!?\[)((?:[^\]\\]|@escapes)*)(\])/, 'string.link'],

      // or html
      { include: 'html' },
    ],

    // Note: it is tempting to rather switch to the real HTML mode instead of building our own here
    // but currently there is a limitation in Monarch that prevents us from doing it: The opening
    // '<' would start the HTML mode, however there is no way to jump 1 character back to let the
    // HTML mode also tokenize the opening angle bracket. Thus, even though we could jump to HTML,
    // we cannot correctly tokenize it in that mode yet.
    html: [
      // html tags
      [/<(\w+)\/>/, 'tag'],
      [/<(\w+)/, {
        cases: {
          '@empty': { token: 'tag', next: '@tag.$1' },
          '@default': { token: 'tag', next: '@tag.$1' }
        }
      }],
      [/<\/(\w+)\s*>/, { token: 'tag' }],

      [/<!--/, 'comment', '@comment']
    ],

    comment: [
      [/[^<\-]+/, 'comment.content'],
      [/-->/, 'comment', '@pop'],
      [/<!--/, 'comment.content.invalid'],
      [/[<\-]/, 'comment.content']
    ],

    // Almost full HTML tag matching, complete with embedded scripts & styles
    tag: [
      [/[ \t\r\n]+/, 'white'],
      [/(type)(\s*=\s*)(")([^"]+)(")/, ['attribute.name.html', 'delimiter.html', 'string.html',
        { token: 'string.html', switchTo: '@tag.$S2.$4' },
        'string.html']],
      [/(type)(\s*=\s*)(')([^']+)(')/, ['attribute.name.html', 'delimiter.html', 'string.html',
        { token: 'string.html', switchTo: '@tag.$S2.$4' },
        'string.html']],
      [/(\w+)(\s*=\s*)("[^"]*"|'[^']*')/, ['attribute.name.html', 'delimiter.html', 'string.html']],
      [/\w+/, 'attribute.name.html'],
      [/\/>/, 'tag', '@pop'],
      [/>/, {
        cases: {
          '$S2==style': { token: 'tag', switchTo: 'embeddedStyle', nextEmbedded: 'text/css' },
          '$S2==script': {
            cases: {
              '$S3': { token: 'tag', switchTo: 'embeddedScript', nextEmbedded: '$S3' },
              '@default': { token: 'tag', switchTo: 'embeddedScript', nextEmbedded: 'text/javascript' }
            }
          },
          '@default': { token: 'tag', next: '@pop' }
        }
      }],
    ],

    embeddedStyle: [
      [/[^<]+/, ''],
      [/<\/style\s*>/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
      [/</, '']
    ],

    embeddedScript: [
      [/[^<]+/, ''],
      [/<\/script\s*>/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
      [/</, '']
    ],
  }
}

// Markdown language config. Since we disabled loading the language we have to resupply this too
export const markdownConfig = {
	comments: {
		blockComment: ['<!--', '-->',]
	},
	brackets: [
		['{', '}'],
		['[', ']'],
		['(', ')']
	],
	autoClosingPairs: [
		{ open: '{', close: '}' },
		{ open: '[', close: ']' },
		{ open: '(', close: ')' },
		{ open: '<', close: '>', notIn: ['string'] }
	],
	surroundingPairs: [
		{ open: '(', close: ')' },
		{ open: '[', close: ']' },
		{ open: '`', close: '`' },
	],
	folding: {
		markers: {
			start: new RegExp("^\\s*<!--\\s*#?region\\b.*-->"),
			end: new RegExp("^\\s*<!--\\s*#?endregion\\b.*-->")
		}
	}
};
import { editor } from "monaco-editor";
import { activateCompletion } from "./completion";
import { activateFormatting } from "./formatting";
import { activateListEditing } from "./listEditing";
import { activateTableFormatter } from "./tableFormatter";
import { setWordDefinitionFor, TextEditor } from "./vscode-monaco";

import { activateMarkdownMath } from "./markdown.contribution";

export class MonacoMarkdownExtension {
  activate(editor: editor.IStandaloneCodeEditor) {
    let textEditor = new TextEditor(editor);

    activateFormatting(textEditor);
    activateListEditing(textEditor);
    activateCompletion(textEditor);
    activateTableFormatter(textEditor);

    // Allow `*` in word pattern for quick styling
    setWordDefinitionFor(
      textEditor.languageId,
      /(-?\d*\.\d\w*)|([^\!\@\#\%\^\&\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s\，\。\《\》\？\；\：\‘\“\’\”\（\）\【\】\、]+)/g
    );
  }
}

activateMarkdownMath();

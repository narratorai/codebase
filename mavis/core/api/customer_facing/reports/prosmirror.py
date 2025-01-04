from typing import List, Literal, Union
from pydantic import Field, BaseModel

from core.api.customer_facing.utils.pydantic import NodeDatasetConfig
from core.models.ids import get_uuid4
from markdown_it import MarkdownIt
from markdown_it.token import Token


class Mark(BaseModel):
    type: Literal["bold", "italic", "underline", "strikethrough", "link", "highlight", "code"]


class TextNode(BaseModel):
    type: Literal["text"] = "text"
    text: str


class MarkTextNode(TextNode):
    marks: List[Mark]


class ProsmirrorAttrs(BaseModel):
    uid: str = Field(default_factory=get_uuid4)


class ProsmirrorNode(BaseModel):
    type: str
    attrs: ProsmirrorAttrs = Field(default_factory=ProsmirrorAttrs)
    content: list["ProsmirrorNode"]


class CalloutAttrs(ProsmirrorAttrs):
    backgroundColor: str
    icon: str | None = None
    hideIcon: bool = False


class CalloutNode(ProsmirrorNode):
    type: Literal["callout"] = "callout"
    attrs: CalloutAttrs = Field(default_factory=CalloutAttrs)
    content: list[ProsmirrorNode]


class BulletListNode(ProsmirrorNode):
    type: Literal["bulletList"] = "bulletList"
    attrs: ProsmirrorAttrs = Field(default_factory=ProsmirrorAttrs)
    content: list[ProsmirrorNode]


class ListItemNode(ProsmirrorNode):
    type: Literal["listItem"] = "listItem"
    attrs: ProsmirrorAttrs = Field(default_factory=ProsmirrorAttrs)
    content: list[ProsmirrorNode]


class ListItemAttrs(ProsmirrorAttrs):
    start: int = 1


class OrderedListNode(ProsmirrorNode):
    type: Literal["orderedList"] = "orderedList"
    attrs: ListItemAttrs = Field(default_factory=ListItemAttrs)
    content: list[ProsmirrorNode]


class ParagraphAttrs(ProsmirrorAttrs):
    textAlign: Literal["left", "center", "right"] = "left"


class HeadingAttrs(ProsmirrorAttrs):
    level: Literal[1, 2, 3, 4, 5, 6]


class HeadingNode(ProsmirrorNode):
    type: Literal["heading"] = "heading"
    attrs: HeadingAttrs = Field(default_factory=HeadingAttrs)
    content: list[TextNode]


class ParagraphNode(ProsmirrorNode):
    type: Literal["paragraph"] = "paragraph"
    attrs: ParagraphAttrs = Field(default_factory=ParagraphAttrs)
    content: list[TextNode]


class RulerNode(BaseModel):
    type: Literal["horizontalRule"] = "horizontalRule"


class CodeAttrs(ProsmirrorAttrs):
    language: str = "sql"


class CodeNode(ProsmirrorNode):
    type: Literal["codeBlock"] = "codeBlock"
    attrs: CodeAttrs = Field(default_factory=CodeAttrs)
    content: list[TextNode]


class GridAttrs(ProsmirrorAttrs):
    gridTemplateRows: str | None = None
    gridTemplateColumns: str


class GridNode(ProsmirrorNode):
    type: Literal["grid"] = "grid"
    attrs: GridAttrs = Field(default_factory=GridAttrs)
    content: list[ProsmirrorNode]


class GridColumnNode(ProsmirrorNode):
    type: Literal["gridColumn"] = "gridColumn"
    content: list[ProsmirrorNode]


class GridColumnGutterNode(ProsmirrorNode):
    type: Literal["gridColumnGutter"] = "gridColumnGutter"


class PlotAttrs(ProsmirrorAttrs):
    height: int = 450
    dataset: NodeDatasetConfig


class PlotNode(BaseModel):
    type: Literal["plot"] = "plot"
    attrs: PlotAttrs = Field(default_factory=PlotAttrs)


class TableAttrs(ProsmirrorAttrs):
    height: int = 450
    dataset: NodeDatasetConfig


class TableNode(BaseModel):
    type: Literal["table"] = "table"
    attrs: TableAttrs = Field(default_factory=TableAttrs)


def obj_to_prosmirror(obj: any) -> ProsmirrorNode:
    if isinstance(obj, str):
        return ParagraphNode(attrs=ParagraphAttrs(), content=[TextNode(text=obj)])
    elif isinstance(obj, list):
        return BulletListNode(content=[ListItemNode(content=[obj_to_prosmirror(item) for item in obj])])
    return {}


def create_grid(items: list[ProsmirrorNode], distributions: list[float]) -> ProsmirrorNode:
    grid_template_columns = []
    grid_items = []
    for ii, item in enumerate(items):
        grid_template_columns.append(f"{distributions[ii]*len(items)}fr 12px")
        grid_items.append(GridColumnNode(content=[item]))
        grid_items.append(GridColumnGutterNode())
    return GridNode(content=grid_items, attrs=GridAttrs(gridTemplateColumns=" ".join(grid_template_columns)))


def tokens_to_prosmirror(tokens: List[Token]) -> ProsmirrorNode:
    stack: List[Union[ProsmirrorNode, RulerNode]] = []
    current_marks: List[Mark] = []  # track active marks

    def new_node(node_class, **kwargs):
        return node_class(content=[], **kwargs)

    def add_text(content: str, code=False):
        # Add a text node or marked text node to the current node
        if not stack:
            # If somehow no node on stack, wrap text in a paragraph node
            stack.append(new_node(ParagraphNode))

        marks = current_marks[:]
        if code:
            marks.append(Mark(type="code"))

        if marks:
            text_node = MarkTextNode(text=content, marks=marks)
        else:
            text_node = TextNode(text=content)

        stack[-1].content.append(text_node)

    def process_inline_marks(text: str):
        if "`" in text:
            # Handle code marks first
            code_parts = text.split("`")
            for i, code_part in enumerate(code_parts):
                if code_part:
                    if i % 2 == 1:  # Between ` markers - code text
                        current_marks.append(Mark(type="code"))
                        process_italic(code_part)
                        current_marks.pop()
                    else:
                        process_italic(code_part)
        else:
            process_italic(text)

    def process_italic(text: str):
        if "*" in text:
            italic_parts = text.split("*")
            for i, italic_part in enumerate(italic_parts):
                if italic_part:
                    if i % 2 == 1:  # Between * markers - italic text
                        current_marks.append(Mark(type="italic"))
                        add_text(italic_part)
                        current_marks.pop()
                    else:
                        add_text(italic_part)
        else:
            add_text(text)

    # Helper functions to handle marks
    def push_mark(mark_type: str):
        current_marks.append(Mark(type=mark_type))

    def pop_mark(mark_type: str):
        # Pop the last mark if it matches mark_type
        if current_marks and current_marks[-1].type == mark_type:
            current_marks.pop()

    i = 0
    while i < len(tokens):
        token = tokens[i]
        if token.type == "bullet_list_open":
            stack.append(new_node(BulletListNode))
        elif token.type == "ordered_list_open":
            # Extract start attribute if present, default to 1
            start = int(token.attrs.get("start", [1])[0]) if token.attrs else 1
            stack.append(new_node(OrderedListNode, attrs=ListItemAttrs(start=start)))
        elif token.type in ["bullet_list_close", "ordered_list_close"]:
            node = stack.pop()
            if stack:
                stack[-1].content.append(node)
            else:
                stack.append(node)
        elif token.type == "inline":
            # Process inline content for bold, italic, and code markers
            content = token.content
            if "**" in content or "*" in content or "`" in content:
                # First handle bold (**) markers
                parts = content.split("**")
                for idx, part in enumerate(parts):
                    if part:
                        if idx % 2 == 1:  # Between ** markers - bold text
                            current_marks.append(Mark(type="bold"))
                            process_inline_marks(part)
                            current_marks.pop()
                        else:  # Outside ** markers
                            process_inline_marks(part)
            else:
                add_text(content)
        elif token.type == "list_item_open":
            stack.append(new_node(ListItemNode))

        elif token.type == "list_item_close":
            node = stack.pop()
            stack[-1].content.append(node)

        elif token.type == "paragraph_open":
            stack.append(new_node(ParagraphNode))

        elif token.type == "paragraph_close":
            node = stack.pop()
            # If paragraph is empty, add an empty text node to avoid empty content
            if not node.content:
                node.content.append(TextNode(text=""))
            if stack:
                stack[-1].content.append(node)
            else:
                stack.append(node)

        elif token.type == "heading_open":
            # Extract level from token.tag (e.g. 'h1' => 1)
            level = int(token.tag[1])
            stack.append(HeadingNode(attrs=HeadingAttrs(level=level), content=[]))

        elif token.type == "heading_close":
            node = stack.pop()
            if stack:
                stack[-1].content.append(node)
            else:
                stack.append(node)

        elif token.type == "hr":
            # Horizontal rule
            hr_node = RulerNode(type="horizontalRule")
            if stack:
                stack[-1].content.append(hr_node)
            else:
                # If no stack, wrap it in a paragraph or bulletList
                # For simplicity, create a paragraph and put HR inside - though HR is usually a block-level node.
                # Ideally, define a top-level doc node. Here we just push it at top level.
                stack.append(new_node(ParagraphNode))
                stack[-1].content.append(hr_node)

        elif token.type == "text":
            add_text(token.content)

        elif token.type == "code_inline":
            # Code inline: add text with code mark
            stack.append(CodeNode(content=[TextNode(text=token.content)], attrs=CodeAttrs(language="sql")))

        # Marks / Inline formatting
        elif token.type == "strong_open":
            push_mark("bold")
        elif token.type == "strong_close":
            pop_mark("bold")

        elif token.type == "em_open":
            push_mark("italic")
        elif token.type == "em_close":
            pop_mark("italic")

        elif token.type == "del_open":
            push_mark("strikethrough")
        elif token.type == "del_close":
            pop_mark("strikethrough")

        elif token.type == "mark_open":
            push_mark("highlight")
        elif token.type == "mark_close":
            pop_mark("highlight")

        elif token.type == "link_open":
            # For simplicity, we just treat link as a mark.
            # If you want the URL, token.attrs might have [('href', '...')]
            # You could store attributes in the Mark if your schema supports it.
            push_mark("link")
        elif token.type == "link_close":
            pop_mark("link")

        else:
            # Unsupported token type. In a full implementation, handle other tokens as needed.
            pass

        i += 1

    # If there's only one node at top-level, return it directly
    if len(stack) == 1:
        if isinstance(stack[0], ProsmirrorNode):
            return stack[0]
        # If it's a ruler or something else
        if isinstance(stack[0], RulerNode):
            # Wrap in a paragraph node for demonstration
            return ParagraphNode(content=[stack[0]])
        # If empty, return a paragraph
        return ParagraphNode(content=[TextNode(text="")])

    # If multiple top-level nodes, wrap them in a bullet list node or paragraph node
    # Ideally, you define a top-level doc node. Here we just do a fallback:
    top_nodes = stack
    if all(isinstance(n, (ProsmirrorNode, RulerNode)) for n in top_nodes):
        # If top-level nodes are all block nodes, wrap in a bulletList for demonstration
        return BulletListNode(content=top_nodes if isinstance(top_nodes, list) else [top_nodes])
    else:
        # If we have something else, just return a paragraph with their text joined.
        text_content = []
        for n in top_nodes:
            if isinstance(n, TextNode):
                text_content.append(n.text)
        return ParagraphNode(content=[TextNode(text=" ".join(text_content))])


def markdown_to_prosmirror(markdown: str) -> ProsmirrorNode:
    md = MarkdownIt()
    tokens = md.parse(markdown)
    return tokens_to_prosmirror(tokens)

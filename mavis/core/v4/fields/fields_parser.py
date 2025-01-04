import ast
import uuid
from ast import Attribute, Call, Constant, Load, Name
from collections import namedtuple

from asteval import Interpreter

from core import utils

#
# !!! Security sensitive code !!!
#
# Modifying this file requires code review
#


#
# Parses and executes the restricted Python code used in field definitions
#

ParseResult = namedtuple("ParseResult", ["symbols", "errors", "dump", "modified_source", "raw_symbols"])


class ParseError:
    def __init__(self, message, line_num, expression):
        self.message = message
        self.line_num = line_num
        self.expression = expression
        self.full_message = f"Error on line {line_num}: {message}" if line_num else message

    def __str__(self):
        return self.full_message

    def __repr__(self):
        return f"{self.__class__}, {self.__dict__}"


class FieldsParser:
    """
    Parses our flavor of Python and executes it

    protected_instance: an object with our custom functions on it. Used to call to Mavis; protected so that it can't be directly accessed

    Attributes we allow
    1. methods on the protected instance
    2. any attribute on an object  - list.pop(), dict.keys() - etc that does NOT start with an underscore (_)


    Global built-in functions - i.e. dict(), list(), len(), etc
    1. only functions we whitelist (see allSymbols.py)

    Modules
    import is not allowed. We don't bring in any modules at all
    """

    def __init__(self, protected_instance, predefined_symbols) -> None:
        self.protected_name = utils.slugify(f"a{uuid.uuid4()}")
        protected = (self.protected_name, protected_instance)

        allowed_global_functions = predefined_symbols.keys()
        self.transformer = self.CallTransformer(allowed_global_functions, protected)

        # Pass the global functions and instance object to asteval so that the user can call them
        # these are the ONLY functions that will be allowed
        symbols = self._make_symbols(protected, predefined_symbols)

        self.aeval = Interpreter(
            symtable=symbols,
            no_functiondef=True,
            no_print=True,
            no_raise=True,
            no_try=True,
            no_assert=True,
            no_delete=True,
        )

    # TODO: make a type for the return dict
    def execute(self, code: str) -> dict[str, str]:
        if code is None or len(code) == 0:
            return {"errors": [], "symbols": []}

        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            error = ParseError(e.msg, e.lineno, e.text)
            return {"errors": [error], "symbols": []}

        self.transformer.visit(tree)
        tree = ast.fix_missing_locations(tree)
        errors = self.transformer.errors

        if errors:
            return {"errors": errors, "symbols": []}

        ignored_symbols = list(self.aeval.symtable.keys())
        self.aeval.run(tree, code, 1, with_raise=False)

        for error in self.aeval.error:
            lineno = error.node.lineno if error.node and hasattr(error.node, "lineno") else error.lineno

            code = error.expr.split("\n")[lineno - 1] if lineno else ""
            errors.append(ParseError(error.msg, lineno, code))

            # error.exc_info[1] will give another message if msg is null

        # Get the new variables defined by the user in the code we just executed
        # by filtering out symbols that existed before we ran eval
        symbols = [symbol for symbol in self.aeval.symtable.items() if symbol[0] not in ignored_symbols]

        return {
            "symbols": symbols,
            "errors": errors,
        }

    def _make_symbols(self, protected_symbol: tuple[str, object], predefined_symbols):
        protected_name, protected_instance = protected_symbol
        symbols = predefined_symbols.copy() if predefined_symbols else {}
        symbols.update({self.protected_name: protected_instance})

        # Clear all special built-in functions from our custom symbol table
        for key in symbols.copy().keys():
            if key.startswith("__"):
                symbols.pop(key)

        return symbols

    class CallTransformer(ast.NodeTransformer):
        """
        Walks the AST and updates it to handle function calls and attributes
        """

        def __init__(
            self,
            allowed_function_names: list[str],
            protected_symbol: tuple[str, object],
        ) -> None:
            super().__init__()

            self.errors = []
            self.allowed_function_names = allowed_function_names

            protected_name, protected_instance = protected_symbol
            self.protected_instance_name = protected_name
            self.protected_method_names = protected_instance.function_names

        def visit_Call(self, node):
            """
            Called each time the parser sees a function call of any kind
            """

            func = node.func
            if isinstance(func, Attribute):
                # Method call on an object: rewrite to a global function
                # with object as the first arg
                #
                # rewrites myobject.function(args) to
                # function(myobject, args)
                #
                # where 'myobject' can be any chained combo of objects or functions - x.y().z().w,
                # list comprehensions [row for row in rows], etc

                name = func.attr
                if name in self.protected_method_names:
                    new_node = Call(
                        func=Name(id=name, ctx=Load()),
                        args=[node.func.value] + node.args,
                        keywords=node.keywords,
                    )

                    new_node = ast.copy_location(new_node, node)

                    # generic visit the new node to update chained calls: a.sum().human_format()
                    self.generic_visit(new_node)

                    # visit to update the global function calls into our special instance calls
                    # sum(a) -> instance.sum(a)
                    new_node = self.visit(new_node)

                    return new_node

            elif isinstance(func, Name):
                # Function call on a module. If it's a special protected instance function
                # rewrite it to work
                function_name = func.id

                if function_name in self.protected_method_names:
                    # This replaces a function call `get_dataset('123')` with a method call on our protected
                    # instance: `instance.get_dataset('123')`
                    new_node = Call(
                        func=Attribute(
                            value=Name(id=self.protected_instance_name, ctx=Load()),
                            attr=function_name,
                            ctx=Load(),
                        ),
                        args=node.args,
                        keywords=node.keywords,
                    )
                    return ast.copy_location(new_node, node)

                elif function_name not in self.allowed_function_names:
                    message = f"Unknown function `{function_name}`"
                    return self._parse_error(node, message)

            # no modifications
            return self.generic_visit(node)

        def visit_Attribute(self, node):
            # Filters out any attribute calls that start with _
            # This protects against calling private attributes on classes we've defined, like Dataset
            if node.attr.startswith("_"):
                message = f"Can't access private attribute `{node.attr}`"
                return self._parse_error(node, message)

            # Replaces the attribute call 'datasets.my_slug' with 'getDataset('my_slug')
            if isinstance(node.value, Name):
                name_node = node.value
                if name_node.id == "datasets":
                    # we're going to replace this node, an attribute, with a function call
                    new_node = Call(
                        func=Name(id="get_dataset", ctx=Load()),
                        args=[Constant(value=node.attr)],
                        keywords=[],
                    )

                    new_node = self.visit(new_node)  # get_dataset() itself is rewritten to ensure we do that

                    if new_node:
                        new_node = ast.copy_location(new_node, node)
                    return new_node

            return self.generic_visit(node)

        def _parse_error(self, node, message):
            lineno = getattr(node, "lineno", None)

            self.errors.append(ParseError(message, lineno, ast.unparse(node)))

            # Note: We return none and don't execute this AST
            #       because it's invalid. There's no valid node
            #       we can return here worth executing

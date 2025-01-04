import json
from typing import Generator

from core.constants import LLM_AGENT_MODEL
from core.logger import get_logger
from core.models.company import CompanyTable
from core.util.llm import llm_client
from core.v4.llm.helpers import load_prompt, ui_message_to_chat_message
from core.v4.llm.models import GPTResponse, ReplyData, UIMessage, data_type_enum, role_enum
from core.v4.llm.tools.answer_data_question import DatasetTool
from core.v4.llm.tools.fetch_customer_journey import CustomerJourneyTool
from core.v4.llm.tools.get_related_activities import GetActivitiesTool
from core.v4.llm.tools.search_internet import SearchResultTool
from core.v4.llm.tools.update_context import UpdateContextTool
from core.v4.mavis import Mavis

logger = get_logger()


class MavisAgent:
    def __init__(
        self,
        mavis: Mavis,
        table_id: str,
        messages: list[UIMessage] = None,
    ):
        self.mavis: Mavis = mavis
        self.table_id: str = table_id
        self.company_table: CompanyTable = mavis.company.table(table_id)
        self.messages: list[UIMessage] | None = messages

    def get_tools(self):
        tools = [GetActivitiesTool, SearchResultTool, CustomerJourneyTool, DatasetTool, UpdateContextTool]
        return [t(self.mavis, self.company_table, self.messages) for t in tools]

    def ask_llm(self) -> Generator:
        tools = self.get_tools()

        tool_txt = []
        for t in tools:
            tool_txt.append(f" - {t.model.__name__}: {t.when_to_use}")

        # define the prompt
        prompt = load_prompt(
            self.mavis.company,
            "mavis_ai",
            tool_txt="\n".join(tool_txt),
        )

        for _ in range(3):
            messages = ui_message_to_chat_message(prompt, self.messages)

            logger.debug(
                "Asking GPT",
                prompt=prompt,
                user_message=self.messages[0].data.text,
                past_messages=messages[1:],
            )
            # Ask chat gpt
            response = llm_client.beta.chat.completions.parse(
                model=LLM_AGENT_MODEL,  # Use the appropriate model version
                messages=messages,
                response_format=GPTResponse,
                tools=[tool.json_schema for tool in tools],
                tool_choice="auto",
            )

            message = response.choices[0].message
            logger.debug("Received Reply", response=response)

            if message.tool_calls:
                # Add the tool call to the messages
                self.messages.append(UIMessage(tool_request=message, hidden=True))
                logger.debug("Function call detected", message=message)

                # Run Each function
                for tool_call in message.tool_calls:
                    # start with the message
                    function_results = None

                    # try:
                    function_call = tool_call.function
                    function_arguments = json.loads(function_call.arguments)
                    logger.debug(
                        "running function",
                        function_name=function_call.name,
                        function_arguments=function_arguments,
                    )

                    tool_to_use = next((tool for tool in tools if tool.model.__name__ == function_call.name), None)

                    if tool_to_use is None:
                        raise Exception(f"Tool {function_call.name} not found")

                    logger.debug(
                        "running tool",
                        tool_name=tool_to_use.model.__name__,
                        tool_arguments=function_arguments,
                    )

                    if tool_to_use.is_generator:
                        function_results = yield from tool_to_use.run(tool_to_use.model(**function_arguments))
                    else:
                        function_results = tool_to_use.run(tool_to_use.model(**function_arguments))
                        yield function_results

                    logger.debug("function results", function_results=function_results)

                    # we add the message to the UI
                    function_results.tool_call_id = tool_call.id
                    function_results.function_name = function_call.name
                    function_results.role = role_enum.tool
                    function_results.complete()

                    # Add the message
                    self.messages.append(function_results)

                    if isinstance(function_results.data, ReplyData):
                        yield function_results
                        return None

                    # except Exception as e:
                    #     if function_results is not None:
                    #         function_results.hidden = True
                    #         self.messages.append(function_results)

                    #     yield UIMessage(
                    #         type=data_type_enum.reply,
                    #         data=ReplyData(
                    #             content=f"An Error Occurred: {str(e)}, please submit this chat to support to help us improve our product",
                    #             suggestions=[],
                    #             type=reply_type_enum.error,
                    #         ),
                    #     )
                    #     return None

            else:
                yield UIMessage(
                    type=data_type_enum.reply,
                    data=ReplyData(**{k: v for k, v in message.parsed.dict().items() if k != "suggestions"}),
                    suggestions=message.parsed.suggestions,
                )
                break

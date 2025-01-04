import json

import backoff
import openai
import requests
from cachetools import LRUCache, cached
from numpy import array, dot
from numpy.linalg import norm
from pydantic import BaseModel

from core.constants import LLM_AGENT_MODEL, LLM_SMALL_AGENT_MODEL, TEXT_EMBEDDING_MODEL
from core.logger import get_logger
from core.models.settings import settings

logger = get_logger()


# Register the function with OpenAI API
llm_client = openai.OpenAI(
    # This is the default and can be omitted
    api_key=settings.openai_key.get_secret_value()
)

search_details_prompt = """
You are an expert of parsing search engine results pages to get a paragraph of all the details without any fluff.
"""


class SearchInternet(BaseModel):
    content: str


class SearchResult(BaseModel):
    name: str
    url: str
    snippet: str
    date_published: str | None

    @property
    def content(self):
        return f"{self.name}\n{self.snippet}"


class SearchResults(BaseModel):
    results: list[SearchResult]
    content: str


@cached(cache=LRUCache(maxsize=30))
def text_to_vector(text):
    logger.debug("vectorizing text", text=text)
    response = llm_client.embeddings.create(input=text, model=TEXT_EMBEDDING_MODEL)
    q_vec = response.data[0].embedding
    return q_vec


def cos_sim(vec1, vec2):
    A = array(vec1)
    B = array(vec2)

    cosine_similarity = dot(A, B) / (norm(A) * norm(B))
    return cosine_similarity


@backoff.on_exception(
    backoff.expo,
    openai.RateLimitError,
    max_tries=3,
    logger=logger,
)
def ask_gpt(
    prompt, user_message, json_schema: BaseModel | None = None, use_small_model=True, allow_search=False
) -> tuple[BaseModel, list[SearchResult] | None]:
    logger.debug(
        "Asking GPT",
        use_small_model=use_small_model,
        prompt=prompt,
        user_message=user_message,
    )
    prompt_tokens = 0
    completion_tokens = 0
    total_tokens = 0

    messages = [
        dict(role="system", content=prompt),
        dict(
            role="user",
            content=user_message,
        ),
    ]
    # ask chat gpt to summarize it
    if allow_search:
        tools = [openai.pydantic_function_tool(SearchInternet)]

    retry = 0
    search_results = []

    for _ in range(50):
        if json_schema:
            try:
                response = llm_client.beta.chat.completions.parse(
                    model=(
                        LLM_SMALL_AGENT_MODEL if use_small_model else LLM_AGENT_MODEL
                    ),  # Use the appropriate model version
                    messages=messages,
                    response_format=json_schema,
                    **dict(tools=tools, tool_choice="auto") if allow_search else {},
                )
            except Exception:
                if retry > 3:
                    raise
                retry += 1
                continue
        else:
            response = llm_client.chat.completions.create(
                model=(
                    LLM_SMALL_AGENT_MODEL if use_small_model else LLM_AGENT_MODEL
                ),  # Use the appropriate model version
                messages=messages,
                response_format={"type": "json_object"},
                **dict(tools=tools, tool_choice="auto") if allow_search else {},
            )
        message = response.choices[0].message
        prompt_tokens += response.usage.prompt_tokens
        completion_tokens += response.usage.completion_tokens
        total_tokens += response.usage.total_tokens

        if message.tool_calls:
            messages.append(message)

            for tool_call in message.tool_calls:
                function_call = tool_call.function
                function_arguments = json.loads(function_call.arguments)
                logger.debug(
                    "Using a tool",
                    name=function_call.name,
                    function_call=function_call,
                    function_arguments=function_arguments,
                )

                if function_call.name == "SearchInternet":
                    function_results = search_internet(SearchInternet(**function_arguments).content)
                    search_results.extend(function_results.results)
                else:
                    logger.error("Unknown function", function_call=function_call.name)
                    raise ValueError(f"Unknown function: {function_call.name}")

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "function_name": function_call.name,
                        "content": function_results.content,
                    }
                )
        else:
            logger.debug(
                "TOKENS_USED",
                model=response.model,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
            )
            if json_schema is not None:
                if allow_search:
                    return message.parsed, search_results
                else:
                    return message.parsed
            else:
                if allow_search:
                    return json.loads(message.content), search_results
                else:
                    return json.loads(message.content)


# Function to search the web
def search_internet(query) -> SearchResults:
    url = "https://api.bing.microsoft.com/v7.0/search"
    headers = {"Ocp-Apim-Subscription-Key": settings.bing_api_key.get_secret_value()}
    params = {
        "q": query.replace('"', "").replace("'", ""),
        "textDecorations": True,
        "textFormat": "HTML",
        "responseFilter": "Webpages",
        "count": 15,
    }

    response = None
    for _ in range(3):
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            break

    if response.status_code != 200:
        return []

    # parse the results
    search_results = response.json()

    # Extract relevant details
    refined_results = []
    if "webPages" in search_results:
        for result in search_results["webPages"]["value"]:
            refined_result = SearchResult(
                name=_html_to_markdown(result.get("name")),
                url=result.get("url"),
                snippet=_html_to_markdown(result["snippet"]),
                date_published=result.get("datePublished"),
            )
            refined_results.append(refined_result)

    question = f"Searched for: {query}\n\nResults:\n" + "\n".join([r.content for r in refined_results])
    content = ask_gpt(search_details_prompt, question, SearchInternet)
    return SearchResults(results=refined_results, content=content.content)


def _html_to_markdown(html_text):
    return html_text.replace("<b>", "**").replace("</b>", "**")

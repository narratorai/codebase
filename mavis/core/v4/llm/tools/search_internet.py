from typing import Generator

from pydantic import BaseModel

from core.util.llm import search_internet
from core.v4.llm.models import SearchData, UIMessage, data_type_enum
from core.v4.llm.tools import Tool


class SearchInternet(BaseModel):
    search_term: str


class SearchResultTool(Tool):
    @property
    def model(self) -> SearchInternet:
        return SearchInternet

    @property
    def description(self) -> str:
        return "Returns a list of results from the internet. "

    @property
    def when_to_use(self) -> str:
        return 'Whenever the user is asking of general knowledge or you need to find some information (ex. "What is a common baseline for open rates?" or "What are the top metrics for SaaS companies?").'

    @property
    def is_generator(self) -> bool:
        return True

    def run(self, model: SearchInternet) -> Generator:
        message = UIMessage(
            data_type_enum=data_type_enum.internet_search, data=SearchData(term=model.search_term, results=[])
        )

        message.update_loading(10.0, f"Searching the internet with {model.search_term}")
        yield message

        results = search_internet(search_term=model.search_term)
        message.data = SearchData(term=model.search_term, results=results.results)
        message.complete()
        yield message

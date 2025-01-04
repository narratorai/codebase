from fastapi import APIRouter, Depends

from core.api.auth import get_current_company
from core.models.company import Company
from core.v4.documentation import get_doc

from .models import DocumentationOutput

router = APIRouter(prefix="/docs", tags=["documentation"])


@router.get("", response_model=DocumentationOutput)
async def get_documentation(slugs: str, company: Company = Depends(get_current_company)):
    all_docs = []

    for doc_slug in slugs.split(","):
        try:
            markdown = get_doc(company, doc_slug)
        except Exception:
            markdown = "> Could not find the documentation"

        all_docs.append(dict(slug=doc_slug, markdown=markdown))

    return dict(all_documents=all_docs)

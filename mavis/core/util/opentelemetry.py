from honeycomb.opentelemetry import HoneycombOptions, configure_opentelemetry
from opentelemetry import trace
from opentelemetry.trace import get_current_span

from core.models.settings import settings


def configure(service_name: str):
    """
    Configure OpenTelemetry with the Honeycomb exporter.
    Requires these environment variables to be set.
        - HONEYCOMB_API_KEY
        - HONEYCOMB_DATASET
        - OTEL_SERVICE_NAME

    The last two are set dynamically on the docker container.
    """
    options = HoneycombOptions(
        service_name=service_name,
        sample_rate=settings.honeycomb_sample_rate,
        enable_local_visualizations=settings.is_local,
    )
    configure_opentelemetry(options)


def serialize_span_context(span: trace.Span):
    """
    Serialize a span context into a dictionary.
    """
    context = span.get_span_context()

    return {
        "trace_id": f"{context.trace_id:0x}",
        "span_id": f"{context.span_id:0x}",
        "trace_flags": context.trace_flags,
    }


def set_current_span_attributes(**kwargs):
    """
    Set attributes for the current span.
    """
    span = get_current_span()
    span.set_attributes(kwargs)


tracer = trace.get_tracer("core.api.main")

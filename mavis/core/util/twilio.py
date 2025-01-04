from twilio.rest import Client

from core.models.settings import settings
from core.util.opentelemetry import tracer

twilio_client = Client(settings.twilio_sid, settings.twilio_key.get_secret_value())


@tracer.start_as_current_span("send_text")
def send_text(to_number: str, body: str):
    twilio_client.messages.create(to_number, body=body, from_=settings.twilio_number)

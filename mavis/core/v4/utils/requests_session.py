import requests

REQUESTS_ALLOW_REDIRECTS = False


class ConfiguredSession(requests.Session):
    def request(self, *args, **kwargs):
        if not REQUESTS_ALLOW_REDIRECTS:
            kwargs.update({"allow_redirects": False})
        return super().request(*args, **kwargs)


requests_session = ConfiguredSession()

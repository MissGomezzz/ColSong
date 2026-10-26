"""Validadores reutilizables por los esquemas de varios módulos."""

import re
from typing import Annotated

from pydantic import AfterValidator

_HTTP_URL = re.compile(r"^https?://[^\s\"'<>]+$", re.IGNORECASE)


def _http_url(value: str) -> str | None:
    """Solo enlaces http(s). Evita esquemas como `javascript:` que luego se mostrarían como enlace."""
    value = value.strip()
    if not value:
        return None
    if not _HTTP_URL.match(value):
        raise ValueError("Debe ser un enlace que empiece por http:// o https://")
    return value


HttpUrlStr = Annotated[str, AfterValidator(_http_url)]

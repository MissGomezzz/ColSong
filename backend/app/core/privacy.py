"""Política de contacto de ColSong (estilo Airbnb).

La plataforma es el lugar donde artistas y locales se encuentran. Para que el primer
acercamiento ocurra aquí (el botón "Quiero conectar"), los datos que permiten saltarse
la plataforma solo se revelan cuando el local ACEPTA al artista:

| Dato                                         | Antes de aceptar         | Tras aceptar          |
| -------------------------------------------- | ------------------------ | --------------------- |
| Local: nombre, tipo, barrio, foto            | visible                  | visible               |
| Local: dirección exacta y coordenadas        | oculta (solo el barrio)  | visible para el artista |
| Local: teléfono                              | oculto                   | visible para el artista |
| Artista: perfil, portafolio, video           | visible para el local    | visible               |
| Artista: Instagram, correo y teléfono        | ocultos                  | visibles para el local |
| Texto libre (títulos, descripciones, bio...) | contactos enmascarados   | texto completo        |

El dueño de una publicación siempre ve sus propios datos sin máscara.

Este módulo solo contiene el enmascarado de texto libre; cada módulo aplica la tabla
anterior al armar sus respuestas (ver `opportunities/service.py` y `applications/service.py`).
Limitación conocida: detecta teléfonos, correos, enlaces, dominios y usuarios `@`, pero no
datos escritos de forma ingeniosa (números con letras, direcciones en texto, etc.).
"""

import re

MASK = "[contacto oculto]"

_EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
_URL = re.compile(r"(?:https?://|www\.)\S+", re.IGNORECASE)
_DOMAIN = re.compile(
    r"\b[\w-]+(?:\.[\w-]+)*\.(?:com|co|net|org|io|me|app|link|ee|ly|tv|bio)\b(?:/\S*)?",
    re.IGNORECASE,
)
_HANDLE = re.compile(r"(?<![\w@.])@[A-Za-z0-9._]{3,30}")
# Secuencias de dígitos con separadores típicos de un teléfono. No empieza tras "$" ni a mitad
# de un número con separador de miles ("1.200.000" no debe leerse como "200.000").
_PHONE_CANDIDATE = re.compile(r"(?<![\w$])(?<!\d[.,])\+?\(?\d[\d ().\-]{5,}\d(?!\w)")
_MONEY = re.compile(r"^\d{1,3}(?:[.,]\d{3})+(?:\s*[-–]\s*\d{1,3}(?:[.,]\d{3})+)*$")
_DATE = re.compile(r"^\d{1,4}[/.\-]\d{1,2}[/.\-]\d{1,4}$")
_MIN_PHONE_DIGITS = 7  # un teléfono fijo local tiene 7 dígitos; un celular, 10


def _mask_phone(match: re.Match) -> str:
    text = match.group(0)
    if sum(c.isdigit() for c in text) < _MIN_PHONE_DIGITS:
        return text
    if _MONEY.match(text) or _DATE.match(text):
        return text
    return MASK


def mask_contact_info(text: str | None) -> str | None:
    """Reemplaza correos, enlaces, dominios, usuarios @ y teléfonos por `[contacto oculto]`."""
    if not text:
        return text
    out = _EMAIL.sub(MASK, text)
    out = _URL.sub(MASK, out)
    out = _DOMAIN.sub(MASK, out)
    out = _HANDLE.sub(MASK, out)
    return _PHONE_CANDIDATE.sub(_mask_phone, out)

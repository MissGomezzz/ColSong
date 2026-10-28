"""Enmascarado de contactos en texto libre (core/privacy.py). No necesita base de datos."""

import pytest

from app.core.privacy import MASK, mask_contact_info

MUST_MASK = [
    "Escríbenos al 300 123 4567", "WhatsApp +57 300 123 4567", "(601) 234 5678", "3001234567",
    "573001234567", "300-123-4567", "300.123.4567", "tel 234 5678", "mail: info@casafrida.co",
    "https://instagram.com/casafrida", "www.casafrida.co", "wa.me/573001234567", "linktr.ee/banda",
    "sígueme en @sofialuna.music", "casafrida.co/reservas",
]
MUST_KEEP = [
    "Pago $1.200.000 por toque", "$450.000 - $600.000", "450.000 - 600.000", "COP 1.500.000",
    "Sáb, 7 Nov a las 8:00 p. m.", "Fecha 2026-11-07", "Duración 90 minutos", "Indie / Alternativo",
    "Aforo 120 - 150 personas", "Cra. 13 #54-20, Chapinero", "Buscamos trío de bossa nova",
    "Dom, 1 Nov · 7:00 p. m.", "Pago de 450000 pesos", "2 sets de 45 minutos con 15 de pausa",
]


@pytest.mark.parametrize("text", MUST_MASK)
def test_hides_contact_data(text):
    assert MASK in mask_contact_info(text)


@pytest.mark.parametrize("text", MUST_KEEP)
def test_keeps_prices_dates_and_normal_text(text):
    assert mask_contact_info(text) == text


def test_empty_values_pass_through():
    assert mask_contact_info(None) is None and mask_contact_info("") == ""

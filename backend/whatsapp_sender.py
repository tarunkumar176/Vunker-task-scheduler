"""
WhatsApp invoice sender utility for Vynker.

Uses the free WhatsApp Cloud API (Meta Business) to send a PDF invoice
as a document to the client's phone number.

Requires these environment variables:
  WHATSAPP_TOKEN         – Permanent access token from Meta Business
  WHATSAPP_PHONE_ID      – Phone number ID from WhatsApp Business settings

If the env vars are not set the module will log a warning and skip sending,
so it degrades gracefully in development.
"""

import os
import io
import logging
import requests

log = logging.getLogger(__name__)

WHATSAPP_TOKEN    = os.environ.get("WHATSAPP_TOKEN", "")
WHATSAPP_PHONE_ID = os.environ.get("WHATSAPP_PHONE_ID", "")
GRAPH_API_VERSION = "v21.0"


def _normalise_phone(phone: str) -> str:
    """
    Strip spaces / dashes and ensure country code.
    Default to +91 (India) if no country code present.
    """
    phone = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if phone.startswith("+"):
        phone = phone[1:]
    elif phone.startswith("0"):
        phone = "91" + phone[1:]
    elif len(phone) == 10:
        phone = "91" + phone
    return phone


def _upload_media(pdf_bytes: bytes, filename: str) -> str | None:
    """Upload PDF to WhatsApp Media API and return the media_id."""
    if not WHATSAPP_TOKEN or not WHATSAPP_PHONE_ID:
        log.warning("WhatsApp credentials not configured – skipping media upload")
        return None

    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{WHATSAPP_PHONE_ID}/media"
    headers = {"Authorization": f"Bearer {WHATSAPP_TOKEN}"}

    files = {
        "file": (filename, io.BytesIO(pdf_bytes), "application/pdf"),
        "type": (None, "application/pdf"),
        "messaging_product": (None, "whatsapp"),
    }

    try:
        resp = requests.post(url, headers=headers, files=files, timeout=30)
        resp.raise_for_status()
        media_id = resp.json().get("id")
        log.info(f"WhatsApp media uploaded: {media_id}")
        return media_id
    except Exception as e:
        log.error(f"WhatsApp media upload failed: {e}")
        return None


def send_invoice_whatsapp(
    phone: str,
    pdf_bytes: bytes,
    invoice_number: str,
    project_name: str,
    client_name: str,
    total_cost: float,
) -> dict:
    """
    Send a PDF invoice to the client via WhatsApp.

    Returns a dict with:
      - sent: bool
      - method: 'api' | 'link' | 'skipped'
      - message_id: str (if sent via API)
      - whatsapp_link: str (fallback deep link to open WhatsApp manually)
      - error: str (if failed)
    """
    normalised = _normalise_phone(phone)
    filename = f"Invoice_{invoice_number}.pdf"

    # Always generate the fallback wa.me link
    greeting = (
        f"Hi {client_name},\n\n"
        f"Thank you for choosing Vynker Technologies!\n\n"
        f"Here is the invoice for your project \"{project_name}\".\n"
        f"Invoice No: {invoice_number}\n"
        f"Total Amount: ₹{total_cost:,.0f}\n\n"
        f"Please find the attached PDF invoice.\n\n"
        f"Regards,\nVynker Technologies"
    )
    import urllib.parse
    wa_link = f"https://wa.me/{normalised}?text={urllib.parse.quote(greeting)}"

    # If WhatsApp API is configured, send via API
    if WHATSAPP_TOKEN and WHATSAPP_PHONE_ID:
        media_id = _upload_media(pdf_bytes, filename)
        if not media_id:
            return {"sent": False, "method": "link", "whatsapp_link": wa_link,
                    "error": "Media upload failed"}

        url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{WHATSAPP_PHONE_ID}/messages"
        headers = {
            "Authorization": f"Bearer {WHATSAPP_TOKEN}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": normalised,
            "type": "document",
            "document": {
                "id": media_id,
                "caption": (
                    f"📄 Invoice #{invoice_number}\n"
                    f"Project: {project_name}\n"
                    f"Amount: ₹{total_cost:,.0f}\n\n"
                    f"Thank you for choosing Vynker Technologies! 🚀"
                ),
                "filename": filename,
            },
        }

        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            msg_id = data.get("messages", [{}])[0].get("id", "")
            log.info(f"WhatsApp invoice sent to {normalised}: {msg_id}")
            return {"sent": True, "method": "api", "message_id": msg_id,
                    "whatsapp_link": wa_link}
        except Exception as e:
            log.error(f"WhatsApp send failed: {e}")
            return {"sent": False, "method": "link", "whatsapp_link": wa_link,
                    "error": str(e)}
    else:
        log.info(f"WhatsApp API not configured – returning wa.me link for {normalised}")
        return {"sent": False, "method": "link", "whatsapp_link": wa_link}

"""
Invoice PDF generator for Vynker Technologies.

Generates a professional PDF invoice matching the branded template with:
- Company header with branding
- Bill To section with client details
- Itemized service table
- Payment details section
- Terms & Conditions
- Authorized signature
"""

import io
import os
import logging
from datetime import datetime
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

log = logging.getLogger(__name__)

# ── Colours ────────────────────────────────────────────────────────────────────
BRAND_BLUE   = HexColor("#0D47A1")
BRAND_DARK   = HexColor("#0A2E6B")
HEADER_BG    = HexColor("#0D47A1")
TABLE_HEADER = HexColor("#0D47A1")
LIGHT_GREY   = HexColor("#F5F5F5")
BORDER_GREY  = HexColor("#CCCCCC")
TEXT_BLACK    = HexColor("#222222")
TEXT_GREY     = HexColor("#555555")

ROOT = Path(__file__).parent
SIGNATURE_PATH = ROOT / "auth_signature.png"
LOGO_PATH = ROOT.parent / "frontend" / "assets" / "images" / "app-image.png"

# ── Payment details (configurable via env) ─────────────────────────────────────
PAYMENT_INFO = {
    "upi_id":         os.environ.get("INVOICE_UPI_ID",         "vynkertech@ybl"),
    "bank_name":      os.environ.get("INVOICE_BANK_NAME",      "State Bank of India"),
    "account_number": os.environ.get("INVOICE_ACCOUNT_NUMBER",  "XXXXXXXX1234"),
    "ifsc_code":      os.environ.get("INVOICE_IFSC_CODE",       "SBIN0001234"),
}

TERMS = [
    "The above cost includes application development and 2 months of free maintenance from the date of delivery.",
    "Free maintenance covers bug fixes and minor updates only. New features will be charged separately.",
    "After the free maintenance period, maintenance services will be billed separately.",
    "50% advance payment is required to initiate the project. Remaining amount to be paid upon completion.",
    "No refunds once the project has been started.",
    "All deliverables will be shared after full payment is completed.",
]


def _make_styles():
    """Return a dict of ParagraphStyles used throughout the invoice."""
    return {
        "company": ParagraphStyle("company", fontName="Helvetica-Bold", fontSize=18,
                                   textColor=BRAND_BLUE, leading=22),
        "company_sub": ParagraphStyle("company_sub", fontName="Helvetica", fontSize=8,
                                       textColor=TEXT_GREY, leading=11),
        "invoice_title": ParagraphStyle("invoice_title", fontName="Helvetica-Bold",
                                         fontSize=28, textColor=BRAND_BLUE, alignment=TA_RIGHT),
        "invoice_meta": ParagraphStyle("invoice_meta", fontName="Helvetica", fontSize=10,
                                        textColor=TEXT_BLACK, alignment=TA_RIGHT, leading=14),
        "section_header": ParagraphStyle("section_header", fontName="Helvetica-Bold",
                                          fontSize=11, textColor=white, leading=15),
        "bill_name": ParagraphStyle("bill_name", fontName="Helvetica-Bold", fontSize=13,
                                     textColor=TEXT_BLACK, leading=17),
        "bill_detail": ParagraphStyle("bill_detail", fontName="Helvetica", fontSize=10,
                                       textColor=TEXT_GREY, leading=14),
        "table_header": ParagraphStyle("table_header", fontName="Helvetica-Bold",
                                        fontSize=10, textColor=white, alignment=TA_CENTER, leading=14),
        "table_cell": ParagraphStyle("table_cell", fontName="Helvetica", fontSize=10,
                                      textColor=TEXT_BLACK, alignment=TA_CENTER, leading=14),
        "table_cell_left": ParagraphStyle("table_cell_left", fontName="Helvetica", fontSize=10,
                                           textColor=TEXT_BLACK, alignment=TA_LEFT, leading=14),
        "total_label": ParagraphStyle("total_label", fontName="Helvetica-Bold", fontSize=11,
                                       textColor=TEXT_BLACK, alignment=TA_RIGHT, leading=15),
        "total_value": ParagraphStyle("total_value", fontName="Helvetica-Bold", fontSize=12,
                                       textColor=TEXT_BLACK, alignment=TA_RIGHT, leading=15),
        "pay_label": ParagraphStyle("pay_label", fontName="Helvetica-Bold", fontSize=10,
                                     textColor=TEXT_BLACK, leading=14),
        "pay_value": ParagraphStyle("pay_value", fontName="Helvetica", fontSize=10,
                                     textColor=TEXT_GREY, leading=14),
        "term": ParagraphStyle("term", fontName="Helvetica", fontSize=8,
                                textColor=TEXT_GREY, leading=11),
        "sign_name": ParagraphStyle("sign_name", fontName="Helvetica-Bold", fontSize=11,
                                     textColor=BRAND_BLUE, alignment=TA_CENTER, leading=14),
        "sign_title": ParagraphStyle("sign_title", fontName="Helvetica", fontSize=9,
                                      textColor=TEXT_GREY, alignment=TA_CENTER, leading=12),
    }


def _format_inr(amount: float) -> str:
    """Format a number in Indian style."""
    if amount == 0:
        return "Rs. 0"
    # Simple Indian number formatting
    s = f"{amount:,.0f}"
    return f"Rs. {s}"


def _section_bar(text: str, styles: dict, width: float):
    """Create a coloured section header bar."""
    t = Table(
        [[Paragraph(text, styles["section_header"])]],
        colWidths=[180],
        rowHeights=[22],
        hAlign='LEFT'
    )
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), TABLE_HEADER),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
    ]))
    return t


def generate_invoice_pdf(
    invoice_number: str,
    project_name: str,
    client_name: str,
    client_company: str,
    client_phone: str,
    client_email: str,
    total_cost: float,
    advance_paid: float,
    start_date: str,
    deadline: str,
) -> bytes:
    """
    Generate a branded PDF invoice and return it as bytes.
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=15 * mm, bottomMargin=15 * mm,
    )
    W = A4[0] - 36 * mm  # usable width
    styles = _make_styles()
    elements = []

    # ── HEADER ─────────────────────────────────────────────────────────────────
    today_str = datetime.utcnow().strftime("%d/%m/%Y")

    company_info = (
        '<b><font size="18" color="#0D47A1">Vynker Technologies</font></b><br/>'
        '<font size="8" color="#555555">Udyam Registration No: 10-0132779</font><br/>'
        '<font size="8" color="#555555">Phone: 9742838165</font><br/>'
        '<font size="8" color="#555555">Email: contact@vynkertechnologies.tech</font>'
    )
    invoice_info = (
        f'<font size="28" color="#0D47A1"><b>INVOICE</b></font><br/><br/>'
        f'<font size="10" color="#222222">Invoice No  :  <b>{invoice_number}</b></font><br/>'
        f'<font size="10" color="#222222">Date            :  <b>{today_str}</b></font>'
    )

    header_style_left = ParagraphStyle("hl", fontName="Helvetica", fontSize=10, leading=14)
    header_style_right = ParagraphStyle("hr", fontName="Helvetica", fontSize=10, leading=14, alignment=TA_RIGHT)

    if LOGO_PATH.exists():
        # Enlarge the logo image and ensure transparency is respected (mask='auto')
        logo_img = Image(str(LOGO_PATH), width=55*mm, height=55*mm, kind='proportional', mask='auto')
        header_cols = [logo_img, Paragraph(company_info, header_style_left), Paragraph(invoice_info, header_style_right)]
        col_widths = [W * 0.32, W * 0.38, W * 0.30]
        line_col = 1
    else:
        header_cols = [Paragraph(company_info, header_style_left), Paragraph(invoice_info, header_style_right)]
        col_widths = [W * 0.60, W * 0.40]
        line_col = 0

    header_table = Table([header_cols], colWidths=col_widths)
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEAFTER", (line_col, 0), (line_col, 0), 2, BRAND_BLUE),
        ("RIGHTPADDING", (line_col, 0), (line_col, 0), 12),
        ("LEFTPADDING", (-1, 0), (-1, 0), 12),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 14))

    # ── BILL TO ────────────────────────────────────────────────────────────────
    elements.append(_section_bar("BILL TO:", styles, W))
    elements.append(Spacer(1, 6))

    bill_text = f'<b>{client_name}</b>'
    if client_company:
        bill_text += f'<br/>{client_company}'
    contact_parts = []
    if client_phone:
        contact_parts.append(client_phone)
    if client_email:
        contact_parts.append(client_email)
    if contact_parts:
        bill_text += f'<br/>{" / ".join(contact_parts)}'

    elements.append(Paragraph(bill_text, styles["bill_name"]))
    elements.append(Spacer(1, 12))

    # ── ITEMS TABLE ────────────────────────────────────────────────────────────
    col_widths = [W * 0.08, W * 0.37, W * 0.15, W * 0.20, W * 0.20]

    header_row = [
        Paragraph("S.No", styles["table_header"]),
        Paragraph("Description", styles["table_header"]),
        Paragraph("Quantity", styles["table_header"]),
        Paragraph("Rate", styles["table_header"]),
        Paragraph("Amount", styles["table_header"]),
    ]

    row1 = [
        Paragraph("1", styles["table_cell"]),
        Paragraph(f"Application Development<br/>({project_name})", styles["table_cell_left"]),
        Paragraph("1", styles["table_cell"]),
        Paragraph(_format_inr(total_cost), styles["table_cell"]),
        Paragraph(_format_inr(total_cost), styles["table_cell"]),
    ]

    row2 = [
        Paragraph("2", styles["table_cell"]),
        Paragraph("Maintenance (2 Months – Included)", styles["table_cell_left"]),
        Paragraph("1", styles["table_cell"]),
        Paragraph("Rs. 0", styles["table_cell"]),
        Paragraph("Rs. 0", styles["table_cell"]),
    ]

    items_table = Table(
        [header_row, row1, row2],
        colWidths=col_widths,
        rowHeights=[28, 40, 40],
    )
    items_table.setStyle(TableStyle([
        # Header bg
        ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        # Alternating row colours
        ("BACKGROUND", (0, 1), (-1, 1), LIGHT_GREY),
        ("BACKGROUND", (0, 2), (-1, 2), white),
        # Borders
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_GREY),
        ("BOX", (0, 0), (-1, -1), 1, BRAND_BLUE),
        # Alignment
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        # Padding
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 6))

    # ── TOTALS ─────────────────────────────────────────────────────────────────
    totals_data = [
        [Paragraph("Subtotal", styles["table_cell_left"]),
         Paragraph(_format_inr(total_cost), styles["table_cell"])],
        [Paragraph("<b>Total Amount</b>", styles["table_cell_left"]),
         Paragraph(f"<b>{_format_inr(total_cost)}</b>", styles["table_cell"])],
    ]
    totals_table = Table(
        totals_data,
        colWidths=[W * 0.20, W * 0.20],
        rowHeights=[26, 30],
        hAlign='RIGHT'
    )
    totals_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 1), (-1, 1), HexColor("#E8EAF6")),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_GREY),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_GREY),
        ("LEFTPADDING", (0, 0), (0, -1), 12),
        ("RIGHTPADDING", (1, 0), (1, -1), 0),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 14))

    # ── PAYMENT DETAILS ────────────────────────────────────────────────────────
    elements.append(_section_bar("PAYMENT DETAILS:", styles, W))
    elements.append(Spacer(1, 6))

    pay_rows = [
        ["UPI ID",          ":", PAYMENT_INFO["upi_id"]],
        ["Bank Name",       ":", PAYMENT_INFO["bank_name"]],
        ["Account Number",  ":", PAYMENT_INFO["account_number"]],
        ["IFSC Code",       ":", PAYMENT_INFO["ifsc_code"]],
    ]
    pay_data = []
    for label, sep, val in pay_rows:
        pay_data.append([
            Paragraph(f"<b>{label}</b>", styles["pay_label"]),
            Paragraph(sep, styles["pay_label"]),
            Paragraph(val, styles["pay_value"]),
        ])
    pay_table = Table(pay_data, colWidths=[W * 0.25, W * 0.05, W * 0.40])
    pay_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_GREY),
        ("LEFTPADDING", (0, 0), (0, -1), 10),
    ]))
    elements.append(pay_table)
    elements.append(Spacer(1, 14))

    # ── TERMS & CONDITIONS + SIGNATURE ─────────────────────────────────────────
    elements.append(_section_bar("TERMS & CONDITIONS:", styles, W))
    elements.append(Spacer(1, 6))

    terms_text = ""
    for i, t in enumerate(TERMS, 1):
        terms_text += f"{i}.  {t}<br/>"
    terms_para = Paragraph(terms_text, styles["term"])

    # Signature block
    sign_parts = []
    sign_parts.append(Paragraph("<b>Authorized Signature</b>", styles["sign_name"]))
    sign_parts.append(Spacer(1, 4))
    if SIGNATURE_PATH.exists():
        sign_parts.append(Image(str(SIGNATURE_PATH), width=100, height=45))
    sign_parts.append(Spacer(1, 4))
    sign_parts.append(Paragraph("<b>Tarun kumar</b>", styles["sign_name"]))
    sign_parts.append(Paragraph("(CEO)", styles["sign_title"]))

    # Build a 2-column table for terms + signature side by side
    from reportlab.platypus import KeepTogether

    sign_col_content = []
    for sp in sign_parts:
        sign_col_content.append(sp)

    # We'll use a nested table approach
    inner_sign = Table(
        [[sp] for sp in sign_parts],
        colWidths=[W * 0.35],
    )
    inner_sign_style = [
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]
    name_idx = 4 if SIGNATURE_PATH.exists() else 2
    inner_sign_style.append(("LINEABOVE", (0, name_idx), (-1, name_idx), 0.5, BRAND_DARK))

    inner_sign.setStyle(TableStyle(inner_sign_style))

    bottom_table = Table(
        [[terms_para, inner_sign]],
        colWidths=[W * 0.70, W * 0.30],
    )
    bottom_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (0, 0), 0.5, BORDER_GREY), # Box ONLY around terms (col 0)
        ("ROUNDEDCORNERS", [4, 4, 4, 4]), # rounded corners for the box
        ("LEFTPADDING", (0, 0), (0, 0), 10),
        ("RIGHTPADDING", (0, 0), (0, 0), 10),
        ("TOPPADDING", (0, 0), (0, 0), 8),
        ("BOTTOMPADDING", (0, 0), (0, 0), 8),
        # No padding for signature block to keep it clean
    ]))
    elements.append(bottom_table)

    # ── BUILD ──────────────────────────────────────────────────────────────────
    doc.build(elements)
    return buf.getvalue()

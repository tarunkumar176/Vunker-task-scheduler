from invoice_generator import generate_invoice_pdf
pdf_bytes = generate_invoice_pdf(
    invoice_number="INV-47472",
    project_name="Application Development (Test)",
    client_name="Test",
    client_company="Test tech",
    client_phone="7382099702",
    client_email="test@gmail.com",
    total_cost=1000.0,
    advance_paid=0.0,
    start_date="2026-05-08",
    deadline="2026-06-08"
)
with open(r"C:\Users\vn864\.gemini\antigravity\brain\7cd41ace-5438-4f4e-adcc-9320fb43735f\scratch\test_invoice.pdf", "wb") as f:
    f.write(pdf_bytes)
print("PDF generated successfully.")

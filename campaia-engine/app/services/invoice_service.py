"""
Campaia Engine - Invoice Service

Business logic for generating and managing invoices.
"""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.invoice import Invoice, InvoiceStatus, InvoiceType
from app.models.user import User, UserType
from app.services.pdf_service import PDFService
from app.services.s3_service import s3_service
from app.services.email_service import email_service


class InvoiceService:
    """Service for managing invoices."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_invoice_from_payment(
        self, 
        user: User, 
        amount_total_cents: int, 
        currency: str, 
        stripe_session_id: str, 
        stripe_payment_intent_id: str
    ) -> Invoice:
        """
        Create a new invoice after a successful Stripe payment.
        
        Checks if an invoice for this session already exists to prevent duplicates.
        """
        # 0. Check for existing invoice for this session
        existing = await self.get_invoice_by_session_id(stripe_session_id)
        if existing:
            return existing

        # Convert cents to Decimal
        amount_total = Decimal(str(amount_total_cents)) / Decimal("100")
        
        # 1. Generate Invoice Number (e.g. CMP-2024-0001)
        invoice_number = await self._generate_invoice_number()
        
        # 2. Determine Invoice Type & VAT
        # Individual: Receipt (No VAT deduction usually in our simplified model)
        # Business: Fiscal Invoice (VAT 19% for RO)
        invoice_type = InvoiceType.BUSINESS.value if user.user_type == UserType.BUSINESS.value else InvoiceType.INDIVIDUAL.value
        
        # Romanian VAT is 19% for domestic companies
        # In this first version, we assume all business users are RO-based
        vat_rate = Decimal("0.19") if invoice_type == InvoiceType.BUSINESS.value else Decimal("0")
        
        # Extract VAT from total: VAT = Total - (Total / (1 + Rate))
        if vat_rate > 0:
            vat_amount = (amount_total - (amount_total / (Decimal("1") + vat_rate))).quantize(Decimal("0.01"))
        else:
            vat_amount = Decimal("0.00")
            
        net_amount = amount_total - vat_amount
        
        # 3. Snapshot buyer details (for audit trail, even if user changes profile later)
        buyer_details = {
            "user_id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone or "",
            "address": user.address or "",
            "city": user.city or "",
            "county": user.county or "",
            "country": user.country or "Romania",
        }
        
        if invoice_type == InvoiceType.BUSINESS.value:
            buyer_details.update({
                "company_name": user.company_name or "",
                "cui": user.cui or "",
                "reg_com": user.reg_com or ""
            })

        # 4. Create invoice record
        invoice = Invoice(
            user_id=user.id,
            invoice_number=invoice_number,
            invoice_type=invoice_type,
            status=InvoiceStatus.PAID.value,
            amount=net_amount,
            vat=vat_amount,
            total=amount_total,
            currency=currency.upper(),
            issued_at=datetime.utcnow(),
            stripe_payment_intent_id=stripe_payment_intent_id,
            stripe_session_id=stripe_session_id,
            buyer_details=buyer_details
        )
        
        self.db.add(invoice)
        await self.db.commit()
        await self.db.refresh(invoice)
        
        # Generate and upload PDF automatically
        await self.generate_and_upload_pdf(invoice)
        
        return invoice

    async def generate_and_upload_pdf(self, invoice: Invoice) -> str | None:
        """
        Generate the PDF content for an invoice and upload it to S3.
        """
        # Prepare data for PDF generator
        # Assume one main item: Token Purchase
        invoice_data = {
            "number": invoice.invoice_number,
            "date": invoice.issued_at.strftime("%d.%m.%Y"),
            "type": invoice.invoice_type,
            "buyer": invoice.buyer_details,
            "items": [
                {
                    "name": f"Pachet Token-uri ({invoice.total} {invoice.currency})",
                    "net": float(invoice.amount),
                    "vat": float(invoice.vat),
                    "total": float(invoice.total)
                }
            ],
            "total_net": float(invoice.amount),
            "total_vat": float(invoice.vat),
            "total_total": float(invoice.total),
            "currency": invoice.currency
        }

        try:
            # Generate PDF
            pdf_buffer = PDFService.generate_invoice(invoice_data)
            pdf_content = pdf_buffer.getvalue()
            
            # S3 Key: invoices/{user_id}/{year}/{invoice_number}.pdf
            year = invoice.issued_at.year
            s3_key = f"invoices/{invoice.user_id}/{year}/{invoice.invoice_number}.pdf"
            
            # Upload to S3
            success = s3_service.upload_fileobj(
                pdf_buffer,
                settings.s3_bucket_invoices,
                s3_key,
                content_type="application/pdf"
            )
            
            if success:
                invoice.pdf_s3_key = s3_key
                # Use separate commit to ensure we save the key
                # Note: This is an internal update
                await self.db.commit()
                
                # 4. Send Email with the PDF attached
                await self.send_invoice_email(invoice, pdf_content)
                
                return s3_key
            
            return None
        except Exception as e:
            # TODO: Log error
            print(f"Error generating/uploading PDF for invoice {invoice.invoice_number}: {e}")
            return None

    async def send_invoice_email(self, invoice: Invoice, pdf_content: bytes) -> bool:
        """
        Send the invoice PDF to the user via email.
        """
        user_email = invoice.buyer_details.get("email")
        if not user_email:
            return False
            
        subject = f"Factura ta Campaia - {invoice.invoice_number}"
        
        # Simple HTML template
        body_html = f"""
        <html>
            <body style="font-family: sans-serif; color: #333;">
                <h2 style="color: #4F46E5;">Buna {invoice.buyer_details.get('full_name', '')}!</h2>
                <p>Iti multumim pentru achizitia facuta pe Campaia.</p>
                <p>Plata pentru factura <b>{invoice.invoice_number}</b> in valoare de <b>{invoice.total} {invoice.currency}</b> a fost confirmata cu succes.</p>
                <p>Poti gasi factura atasata acestui email sau o poti descarca oricand din sectiunea <b>Billing</b> a dashboard-ului tau.</p>
                <br>
                <p>Spor la creat campanii!</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #999;">Echipa DEVDELTA SRL</p>
            </body>
        </html>
        """
        
        return await email_service.send_email(
            to_email=user_email,
            subject=subject,
            body_html=body_html,
            attachments=[{
                "filename": f"Factura_{invoice.invoice_number}.pdf",
                "content": pdf_content
            }]
        )

    async def get_invoice_download_url(self, invoice_id: uuid.UUID, user_id: uuid.UUID) -> str | None:
        """
        Get a presigned S3 URL for downloading the invoice PDF.
        """
        invoice = await self.get_invoice_by_id(invoice_id, user_id)
        if not invoice or not invoice.pdf_s3_key:
            return None
            
        return s3_service.generate_presigned_url(
            settings.s3_bucket_invoices,
            invoice.pdf_s3_key
        )

    async def get_invoice_by_session_id(self, session_id: str) -> Invoice | None:
        """Get an invoice by its Stripe session ID."""
        query = select(Invoice).where(Invoice.stripe_session_id == session_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def _generate_invoice_number(self) -> str:
        """
        Generate a unique invoice number in the format CMP-YYYY-XXXX.
        """
        now = datetime.utcnow()
        year = now.year
        prefix = f"CMP-{year}-"
        
        # Find the latest number for this year
        query = select(func.count(Invoice.id)).where(Invoice.invoice_number.like(f"{prefix}%"))
        result = await self.db.execute(query)
        count = result.scalar() or 0
        
        next_sequence = count + 1
        return f"{prefix}{next_sequence:04d}"

    async def get_user_invoices(self, user_id: uuid.UUID) -> list[Invoice]:
        """Get all invoices for a user."""
        query = select(Invoice).where(Invoice.user_id == user_id).order_by(Invoice.issued_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_invoice_by_id(self, invoice_id: uuid.UUID, user_id: uuid.UUID) -> Invoice | None:
        """Get a specific invoice for a user."""
        query = select(Invoice).where(Invoice.id == invoice_id, Invoice.user_id == user_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

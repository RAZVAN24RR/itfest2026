"""
Campaia Engine - Invoice Routes

API endpoints for managing and retrieving user invoices.
"""

from uuid import UUID
from fastapi import APIRouter, HTTPException, status
from app.api.deps import CurrentUser, DbSession
from app.services.invoice_service import InvoiceService
from app.schemas.invoice import InvoiceResponse, InvoiceListResponse

router = APIRouter()


@router.get(
    "", 
    response_model=InvoiceListResponse,
    summary="List user invoices",
    description="Returns a list of all invoices for the authenticated user."
)
async def list_invoices(
    user: CurrentUser, 
    db: DbSession
) -> InvoiceListResponse:
    service = InvoiceService(db)
    invoices = await service.get_user_invoices(user.id)
    
    return InvoiceListResponse(
        items=[InvoiceResponse.model_validate(inv) for inv in invoices],
        total=len(invoices)
    )


@router.get(
    "/{invoice_id}", 
    response_model=InvoiceResponse,
    summary="Get invoice details",
    description="Returns full details of a specific invoice, including a temporary download URL for the PDF."
)
async def get_invoice(
    invoice_id: UUID, 
    user: CurrentUser, 
    db: DbSession
) -> InvoiceResponse:
    service = InvoiceService(db)
    invoice = await service.get_invoice_by_id(invoice_id, user.id)
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
        
    response = InvoiceResponse.model_validate(invoice)
    
    # Generate temporary pre-signed URL for the PDF
    response.pdf_url = await service.get_invoice_download_url(invoice_id, user.id)
    
    return response


@router.get(
    "/{invoice_id}/pdf",
    summary="Get invoice PDF URL",
    description="Returns a temporary pre-signed URL to download the invoice PDF directly."
)
async def get_invoice_pdf_url(
    invoice_id: UUID, 
    user: CurrentUser, 
    db: DbSession
):
    service = InvoiceService(db)
    url = await service.get_invoice_download_url(invoice_id, user.id)
    
    if not url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice PDF link not available. It might still be generating."
        )
        
    return {"url": url}

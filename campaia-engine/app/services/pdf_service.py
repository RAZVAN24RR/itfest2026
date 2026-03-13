"""
Campaia Engine - PDF Service

Generates PDF invoices using ReportLab.
"""

import io
from decimal import Decimal
from typing import Any, Dict

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle


class PDFService:
    """Service for generating PDF documents."""

    @staticmethod
    def generate_invoice(invoice_data: Dict[str, Any]) -> io.BytesIO:
        """
        Generate a professional PDF invoice.
        
        Args:
            invoice_data: Dictionary containing all necessary invoice fields:
                - number: str
                - date: str (formatted)
                - type: str (INDIVIDUAL/BUSINESS)
                - buyer: dict (name, company, address, cui, etc.)
                - items: list of dicts (name, net, vat, total)
                - total_net: Decimal
                - total_vat: Decimal
                - total_total: Decimal
                - currency: str
        
        Returns:
            BytesIO buffer containing the PDF data
        """
        buffer = io.BytesIO()
        # Set margins
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4, 
            rightMargin=2*cm, 
            leftMargin=2*cm, 
            topMargin=1.5*cm, 
            bottomMargin=1.5*cm
        )
        
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'TitleStyle', 
            parent=styles['Heading1'], 
            fontSize=22, 
            spaceAfter=15, 
            textColor=colors.HexColor("#4F46E5"), # Indigo 600
            fontName='Helvetica-Bold'
        )
        
        sub_title_style = ParagraphStyle(
            'SubTitle', 
            parent=styles['Normal'], 
            fontSize=14, 
            leading=18, 
            spaceAfter=10, 
            fontName='Helvetica-Bold',
            textColor=colors.HexColor("#1E293B") # Slate 800
        )
        
        label_style = ParagraphStyle(
            'LabelStyle', 
            parent=styles['Normal'], 
            fontSize=8, 
            leading=10, 
            textColor=colors.grey, 
            textTransform='uppercase',
            fontName='Helvetica-Bold'
        )
        
        content_style = ParagraphStyle(
            'ContentStyle', 
            parent=styles['Normal'], 
            fontSize=10, 
            leading=12,
            textColor=colors.HexColor("#334155") # Slate 700
        )
        
        bold_content_style = ParagraphStyle(
            'BoldContent', 
            parent=content_style, 
            fontName='Helvetica-Bold'
        )

        elements = []

        # --- Header Section (Campaia Info) ---
        elements.append(Paragraph("CAMPAIA", title_style))
        
        # Seller Details (Campaia)
        seller_lines = [
            "<b>DEVDELTA SRL</b>",
            "CUI: RO45678901 | Reg. Com.: J40/1234/2023",
            "Adresa: Str. Inovatiei nr. 10, Bucuresti",
            "Email: billing@campaia.com | Web: campaia.com"
        ]
        for line in seller_lines:
            elements.append(Paragraph(line, content_style))
            
        elements.append(Spacer(1, 1.5*cm))

        # --- Invoice Info & Buyer Info (Two-column layout using a Table) ---
        invoice_title = "FACTURA FISCALA" if invoice_data['type'] == 'BUSINESS' else "FACTURA / CHITANTA"
        
        buyer = invoice_data['buyer']
        buyer_name = buyer.get('company_name') or buyer.get('full_name', 'N/A')
        
        buyer_info = [
            Paragraph("<b>CLIENT:</b>", bold_content_style),
            Paragraph(buyer_name, content_style),
        ]
        
        if buyer.get('cui'):
            buyer_info.append(Paragraph(f"CUI: {buyer['cui']}", content_style))
        if buyer.get('reg_com'):
            buyer_info.append(Paragraph(f"Reg. Com.: {buyer['reg_com']}", content_style))
            
        buyer_info.extend([
            Paragraph(buyer.get('address', ''), content_style),
            Paragraph(f"{buyer.get('city', '')} {buyer.get('county', '')}", content_style),
            Paragraph(buyer.get('country', 'Romania'), content_style)
        ])

        info_table_data = [
            [
                # Left Column: Invoice Details
                [
                    Paragraph(invoice_title, sub_title_style),
                    Paragraph(f"Nr: {invoice_data['number']}", bold_content_style),
                    Paragraph(f"Data: {invoice_data['date']}", content_style),
                    Paragraph(f"Valuta: {invoice_data['currency']}", content_style),
                ],
                # Right Column: Buyer Details
                buyer_info
            ]
        ]
        
        info_table = Table(info_table_data, colWidths=[9*cm, 8*cm])
        info_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ]))
        elements.append(info_table)
        
        elements.append(Spacer(1, 1.5*cm))

        # --- Items Table ---
        table_data = [
            [
                Paragraph("<b>DESCRIERE PRODUS / SERVICIU</b>", label_style),
                Paragraph("<b>CANT.</b>", label_style),
                Paragraph("<b>NET</b>", label_style),
                Paragraph("<b>TVA</b>", label_style),
                Paragraph("<b>TOTAL</b>", label_style)
            ]
        ]
        
        # Add items
        for item in invoice_data['items']:
            table_data.append([
                Paragraph(item['name'], content_style),
                "1",
                f"{item['net']:.2f}",
                f"{item['vat']:.2f}",
                f"{item['total']:.2f}"
            ])
            
        # Spacer row
        table_data.append(["", "", "", "", ""])

        # Totals
        currency = invoice_data['currency']
        table_data.append([
            "", 
            "", 
            Paragraph("<b>TOTAL NET:</b>", content_style), 
            "", 
            Paragraph(f"<b>{invoice_data['total_net']:.2f} {currency}</b>", bold_content_style)
        ])
        table_data.append([
            "", 
            "", 
            Paragraph("<b>TOTAL TVA:</b>", content_style), 
            "", 
            Paragraph(f"<b>{invoice_data['total_vat']:.2f} {currency}</b>", bold_content_style)
        ])
        
        total_total_cell = [
            Paragraph("TOTAL DE PLATA", ParagraphStyle('TotalLabel', parent=bold_content_style, fontSize=12, textColor=colors.white)),
        ]
        total_total_value = [
            Paragraph(f"{invoice_data['total_total']:.2f} {currency}", ParagraphStyle('TotalValue', parent=bold_content_style, fontSize=12, textColor=colors.white, alignment=2)),
        ]

        # Use a secondary table for the big final total box? Or just style the main one.
        # Let's style the main one.
        
        t = Table(table_data, colWidths=[8.5*cm, 1.5*cm, 2.3*cm, 2.3*cm, 2.4*cm])
        
        # Base table styling
        style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F8FAFC")),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor("#E2E8F0")),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ])
        
        # Add alternating row colors (subtle)
        for i in range(1, len(invoice_data['items']) + 1):
            if i % 2 == 0:
                style.add('BACKGROUND', (0, i), (-1, i), colors.HexColor("#FDFDFD"))
        
        # Style for the total total row
        last_row = len(table_data)
        # We'll actually add one more row for the "colored" total
        t.setStyle(style)
        elements.append(t)
        
        elements.append(Spacer(1, 0.5*cm))
        
        # Big Total Background
        final_total_data = [
            [
                Paragraph("TOTAL GENERAL", ParagraphStyle('FinalTotal', parent=bold_content_style, fontSize=14, textColor=colors.white)),
                Paragraph(f"{invoice_data['total_total']:.2f} {currency}", ParagraphStyle('FinalTotalVal', parent=bold_content_style, fontSize=14, textColor=colors.white, alignment=2))
            ]
        ]
        ft = Table(final_total_data, colWidths=[11.5*cm, 5.5*cm])
        ft.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#4F46E5")),
            ('ROUNDEDCORNER', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('RIGHTPADDING', (0, 0), (-1, -1), 15),
        ]))
        elements.append(ft)

        elements.append(Spacer(1, 2*cm))

        # --- Footer ---
        footer_style = ParagraphStyle(
            'FooterStyle', 
            parent=styles['Normal'], 
            fontSize=8, 
            leading=10, 
            textColor=colors.grey, 
            alignment=1
        )
        
        elements.append(Paragraph("Va multumim pentru colaborare!", bold_content_style))
        elements.append(Paragraph("Aceasta factura este generata automat si este valabila fara semnatura si stampila conform legii 227/2015 privind Codul Fiscal.", footer_style))
        
        # Build document
        doc.build(elements)
        buffer.seek(0)
        return buffer

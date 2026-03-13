"""
Campaia Engine - Email Service

Handles sending emails via SMTP asynchronously.
"""

import os
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
from app.core.config import settings


class EmailService:
    """Service for sending emails."""

    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        body_html: str,
        attachments: list[dict[str, any]] | None = None
    ) -> bool:
        """
        Send an email asynchronously.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body_html: HTML content of the email
            attachments: List of dicts with 'filename' and 'content' (bytes)
            
        Returns:
            True if successful, False otherwise
        """
        message = MIMEMultipart()
        message["From"] = f"{settings.mail_from_name} <{settings.mail_from}>"
        message["To"] = to_email
        message["Subject"] = subject

        # Add HTML body
        message.attach(MIMEText(body_html, "html"))

        # Add attachments
        if attachments:
            for attachment in attachments:
                part = MIMEApplication(attachment["content"])
                part.add_header(
                    "Content-Disposition",
                    "attachment",
                    filename=attachment["filename"]
                )
                message.attach(part)

        try:
            # Connect and send
            await aiosmtplib.send(
                message,
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                username=settings.smtp_user,
                password=settings.smtp_password,
                use_tls=settings.smtp_tls,
            )
            return True
        except Exception as e:
            # In development, we might not have a working SMTP server
            # Log the error but don't crash
            print(f"Failed to send email to {to_email}: {e}")
            return False


email_service = EmailService()

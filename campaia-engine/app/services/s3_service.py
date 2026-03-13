"""
Campaia Engine - S3 Service

Handles file operations with AWS S3 or LocalStack.
"""

import io
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings


class S3Service:
    """Service for interacting with AWS S3."""

    def __init__(self):
        # Initialize the S3 client using settings
        # In development, endpoint_url points to LocalStack
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region,
            endpoint_url=settings.aws_endpoint_url,
        )

    def upload_fileobj(
        self, 
        file_obj: io.BytesIO, 
        bucket: str, 
        key: str, 
        content_type: str = "application/octet-stream"
    ) -> bool:
        """
        Upload a file object to S3.
        
        Args:
            file_obj: The file content as a BytesIO buffer
            bucket: Target bucket name
            key: Target file key (path)
            content_type: MIME type of the file
            
        Returns:
            True if upload was successful, False otherwise
        """
        try:
            self._ensure_bucket_exists(bucket)
            self.s3_client.upload_fileobj(
                file_obj,
                bucket,
                key,
                ExtraArgs={"ContentType": content_type}
            )
            return True
        except Exception as e:
            # TODO: Log this properly
            print(f"S3 Upload Error: {e}")
            return False

    def _ensure_bucket_exists(self, bucket: str) -> None:
        """Ensure that a bucket exists, create it if it doesn't (mostly for LocalStack)."""
        try:
            self.s3_client.head_bucket(Bucket=bucket)
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code')
            if error_code == '404':
                try:
                    self.s3_client.create_bucket(
                        Bucket=bucket,
                        CreateBucketConfiguration={
                            'LocationConstraint': settings.aws_region
                        }
                    )
                    print(f"Created bucket: {bucket}")
                except Exception as create_e:
                    print(f"Error creating bucket {bucket}: {create_e}")
            else:
                print(f"Error checking bucket {bucket}: {e}")
        except Exception as e:
            print(f"Unexpected error checking bucket {bucket}: {e}")

    def generate_presigned_url(
        self, 
        bucket: str, 
        key: str, 
        expiration: int = 3600
    ) -> str | None:
        """
        Generate a presigned URL for temporary access to a private S3 object.
        
        Args:
            bucket: Bucket name
            key: File key
            expiration: Time in seconds until the URL expires
            
        Returns:
            The presigned URL string or None if error
        """
        try:
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket, "Key": key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            print(f"S3 Presigned URL Error: {e}")
            return None

    def delete_file(self, bucket: str, key: str) -> bool:
        """Delete a file from S3."""
        try:
            self.s3_client.delete_object(Bucket=bucket, Key=key)
            return True
        except ClientError as e:
            print(f"S3 Delete Error: {e}")
            return False


# Singleton instance
s3_service = S3Service()

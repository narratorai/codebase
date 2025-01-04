terraform {
  backend "s3" {
    bucket = "479493230127-narrator-iac"
    key    = ""
    region = "us-east-1"
  }
}

provider "aws" {
  region = "eu-west-1"
}

resource "aws_kms_key" "key" {
  description             = "Encryption key for ${var.company_slug} data stored in dedicated resources"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    VantaOwner        = "ahmed@narrator.ai"
  }
}

resource "aws_kms_alias" "key_alias" {
  name          = "alias/narrator-company/${var.company_slug}"
  target_key_id = aws_kms_key.key.key_id
}

resource "aws_s3_bucket" "bucket" {
  bucket = "narratorai-company-${var.company_slug}"

  tags = {
    VantaOwner        = "ahmed@narrator.ai"
  }
}

resource "aws_s3_bucket_ownership_controls" "this" {
  bucket = aws_s3_bucket.bucket.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "this" {
  depends_on = [aws_s3_bucket_ownership_controls.this]
  bucket     = aws_s3_bucket.bucket.id
  acl        = "private"
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}


resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  bucket = aws_s3_bucket.bucket.id

  rule {
    id     = "abort-incomplete-multipart"
    status = "Enabled"
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  rule {
    id     = "transition-expire-noncurrent"
    status = "Enabled"
    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "ONEZONE_IA"
    }
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }

  rule {
    id     = "expire-temp"
    status = "Enabled"
    expiration {
      days = 1
    }
    filter {
      prefix = "temp"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "this" {
  bucket = aws_s3_bucket.bucket.id

  cors_rule {
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
  }
}




resource "aws_iam_policy" "read_policy" {
  description = "Grants access to ${var.company_slug} encrypted data"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "AllowDecryptKMS"
        Effect   = "Allow"
        Action   = ["kms:Decrypt", "kms:DescribeKey"]
        Resource = [aws_kms_key.key.arn]
      },
      {
        Sid      = "AllowReadS3"
        Effect   = "Allow"
        Action   = ["s3:GetBucketLocation", "s3:GetObject", "s3:ListBucket", "s3:ListBucketMultipartUploads"]
        Resource = [aws_s3_bucket.bucket.arn, "${aws_s3_bucket.bucket.arn}/*"]
      },
    ]
  })
}

resource "aws_iam_policy" "write_policy" {
  description = "Grants write to ${var.company_slug} encrypted data"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "AllowEncryptKMS"
        Effect   = "Allow"
        Action   = ["kms:Encrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:DescribeKey"]
        Resource = [aws_kms_key.key.arn]
      },
      {
        Sid      = "AllowWriteS3"
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:DeleteObject", "s3:AbortMultipartUpload", "s3:ListMultipartUploadParts"]
        Resource = [aws_s3_bucket.bucket.arn, "${aws_s3_bucket.bucket.arn}/*"]
      },
    ]
  })
}

resource "aws_iam_role" "role" {
  name = "narrator-company-${var.company_slug}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = ""
        Effect    = "Allow"
        Principal = { AWS = "*" }
        Action    = "sts:AssumeRole"
      },
    ]
  })

  managed_policy_arns = [
    aws_iam_policy.read_policy.arn,
    aws_iam_policy.write_policy.arn,
  ]
}

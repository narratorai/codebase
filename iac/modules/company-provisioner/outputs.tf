output "key_arn" {
  value = aws_kms_key.key.arn
}

output "bucket_name" {
  value = aws_s3_bucket.bucket.id
}

output "role_arn" {
  value = aws_iam_role.role.arn
}

output "read_arn" {
  description = "The read ARN assigned by AWS to this policy"
  value       = aws_iam_policy.read_policy.arn
}

output "write_arn" {
  description = "The write ARN assigned by AWS to this policy"
  value       = aws_iam_policy.write_policy.arn
}
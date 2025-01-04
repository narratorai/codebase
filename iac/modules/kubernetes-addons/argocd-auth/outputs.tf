output "iam_role_arn" {
  description = "Spoke Role ARN"
  value       = aws_iam_role.spoke_role.arn
}

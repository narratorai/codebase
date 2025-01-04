locals {
  name                 = "aws-cloudwatch-metrics"
  namespace            = "monitoring"
  service_account_name = "cloudwatch-agent"

  irsa_config = {
    kubernetes_namespace              = local.namespace
    kubernetes_service_account        = local.service_account_name
    create_kubernetes_namespace       = false
    create_kubernetes_service_account = true
    irsa_iam_policies                 = concat(["arn:${var.addon_context.aws_partition_id}:iam::aws:policy/CloudWatchAgentServerPolicy"], var.irsa_policies)
  }

  argocd_gitops_config = {
    enable             = true
    serviceAccountName = local.service_account_name
  }
}
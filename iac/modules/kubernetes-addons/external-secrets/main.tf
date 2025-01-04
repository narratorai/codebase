locals {
  name            = "external-secrets"
  namespace = "external-secrets"
  service_account = "external-secrets-sa"

  irsa_config = {
    kubernetes_namespace                = local.namespace
    kubernetes_service_account          = local.service_account
    create_kubernetes_namespace         = try(local.namespace, true)
    create_kubernetes_service_account   = true
    irsa_iam_policies                   = concat([aws_iam_policy.external_secrets.arn], var.irsa_policies)
  }

  argocd_gitops_config = {
    enable             = true
    serviceAccountName = local.service_account
  }
}

resource "aws_iam_policy" "external_secrets" {
  name        = "${var.addon_context.eks_cluster_id}-${local.name}-irsa"
  path        = var.addon_context.irsa_iam_role_path
  description = "Provides permissions to for External Secrets to retrieve secrets from AWS SSM and AWS Secrets Manager"
  policy      = data.aws_iam_policy_document.external_secrets.json
}
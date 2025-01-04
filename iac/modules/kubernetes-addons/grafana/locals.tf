locals {
  name            = "grafana"
  namespace       = "monitoring"
  service_account = "${local.name}-sa"

  argocd_gitops_config = {
    enable             = true
    serviceAccountName = local.service_account
  }
  irsa_config = {
    kubernetes_namespace              = local.namespace
    kubernetes_service_account        = local.service_account
    create_kubernetes_namespace       = false
    create_kubernetes_service_account = true
    irsa_iam_policies                 = concat([aws_iam_policy.grafana.arn], var.irsa_policies)
  }
}
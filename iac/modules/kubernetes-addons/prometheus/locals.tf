locals {
  name             = "prometheus"
  namespace_name   = local.name
  create_namespace = true
  namespace        = kubernetes_namespace_v1.prometheus[0].metadata[0].name


  workspace_url          = var.amazon_prometheus_workspace_endpoint != null ? "${var.amazon_prometheus_workspace_endpoint}api/v1/remote_write" : ""
  ingest_service_account = "amp-ingest"
  ingest_iam_role_arn    = var.enable_amazon_prometheus ? module.irsa_amp_ingest[0].irsa_iam_role_arn : ""

  argocd_gitops_config = {
    enable             = true
    roleArn            = local.ingest_iam_role_arn
    ampWorkspaceUrl    = local.workspace_url
    serviceAccountName = local.ingest_service_account
  }
}


resource "kubernetes_namespace_v1" "prometheus" {
  count = local.create_namespace ? 1 : 0

  metadata {
    name = local.namespace_name
  }
}

resource "aws_iam_policy" "ingest" {
  count = var.enable_amazon_prometheus ? 1 : 0

  name        = format("%s-%s", "amp-ingest", var.addon_context.eks_cluster_id)
  description = "Set up the permission policy that grants ingest (remote write) permissions for AMP workspace"
  policy      = data.aws_iam_policy_document.ingest.json
  tags        = var.addon_context.tags
}

module "irsa_amp_ingest" {
  source = "../irsa"

  count = var.enable_amazon_prometheus ? 1 : 0

  create_kubernetes_namespace = false
  kubernetes_namespace        = local.namespace_name

  kubernetes_service_account    = local.ingest_service_account
  irsa_iam_policies             = [try(aws_iam_policy.ingest[0].arn, "")]
  irsa_iam_role_path            = var.addon_context.irsa_iam_role_path
  irsa_iam_permissions_boundary = var.addon_context.irsa_iam_permissions_boundary
  eks_cluster_id                = var.addon_context.eks_cluster_id
  eks_oidc_provider_arn         = var.addon_context.eks_oidc_provider_arn
}



resource "aws_iam_policy" "query" {
  count = var.enable_amazon_prometheus ? 1 : 0

  name        = format("%s-%s", "amp-query", var.addon_context.eks_cluster_id)
  description = "Set up the permission policy that grants query permissions for AMP workspace"
  policy      = data.aws_iam_policy_document.query.json
  tags        = var.addon_context.tags
}

module "irsa_amp_query" {
  source = "../irsa"

  count = var.enable_amazon_prometheus ? 1 : 0

  create_kubernetes_namespace = false
  kubernetes_namespace        = local.namespace_name

  kubernetes_service_account    = "amp-query"
  irsa_iam_policies             = [aws_iam_policy.query[0].arn]
  irsa_iam_role_path            = var.addon_context.irsa_iam_role_path
  irsa_iam_permissions_boundary = var.addon_context.irsa_iam_permissions_boundary
  eks_cluster_id                = var.addon_context.eks_cluster_id
  eks_oidc_provider_arn         = var.addon_context.eks_oidc_provider_arn
}
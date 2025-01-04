locals {
  name = "aws-ebs-csi-driver"
  namespace       =  "kube-system"
  service_account =  "ebs-csi-controller-sa"
}

data "aws_eks_addon_version" "this" {
  addon_name = local.name
  kubernetes_version = var.addon_config.kubernetes_version
  most_recent        = try(var.addon_config.most_recent, false)
}

resource "aws_eks_addon" "aws_ebs_csi_driver" {
  count                    = var.enable_amazon_eks_aws_ebs_csi_driver ? 1 : 0
  cluster_name             = var.addon_context.eks_cluster_id
  addon_name               = local.name
  addon_version            = try(var.addon_config.addon_version, data.aws_eks_addon_version.this.version)
  resolve_conflicts        = try(var.addon_config.resolve_conflicts, "OVERWRITE")
  service_account_role_arn = module.irsa_addon.irsa_iam_role_arn
  preserve                 = try(var.addon_config.preserve, true)
  configuration_values     = try(var.addon_config.configuration_values, null)

  tags = merge(
    var.addon_context.tags,
    try(var.addon_config.tags, {})
  )
}

module "irsa_addon" {
  source = "../irsa"
  create_kubernetes_namespace       = false
  create_kubernetes_service_account = false
  kubernetes_namespace              = local.namespace
  kubernetes_service_account        = local.service_account
  irsa_iam_policies                 = concat([aws_iam_policy.aws_ebs_csi_driver.arn], lookup(var.addon_config, "additional_iam_policies", []))
  irsa_iam_role_path                = var.addon_context.irsa_iam_role_path
  irsa_iam_permissions_boundary     = var.addon_context.irsa_iam_permissions_boundary
  eks_cluster_id                    = var.addon_context.eks_cluster_id
  eks_oidc_provider_arn             = var.addon_context.eks_oidc_provider_arn
}

resource "aws_iam_policy" "aws_ebs_csi_driver" {
  name        = "${var.addon_context.eks_cluster_id}-aws-ebs-csi-driver-irsa"
  description = "IAM Policy for AWS EBS CSI Driver"
  path        = try(var.addon_context.irsa_iam_role_path, null)
  policy      = data.aws_iam_policy_document.aws_ebs_csi_driver.json

  tags = merge(
    var.addon_context.tags,
    try(var.addon_config.tags, {})
  )
}
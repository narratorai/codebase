module "argocd_irsa" {
  source = "github.com/aws-ia/terraform-aws-eks-blueprints-addons//modules/eks-blueprints-addon?ref=3e64d809ac9dbc89aee872fe0f366f0b757d3137" # TODO: Last update to hash 04=3/31/2023

  create_release             = false
  create_role                = true
  role_name_use_prefix       = false
  role_name                  = "${var.eks_cluster_id}-argocd-hub"
  assume_role_condition_test = "StringLike"
  role_policies = {
    ArgoCD_EKS_Policy = aws_iam_policy.irsa_policy.arn
  }
  oidc_providers = {
    this = {
      provider_arn    = var.oidc_provider_arn
      namespace       = "argocd"
      service_account = "argocd-*"
    }
  }
}

resource "aws_iam_policy" "irsa_policy" {
  name        = "${var.eks_cluster_id}-argocd-irsa"
  description = "IAM Policy for ArgoCD Hub"
  policy      = data.aws_iam_policy_document.irsa_policy.json
}

data "aws_iam_policy_document" "irsa_policy" {
  statement {
    effect    = "Allow"
    resources = ["*"]
    actions   = ["sts:AssumeRole"]
  }
}
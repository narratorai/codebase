terraform {
  source = "../../../../../../modules/kubernetes-addons/argocd-role"
}

include {
  path = find_in_parent_folders()
}

dependency "eks" {
  config_path = "../eks"
}



locals {
  # Automatically load environment-level variables
  env_vars = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  # Extract out common variables for reuse
  eks_cluster_id = local.env_vars.locals.eks_cluster_id
  region_vars    = read_terragrunt_config(find_in_parent_folders("region.hcl"))
}

inputs = {
  eks_cluster_id = local.eks_cluster_id
  oidc_provider_arn = dependency.eks.outputs.oidc_provider_arn
}

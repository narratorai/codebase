terraform {
  source = "../../../../../../../modules/kubernetes-addons/argocd-auth"
}

include {
  path = find_in_parent_folders()
}

dependency "eks" {
  config_path = "../../../../../../eu-west-1/prod/kubernetes-clusters/prod-eu/eks/"
}


locals {
  # Automatically load environment-level variables
  env_vars = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  # Extract out common variables for reuse
  eks_cluster_id = local.env_vars.locals.eks_cluster_id
  region_vars    = read_terragrunt_config(find_in_parent_folders("region.hcl"))
}

inputs = {
  hub_cluster_name  = local.eks_cluster_id
  eks_cluster_id = dependency.eks.outputs.cluster_name
  eks_cluster_endpoint = dependency.eks.outputs.cluster_endpoint
  aws_region = "eu-west-1"
  project_name = "prod-eu"
  eks_cluster_certificate_authority_data = dependency.eks.outputs.cluster_certificate_authority_data
}

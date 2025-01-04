terraform {
  source = "../../../../../../../modules/kubernetes-addons/"
}

include {
  path = find_in_parent_folders()
}

dependency "eks" {
  config_path = "../../eks"
}

dependency "route53" {
  config_path = "../../../../route53/mgmt.narrator.ai/zone/"
}


locals {
  # Automatically load environment-level variables
  env_vars = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  # Extract out common variables for reuse
  eks_cluster_id = local.env_vars.locals.eks_cluster_id
  region_vars    = read_terragrunt_config(find_in_parent_folders("region.hcl"))
}

inputs = {
  eks_cluster_id                 = dependency.eks.outputs.cluster_name
  external_dns_route53_zone_arns = ["arn:aws:route53:::hostedzone/Z05330031UYLEZKST0Z1G"]
  argocd_applications = {
    addons = {
      path                = "argocd/platform/chart"
      target_revision     = "poc" #TODO we need to change it
      repo_url            = "git@github.com:narratorai/platform-iac.git"
      add_on_application  = true
      ssh_key_secret_name = "argocd-ssh" # Needed for private repos
      insecure            = true
    },
    monitoring-mgmt = {
      path                = "argocd/monitoring/k8s-monitoring"
      namespace           = "argocd"
      target_revision     = "poc" #TODO we need to change it
      repo_url            = "git@github.com:narratorai/platform-iac.git"
      add_on_application  = true
      ssh_key_secret_name = "argocd-ssh" # Needed for private repos
      insecure            = true
      values              = {
        destinationServer = dependency.eks.outputs.cluster_endpoint
        # Indicates the location where ArgoCD is installed, in this case hub cluster
        argoNamespace     = "argocd"                      # Namespace to create ArgoCD
        argoProject       = "argocd"                      # Argo Project
        spec              = {
          destination = {
            server = dependency.eks.outputs.cluster_endpoint# Indicates the location of
          }
          source = {
            repoURL        = "git@github.com:narratorai/platform-iac.git"
            targetRevision = "poc" #TODO change to main once git repo is updated
          }
        }
      }
    }
  }
  enable_aws_load_balancer_controller  = true
  enable_aws_cloudwatch_metrics        = true
  enable_amazon_eks_aws_ebs_csi_driver = true
  enable_aws_node_termination_handler  = true
  enable_external_dns                  = true
  enable_external_secrets              = true
  enable_metrics_server                = true
  enable_grafana                       = false
  enable_karpenter                     = true
  enable_amazon_prometheus             = false
  enable_prometheus                    = false
  enable_thanos                        = false
  enable_argo_rollout                  = true
  enable_argo_workflow                 = true
  enable_argocd_image_updater          = true
  enable_reloader                      = true
  enable_k8s_monitoring                = true
}


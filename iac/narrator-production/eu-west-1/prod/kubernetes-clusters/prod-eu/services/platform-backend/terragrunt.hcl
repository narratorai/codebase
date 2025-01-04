terraform {
  source = "../../../../../../../modules/kubernetes-addons/"
}

include {
  path = find_in_parent_folders()
}

dependency "eks" {
  config_path = "../../eks"
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
  external_dns_route53_zone_arns = ["arn:aws:route53:::hostedzone/Z011793229UAGT1EB1ZIN"]
  argocd_install = false
  argocd_applications = {
    prod-eu-addons = {
      path                = "argocd/platform/chart"
      project             = "prod-eu"
      namespace           = "argocd"
      values = {
        destinationServer = dependency.eks.outputs.cluster_endpoint
        # Indicates the location where ArgoCD is installed, in this case hub cluster
        argoNamespace     = "argocd"                      # Namespace to create ArgoCD Apps
        argoProject       = "prod-eu"                      # Argo Project
        spec              = {
          destination = {
            server = dependency.eks.outputs.cluster_endpoint# Indicates the location of the remote cluster to deploy Apps
          }
          source = {
            repoURL        = "git@github.com:narratorai/platform-iac.git"
            targetRevision = "poc" #TODO change to main once git repo is updated
          }
        }
      }
      target_revision     = "poc" #TODO we need to change it
      repo_url            = "git@github.com:narratorai/platform-iac.git"
      add_on_application  = true
      #      ssh_key_secret_name = "argocd-ssh" # Needed for private repos
      destination         = dependency.eks.outputs.cluster_endpoint
      insecure            = true
    },
    workloads = {
      path                = "argocd/backend/prod-eu"
      project             = "prod-eu"
      namespace           = "argocd"
      target_revision     = "poc" #TODO we need to change it
      repo_url            = "git@github.com:narratorai/platform-iac.git"
      destination         = dependency.eks.outputs.cluster_endpoint
      insecure            = true
      values = {
        destinationServer = dependency.eks.outputs.cluster_endpoint
        # Indicates the location where ArgoCD is installed, in this case hub cluster
        argoNamespace     = "argocd"                       # Namespace to create ArgoCD
        argoProject       = "prod-eu"                      # Argo Project
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
  enable_karpenter                     = true
  enable_amazon_prometheus             = false
  enable_prometheus                    = false
  enable_reloader                      = true
  zone_id_filter                       = "Z011793229UAGT1EB1ZIN"
}

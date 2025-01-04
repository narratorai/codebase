terraform_version_constraint  = ">= 1.3.9"
terragrunt_version_constraint = ">= 0.44.0"

locals {
  # Automatically load account-level variables
  account_vars = try(read_terragrunt_config(find_in_parent_folders("account.hcl")), { locals = { account_name = "", aws_account_id = "" } })

  # Automatically load region-level variables
  region_vars = try(read_terragrunt_config(find_in_parent_folders("region.hcl")), { locals = { aws_region = "" } })

  # Automatically load environment-level variables
  environment_vars = try(read_terragrunt_config(find_in_parent_folders("env.hcl")), { locals = { name = "", eks_cluster_id = "" } })

  # Defines which providers should be loaded
  provider_switches = try(read_terragrunt_config(find_in_parent_folders("provider_switches.hcl")), { locals = { include_aws = true, include_eks = false, include_helm = false, include_multi_k8s = false } })

  # Extract the variables we need for easy access
  account_name   = local.account_vars.locals.account_name
  account_id     = local.account_vars.locals.aws_account_id
  aws_region     = local.region_vars.locals.aws_region
  name           = local.environment_vars.locals.name
  eks_cluster_id = local.environment_vars.locals.eks_cluster_id
}

# Generate an AWS provider block
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
%{if local.provider_switches.locals.include_aws}
provider "aws" {
  region = "${local.aws_region}"
  # Only these AWS Account IDs may be operated on by this template
  allowed_account_ids = ["${local.account_id}"]
}
%{endif}
%{if local.provider_switches.locals.include_eks}
provider "kubernetes" {
  host                   = aws_eks_cluster.this[0].endpoint
  cluster_ca_certificate = base64decode(aws_eks_cluster.this[0].certificate_authority.0.data)
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", aws_eks_cluster.this[0].id]
  }
}
%{endif}
%{if local.provider_switches.locals.include_helm}
data "aws_eks_cluster" "cluster" {
  name  = "${local.eks_cluster_id}"
}
data "aws_eks_cluster_auth" "cluster" {
  name  = "${local.eks_cluster_id}"
}
provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.cluster.endpoint 
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority.0.data)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      args        = ["eks", "get-token", "--cluster-name", "${local.eks_cluster_id}"]
      command     = "aws"
    }
  }
}
provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint 
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority.0.data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}
%{endif}
%{if local.provider_switches.locals.include_multi_k8s}

provider "aws" {
  region = "${local.aws_region}"
}

provider "aws" {
  region  = "us-east-1"
  alias   = "hub"
}

data "aws_eks_cluster" "cluster" {
  name  = "${local.eks_cluster_id}"
}
data "aws_eks_cluster_auth" "cluster" {
  name  = "${local.eks_cluster_id}"
}
provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.cluster.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority.0.data)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      args        = ["eks", "get-token", "--cluster-name", "${local.eks_cluster_id}"]
      command     = "aws"
    }
  }
}
provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority.0.data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

data "aws_eks_cluster" "hub" {
  name  = "mgmt"
  provider = aws.hub
}

data "aws_eks_cluster_auth" "hub" {
  name  = "mgmt"
  provider = aws.hub
}

provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.hub.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.hub.certificate_authority.0.data)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      args        = ["eks", "get-token", "--cluster-name", "mgmt"]
      command     = "aws"
    }
  }
  alias = "hub"
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.hub.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.hub.certificate_authority.0.data)
  token                  = data.aws_eks_cluster_auth.hub.token
  alias = "hub"
}

%{endif}
EOF
}

# Configure Terragrunt to automatically store tfstate files in an S3 bucket
remote_state {
  backend = "s3"
  config = {
    encrypt        = true
    bucket         = "${local.account_id}-narrator-iac"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    s3_bucket_tags = {
      owner = "Narrator"
      name  = "Terraform state storage"
    }
  }
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
}


# ---------------------------------------------------------------------------------------------------------------------
# GLOBAL PARAMETERS
# These variables apply to all configurations in this subfolder. These are automatically merged into the child
# `terragrunt.hcl` config via the include block.
# ---------------------------------------------------------------------------------------------------------------------

# Configure root level variables that all resources can inherit. This is especially helpful with multi-account configs
# where terraform_remote_state data sources are placed directly into the modules.
inputs = merge(
  local.account_vars.locals,
  local.region_vars.locals,
  local.environment_vars.locals,
  {
    eks_cluster_id = local.eks_cluster_id
    name           = local.name
  }
)
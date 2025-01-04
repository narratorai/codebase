terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-eks?ref=v19.21.0"
}

include {
  path = find_in_parent_folders()
}

dependency "vpc" {
  config_path = "../../../network/vpc/"
}

locals {
  # Automatically load environment-level variables
  env_vars = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  # Extract out common variables for reuse
  eks_cluster_id = local.env_vars.locals.eks_cluster_id
}

inputs = {
  cluster_name    = local.eks_cluster_id
  subnet_ids      = dependency.vpc.outputs.private_subnets
  vpc_id          = dependency.vpc.outputs.vpc_id
  enable_irsa     = true
  cluster_version = "1.30"
  # Self managed node groups will not automatically create the aws-auth configmap so we need to
  create_aws_auth_configmap = true
  manage_aws_auth_configmap = true
  cluster_endpoint_public_access  = false
  self_managed_node_group_defaults = {
    # enable discovery of autoscaling groups by cluster-autoscaler
    autoscaling_group_tags = {
      "k8s.io/cluster-autoscaler/enabled" : true,
      "k8s.io/cluster-autoscaler/${local.eks_cluster_id}" : "owned",
    }
  }

  aws_auth_roles = [{
      rolearn  = "arn:aws:iam::479493230127:role/prod-eu"
      username = "gitops-role"
      groups   = ["system:masters"]
    }]

  aws_auth_users = [
  {
      userarn  = "arn:aws:iam::479493230127:user/ahmed"
      username = "ahmed"
      groups   = ["system:masters"]
  },
  {
      userarn  = "arn:aws:iam::479493230127:user/josue"
      username = "josue"
      groups   = ["system:masters"]
  },
  {
      userarn  = "arn:aws:iam::479493230127:user/minu"
      username = "minu"
      groups   = ["system:masters"]
  }
]

  cluster_security_group_additional_rules = {
    egress_nodes_ephemeral_ports_tcp = {
      description                = "All protocols"
      protocol                   = "tcp"
      from_port        = 0
      to_port          = 65535
      type                       = "ingress"
      cidr_blocks      = ["0.0.0.0/0"]
    }
  }

  # Extend node-to-node security group rules
  node_security_group_additional_rules = {
    ingress_self_all = {
      description = "Node to node all ports/protocols"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "ingress"
      cidr_blocks      = ["0.0.0.0/0"]
      ipv6_cidr_blocks = ["::/0"]
    }
    egress_all = {
      description      = "Node all egress"
      protocol         = "-1"
      from_port        = 0
      to_port          = 0
      type             = "egress"
      cidr_blocks      = ["0.0.0.0/0"]
      ipv6_cidr_blocks = ["::/0"]
    }
  }


  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
  }

  self_managed_node_groups = {
    blue = {
      name = "blue"
      
      min_size                 = 1
      max_size                 = 10
      desired_size             = 4
      create_iam_role          = true
      iam_role_name            = "${local.eks_cluster_id}-blue"
      iam_role_use_name_prefix = false
      iam_role_description     = "Self managed blue node group complete example role"

      iam_role_additional_policies = {
        AmazonEC2ContainerRegistryReadOnly = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
      }

      use_mixed_instances_policy = true
      mixed_instances_policy = {
        instances_distribution = {
          on_demand_base_capacity                  = 0
          on_demand_percentage_above_base_capacity = 0
          spot_allocation_strategy                 = "capacity-optimized"
        }

        override = [
          {
            instance_type     = "m7i.large"
            weighted_capacity = "1"
          },
          {
            instance_type     = "c7i.large"
            weighted_capacity = "2"
          },
          {
            instance_type     = "r7i.large"
            weighted_capacity = "2"
          },
        ]
      }
      bootstrap_extra_args = "--kubelet-extra-args '--node-labels=node.kubernetes.io/lifecycle=spot'"
    }
  }
  tags = {
    VantaContainsUserData = "false"
    VantaDescription      = "Narrator Mgmt EKS cluster"
    VantaNonProd          = "false"
    VantaOwner            = "ahmed@narrator.ai"
  }
}

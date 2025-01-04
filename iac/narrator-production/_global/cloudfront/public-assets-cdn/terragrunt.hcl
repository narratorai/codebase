terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-cloudfront.git?ref=v3.2.0"
}

include "root" {
  path = find_in_parent_folders()
}

inputs = {
  aliases = ["assets.narrator.ai"]

  comment                       = "Public Static Assets CDN"
  enabled                       = true
  is_ipv6_enabled               = true
  price_class                   = "PriceClass_100"
  retain_on_delete              = false
  http_version                  = "http2and3"
  create_origin_access_identity = false

  tags = {
    "VantaContainsUserData" = "false"
    "VantaDescription"      = "Public and static assets infra"
    "VantaOwner"            = "nason@narrator.ai"
  }

  create_origin_access_identity = true
  origin_access_identities = {
    s3_bucket_one = "Assets S3 Access"
  }

  logging_config = {
    bucket = "assetsinfrastack-assetslogsbucketed20e109-1spctmtwytyyf.s3.us-east-1.amazonaws.com"
  }


  origin = {
    one = {
      domain_name         = "assetsinfrastack-assetsbuckete5c0e90f-19is5glcqpnyt.s3.us-east-1.amazonaws.com"
      origin_id           = "AssetsInfraStackassetsdistOrigin17229CBD4"
      connection_attempts = 3
      connection_timeout  = 10
      s3_origin_config = {
        cloudfront_access_identity_path = "origin-access-identity/cloudfront/E161DZLFN2W4UO"
      }
    }
  }


  default_cache_behavior = {
    target_origin_id           = "AssetsInfraStackassetsdistOrigin17229CBD4"
    viewer_protocol_policy     = "redirect-to-https"
    cache_policy_id            = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    origin_request_policy_id   = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"
    response_headers_policy_id = "9d361275-6794-44a6-841b-dafd4c68ae41"

    allowed_methods      = ["GET", "HEAD", "OPTIONS"]
    cached_methods       = ["GET", "HEAD", "OPTIONS"]
    compress             = true
    query_string         = true
    use_forwarded_values = false
  }


  viewer_certificate = {
    acm_certificate_arn      = "arn:aws:acm:us-east-1:479493230127:certificate/3e9c1c70-e245-4eee-9618-30bfd81921ba"
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

}


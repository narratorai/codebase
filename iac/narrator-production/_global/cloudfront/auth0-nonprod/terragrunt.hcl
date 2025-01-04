terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-cloudfront.git?ref=v3.2.0"
}

include "root" {
  path = find_in_parent_folders()
}

inputs = {
  aliases                       = ["nonprod.auth.narrator.ai"]
  create_origin_access_identity = false

  comment             = "Auth0 Custom Domain Reverse Proxy (nonprod.auth.narrator.ai)"
  enabled             = true
  is_ipv6_enabled     = true
  price_class         = "PriceClass_100"
  retain_on_delete    = false
  http_version        = "http2and3"
  default_root_object = "index.html"

  origin_access_identities = {
    s3_bucket_one = "Assets S3 Access"
  }

  origin = {
    one = {
      connection_attempts = 3
      connection_timeout  = 10
      domain_name         = "narrator-nonprod-cd-mvwyTqhsvYicRSWr.edge.tenants.auth0.com"
      origin_id           = "origin1"

      custom_header = [{
        name  = "cname-api-key"
        value = "ed7a9a0b6547a99cc297429912d32bd38ff6bc32f4751051457611fab326602d"
      }]

      custom_origin_config = {
        http_port                = 80
        https_port               = 443
        origin_keepalive_timeout = 5
        origin_protocol_policy   = "https-only"
        origin_read_timeout      = 30
        origin_ssl_protocols = [
          "TLSv1.2",
        ]
      }
    },
    two = {
      domain_name         = "auth-infra-nonprod-authstaticbucketc7e255dc-1vafwbu849t6a.s3.us-east-1.amazonaws.com"
      origin_id           = "origin2"
      connection_attempts = 3
      connection_timeout  = 10

      s3_origin_config = {
        cloudfront_access_identity_path = "origin-access-identity/cloudfront/E3FA8N4VUE6G4"
      }
    }
  }

  logging_config = {
    bucket          = "auth-infra-nonprod-authproxylogs0b151c62-t16mrpup204p.s3.us-east-1.amazonaws.com"
    include_cookies = false
  }

  ordered_cache_behavior = [{
    allowed_methods = [
      "GET",
      "HEAD",
      "OPTIONS",
    ]
    cached_methods = [
      "GET",
      "HEAD",
      "OPTIONS",
    ]
    compress               = true
    default_ttl            = 86400
    max_ttl                = 31536000
    min_ttl                = 0
    path_pattern           = "static/*"
    smooth_streaming       = false
    target_origin_id       = "origin2"
    trusted_key_groups     = []
    trusted_signers        = []
    viewer_protocol_policy = "redirect-to-https"
    headers = [
      "Access-Control-Request-Headers",
      "Access-Control-Request-Method",
      "Origin",
    ]

  }]


  default_cache_behavior = {
    target_origin_id           = "origin1"
    viewer_protocol_policy     = "redirect-to-https"
    response_headers_policy_id = "5cc3b908-e619-4b99-88e5-2cf7f45965bd"

    allowed_methods = ["GET", "HEAD", "OPTIONS", "DELETE", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD"]
    compress        = true
    query_string    = true


    use_forwarded_values = true
    cookies_forward      = "all"
    headers = [
      "Accept",
      "Authorization",
      "Origin",
      "Referer",
      "User-Agent",
    ]
  }


  viewer_certificate = {
    acm_certificate_arn      = "arn:aws:acm:us-east-1:479493230127:certificate/28bc3a73-3beb-42c7-8fc4-44e073be799a"
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

}


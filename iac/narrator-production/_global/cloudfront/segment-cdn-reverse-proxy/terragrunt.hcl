terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-cloudfront.git?ref=v3.2.0"
}

include "root" {
  path = find_in_parent_folders()
}

inputs = {
  aliases                       = ["sc.t.narrator.ai"]
  create_origin_access_identity = false

  comment          = "Segment CDN Reverse Proxy"
  enabled          = true
  is_ipv6_enabled  = true
  price_class      = "PriceClass_All"
  retain_on_delete = false
  http_version     = "http2and3"

  origin_access_identities = {
    s3_bucket_one = "Assets S3 Access"
  }

  origin = {
    one = {
      domain_name         = "cdn.segment.com"
      origin_id           = "Segment CDN Reverse Proxy"
      connection_attempts = 3
      connection_timeout  = 10
      custom_origin_config = {
        http_port                = 80
        https_port               = 443
        origin_keepalive_timeout = 5
        origin_protocol_policy   = "https-only"
        origin_read_timeout      = 30
        origin_ssl_protocols     = ["TLSv1", "TLSv1.1", "TLSv1.2"]
      }
    }
  }


  default_cache_behavior = {
    target_origin_id       = "Segment CDN Reverse Proxy"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD", "OPTIONS", "DELETE", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD"]
    compress        = false
    query_string    = true
    function_association = {
      viewer-request = {
        function_arn = "arn:aws:cloudfront::479493230127:function/ViewerRequestOptionsOverride"
      }
    }

    use_forwarded_values = true
    cookies_forward      = "all"
    forwarded_values = {
      headers                 = []
      query_string            = true
      query_string_cache_keys = []

      whitelisted_names = []
    }

  }


  viewer_certificate = {
    acm_certificate_arn      = "arn:aws:acm:us-east-1:479493230127:certificate/5ea2539b-ceac-4ee2-aa95-becd3e2c5646"
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

}


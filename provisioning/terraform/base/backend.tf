terraform {
  required_version = ">= 0.11.0"

  backend "s3" {
    bucket = "r-isucon-terraform"
    key    = "terraform.tfstate"
    region = "ap-northeast-1"
  }
}

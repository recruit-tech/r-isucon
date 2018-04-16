provider "aws" {
  shared_credentials_file = "../credential/credentials"
  region                  = "ap-northeast-1"
}

module "common" {
  source = "../modules/common/vpc"
}

# module "ec2" {
#   source             = "../modules/ec2"
#   vpc_id             = "${module.common.vpc_id}"
#   security_groups_id = "${module.common.security_group_id}"
#   route_table_id     = "${module.common.route_table_id}"
#   public_key         = "${var.public_key}"
#   private_zone_id    = "${module.common.private_zone_id}"
# }

module "management" {
  source             = "../modules/management/ec2"
  vpc_id             = "${module.common.vpc_id}"
  security_groups_id = "${module.common.security_group_id}"
  route_table_id     = "${module.common.route_table_id}"
  public_key         = "${var.public_key}"
  private_zone_id    = "${module.common.private_zone_id}"
}

module "participant" {
  source             = "../modules/participant/ec2"
  vpc_id             = "${module.common.vpc_id}"
  security_groups_id = "${module.common.security_group_id}"
  route_table_id     = "${module.common.route_table_id}"
  public_key         = "${var.public_key}"
  private_zone_id    = "${module.common.private_zone_id}"
}

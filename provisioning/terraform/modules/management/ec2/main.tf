resource "aws_key_pair" "management-key" {
  key_name   = "management-key"
  public_key = "${var.public_key}"
}

#運営用のインスタンスを定義します。
resource "aws_instance" "management-instance" {
  count                       = "${length(var.names)}"
  instance_type               = "${lookup(var.instance-type,count.index)}"
  ami                         = "${lookup(var.ami,count.index)}"
  subnet_id                   = "${aws_subnet.management-subnet.id}"
  associate_public_ip_address = true
  key_name                    = "${aws_key_pair.management-key.id}"
  security_groups             = ["${var.security_groups_id}"]

  root_block_device {
    # device_name           = "/dev/sdb"
    volume_type           = "standard"
    volume_size           = 100
    delete_on_termination = false
  }

  tags {
    Name = "${lookup(var.names, count.index)}"
  }
}

#運営用インスタンスのEIPを定義します・
resource "aws_eip" "management-eip" {
  count    = "${length(var.names)}"
  instance = "${element(aws_instance.management-instance.*.id,count.index)}"
  vpc      = true
}

#運営用のテーブルを定義します
resource "aws_subnet" "management-subnet" {
  vpc_id            = "${var.vpc_id}"
  cidr_block        = "${var.subnets}"
  availability_zone = "ap-northeast-1a"

  tags {
    Name = "Portal,benchmaker用"
  }
}

#運営用のサブネットとルーティングテーブルを紐づけます
resource "aws_route_table_association" "management-rta" {
  count          = "${length(var.names)}"
  subnet_id      = "${aws_subnet.management-subnet.id}"
  route_table_id = "${var.route_table_id}"
}

resource "aws_route53_record" "public_domains" {
  count   = "${length(var.domains)}"
  zone_id = "Z240ENZCNUV3ZA"
  name    = "${lookup(var.domains,count.index)}.r-isucon.blue"
  type    = "A"
  ttl     = "60"
  records = ["${element(aws_eip.management-eip.*.public_ip, count.index)}"]
}

resource "aws_route53_record" "private_domains" {
  count   = "${length(var.domains)}"
  zone_id = "${var.private_zone_id}"
  name    = "${lookup(var.domains,count.index)}.r-isucon.internal"
  type    = "A"
  ttl     = "60"
  records = ["${element(aws_instance.management-instance.*.private_ip, count.index)}"]
}

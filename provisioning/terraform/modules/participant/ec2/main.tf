resource "aws_key_pair" "participant-key" {
  count      = "${length(var.domains)}"
  key_name   = "${lookup(var.domains,count.index)}"
  public_key = "${file("../credential/${lookup(var.domains,count.index)}.pub")}"
}

#参加者のインスタンスを定義します。
resource "aws_instance" "participant-instance" {
  count                       = "${length(var.names)}"
  instance_type               = "t2.medium"
  ami                         = "<WEB_AMI_ID>"
  subnet_id                   = "${element(aws_subnet.participant-subnet.*.id,count.index)}"
  associate_public_ip_address = true
  key_name                    = "${element(aws_key_pair.participant-key.*.id, count.index)}"
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

#参加者毎ごとのEIPを定義します・
resource "aws_eip" "participant-eip" {
  count    = "${length(var.names)}"
  instance = "${element(aws_instance.participant-instance.*.id,count.index)}"
  vpc      = true
}

#参加者毎のテーブルを定義します
resource "aws_subnet" "participant-subnet" {
  count             = "${length(var.subnets)}"
  vpc_id            = "${var.vpc_id}"
  cidr_block        = "${lookup(var.subnets, count.index)}"
  availability_zone = "ap-northeast-1a"

  tags {
    Name = "${lookup(var.names, count.index)}"
  }
}

#参加者毎のサブネットとルーティングテーブルを紐づけます
resource "aws_route_table_association" "participant-rta" {
  count          = "${length(var.names)}"
  subnet_id      = "${element(aws_subnet.participant-subnet.*.id,count.index)}"
  route_table_id = "${var.route_table_id}"
}

resource "aws_route53_record" "public_domains" {
  count   = "${length(var.domains)}"
  zone_id = "Z240ENZCNUV3ZA"
  name    = "${lookup(var.domains,count.index)}.r-isucon.blue"
  type    = "A"
  ttl     = "60"
  records = ["${element(aws_eip.participant-eip.*.public_ip, count.index)}"]
}

resource "aws_route53_record" "private_domains" {
  count   = "${length(var.domains)}"
  zone_id = "${var.private_zone_id}"
  name    = "${lookup(var.domains,count.index)}.r-isucon.internal"
  type    = "A"
  ttl     = "60"
  records = ["${element(aws_instance.participant-instance.*.private_ip, count.index)}"]
}

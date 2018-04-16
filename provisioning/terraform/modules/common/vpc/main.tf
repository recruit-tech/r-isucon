#ISUCON全体のVPCの定義をします。
resource "aws_vpc" "r-isucon-vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags {
    Name = "r-isucon"
  }
}

#参加者が外に出るためのgatewayを定義します
resource "aws_internet_gateway" "r-isucon-vpc-igw" {
  vpc_id = "${aws_vpc.r-isucon-vpc.id}"

  tags {
    Name = "r-isucon"
  }
}

#参加者のサブネットのルーティングテーブルを定義します
resource "aws_route_table" "r-isucon-public-rt" {
  vpc_id = "${aws_vpc.r-isucon-vpc.id}"

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = "${aws_internet_gateway.r-isucon-vpc-igw.id}"
  }

  tags {
    Name = "r-isucon"
  }
}

#参加者のセキュリティグループを定義します
resource "aws_security_group" "r-isucon_sg" {
  name   = "terraform_sg"
  vpc_id = "${aws_vpc.r-isucon-vpc.id}"

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags {
    Name = "r-isucon"
  }
}

resource "aws_route53_zone" "private_zone" {
  name   = "r-isucon.internal"
  vpc_id = "${aws_vpc.r-isucon-vpc.id}"
}

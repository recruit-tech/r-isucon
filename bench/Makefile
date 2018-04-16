all: build

.PHONY: build
build:
	GOPATH=$(shell pwd):$(GOPATH) go install ./src/cmd/...

.PHONY: race
race:
	go install -race ./src/cmd/...

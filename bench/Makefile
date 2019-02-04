.PHONY: build
build: vendor
	go build -o bin/bench ./cmd/bench

.PHONY: data
data: data/avatar/dx

.PHONY: run
run: bin/bench
	bin/bench

vendor: Gopkg.toml Gopkg.lock
	dep ensure -vendor-only
	@touch vendor

data/avatar/dx:
	cd data; python resize.py avatar

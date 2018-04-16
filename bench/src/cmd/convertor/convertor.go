package main

import (
	"flag"
	"fmt"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"io"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/chai2010/webp"
)

func main() {
	d := flag.String("d", "", "directory")
	s := flag.String("s", "", "suffix")
	flag.Parse()

	fs, err := ioutil.ReadDir(*d)
	if err != nil {
		log.Fatal(err)
	}
	var wg sync.WaitGroup

	for _, fi := range fs {
		if fi.IsDir() {
			continue
		}
		if !strings.HasSuffix(fi.Name(), *s) {
			continue
		}
		ext := filepath.Ext(fi.Name())

		f, err := os.Open(filepath.Join(*d, fi.Name()))
		if err != nil {
			log.Fatal(err)
		}

		img, _, err := image.Decode(f)
		if err != nil {
			log.Println(fi.Name())
			log.Fatal(err)
		}

		fmt.Println("start", fi.Name())
		wg.Add(1)
		go func() {
			defer wg.Done()
			defer f.Close()
			for _, fm := range []struct {
				ext     string
				encoder func(io.Writer, image.Image) error
			}{
				{
					ext: ".jpeg",
					encoder: func(w io.Writer, img image.Image) error {
						return jpeg.Encode(w, img, nil)
					},
				},
				{
					ext: ".gif",
					encoder: func(w io.Writer, img image.Image) error {
						return gif.Encode(w, img, nil)
					},
				},
				{
					ext:     ".png",
					encoder: png.Encode,
				},
				{
					ext: ".webp",
					encoder: func(w io.Writer, i image.Image) error {
						return webp.Encode(w, i, &webp.Options{
							Lossless: false,
						})
					},
				},
			} {
				if ext == fm.ext {
					continue
				}
				fname := strings.TrimSuffix(f.Name(), ext) + fm.ext
				if _, err := os.Stat(fname); err == nil {
					continue
				}
				nf, err := os.Create(fname)
				if err != nil {
					log.Fatal(err)
				}
				fm.encoder(nf, img)
				nf.Close()
			}
		}()
	}
	wg.Wait()
}

package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

func main() {
	fmt.Print("Hello, World!")

	s := &http.Server{
		Addr:           ":8080",
		Handler:        http.HandlerFunc(myHandler),
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	log.Fatal(s.ListenAndServe())

}

func myHandler(res http.ResponseWriter, req *http.Request) {
	fmt.Println(res)
	fmt.Println(req)
}

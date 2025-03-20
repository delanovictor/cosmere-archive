package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/delanovictor/cosmere-archive/database"
)

func main() {
	fmt.Println("Listening Port 8080!")

	s := &http.Server{
		Addr:           ":8080",
		Handler:        http.HandlerFunc(httpHandler),
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	log.Fatal(s.ListenAndServe())

}

func httpHandler(res http.ResponseWriter, req *http.Request) {
	fmt.Println(req.Method, req.RequestURI)

	if req.Method == "GET" && req.RequestURI == "/search" {

		searchResults, err := database.SearchForString(`idiot`)

		if err != nil {
			log.Fatal(err)
		}

		res.Header().Set("Content-Type", "application/json")

		json.NewEncoder(res).Encode(&searchResults)

		return
	}

	res.WriteHeader(http.StatusNotFound)
	io.WriteString(res, "Route not Found!")
}

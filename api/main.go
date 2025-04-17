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

	if req.Method != "POST" {
		res.WriteHeader(http.StatusMethodNotAllowed)
		io.WriteString(res, "Method Not Allowed!\n")
		return
	}

	res.Header().Set("Access-Control-Allow-Origin", "*")

	switch req.RequestURI {
	case "/search":
		handleSearchRequest(res, req)
	case "/adjacent":
		handleAdjacentRequest(res, req)
	case "/count":
		handleCountRequest(res, req)
	default:
		res.WriteHeader(http.StatusNotFound)
		io.WriteString(res, "Route not Found!\n")
	}
}

func handleSearchRequest(res http.ResponseWriter, req *http.Request) {
	decoder := json.NewDecoder(req.Body)

	var body database.SearchRequest

	err := decoder.Decode(&body)

	if err != nil {
		panic(err)
	}

	fmt.Println(body)

	if body.Limit > 50 {
		body.Limit = 50
	}

	if len(body.SearchTerm) < 2 {
		res.WriteHeader(http.StatusBadRequest)
		io.WriteString(res, "SearchTerm lenght must be > 2\n")
		return
	}

	searchResults, err := database.SearchForString(body)

	if err != nil {
		log.Fatal(err)
	}

	res.Header().Set("Content-Type", "application/json")

	json.NewEncoder(res).Encode(&searchResults)

}

func handleAdjacentRequest(res http.ResponseWriter, req *http.Request) {
	decoder := json.NewDecoder(req.Body)

	var body database.AdjacentRequest

	err := decoder.Decode(&body)

	if err != nil {
		panic(err)
	}

	fmt.Println(body)

	if len(body.ParagraphIds) == 0 {
		res.WriteHeader(http.StatusBadRequest)
		io.WriteString(res, "ParagraphIds lenght must be > 0\n")
		return
	}

	searchResults, err := database.GetAdjacentParagraphs(body)

	if err != nil {
		log.Fatal(err)
	}

	res.Header().Set("Content-Type", "application/json")

	json.NewEncoder(res).Encode(&searchResults)
}

func handleCountRequest(res http.ResponseWriter, req *http.Request) {
	decoder := json.NewDecoder(req.Body)

	var body database.CountRequest

	err := decoder.Decode(&body)

	if err != nil {
		panic(err)
	}

	fmt.Println(body)

	if len(body.SearchTerm) < 2 {
		res.WriteHeader(http.StatusBadRequest)
		io.WriteString(res, "SearchTerm lenght must be > 2\n")
		return
	}

	countResults, err := database.GetSearchCount(body)

	if err != nil {
		log.Fatal(err)
	}

	res.Header().Set("Content-Type", "application/json")

	json.NewEncoder(res).Encode(&countResults)
}

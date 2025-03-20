package database

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

type Book struct {
	bookId string
	name   string
}

type Chapter struct {
	ChapterId      string
	BookId         string
	ChapterNumber  int
	ChapterTitle   string
	ParagraphCount int
}

type Paragraph struct {
	ParagraphId     string
	BookId          string
	ChapterId       string
	ParagraphNumber int
	Content         string
}

type SearchResult struct {
	BookId          string
	ChapterId       string
	ChapterNumber   int
	ChapterTitle    string
	ParagraphId     int
	ParagraphNumber int
	ParagraphCount  int
	Content         string
}

type SearchItem struct {
}

var db *sql.DB

func init() {
	_db, err := sql.Open("sqlite3", "./cosmere_archive.db")

	check(err)

	db = _db
}

func SearchForString(str string) ([]*SearchResult, error) {

	rows, err := db.Query(`
		SELECT p.*, c.* from paragraphs p 
		INNER JOIN chapters c ON p.chapterId = c.chapterId 
		WHERE p.content MATCH ? limit 100;
	`, str)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var searchResults []*SearchResult

	for rows.Next() {

		var searchResult SearchResult

		err = rows.Scan(
			&searchResult.BookId,
			&searchResult.ChapterId,
			&searchResult.ParagraphId,
			&searchResult.ParagraphNumber,
			&searchResult.Content,

			&searchResult.ChapterId,
			&searchResult.BookId,
			&searchResult.ChapterNumber,
			&searchResult.ChapterTitle,
			&searchResult.ParagraphCount,
		)

		if err != nil {
			log.Fatal(err)
			return nil, err
		}

		searchResults = append(searchResults, &searchResult)
	}

	if err != nil {
		return nil, err
	}

	return searchResults, nil
}

func check(e error) {
	if e != nil {
		panic(e)
	}
}

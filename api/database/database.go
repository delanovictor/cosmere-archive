package database

import (
	"database/sql"
	"fmt"
	"log"
	"strings"

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
	BookId          string
	ChapterId       string
	ParagraphNumber int
	Content         string
}

type AdjacentRequest struct {
	ParagraphIds []int `json:"paragraphIds"`
}

type SearchRequest struct {
	BookIds    []string `json:"bookIds"`
	SearchTerm string   `json:"searchTerm"`
	Offset     int      `json:"offset"`
	Limit      int      `json:"limit"`
}

type SearchResult struct {
	BookId          string `json:"bookId"`
	ChapterId       string `json:"chapterId"`
	ParagraphId     int    `json:"paragraphId"`
	ParagraphNumber int    `json:"paragraphNumber"`
	Content         string `json:"content"`
	ChapterTitle    string `json:"chapterTitle"`
	ParagraphCount  int    `json:"paragraphCount"`
	BookName        string `json:"bookName"`
}

type CountRequest struct {
	BookIds    []string `json:"bookIds"`
	SearchTerm string   `json:"searchTerm"`
}

type CountResult struct {
	Count    int    `json:"count"`
	BookId   string `json:"bookId"`
	BookName string `json:"bookName"`
}

var db *sql.DB

func init() {
	_db, err := sql.Open("sqlite3", "./cosmere_archive.db")

	check(err)

	db = _db
}

func GetSearchCount(params CountRequest) ([]*CountResult, error) {

	query := `
		SELECT count(*) as count, p.bookId, b.name
		FROM paragraphs p
		INNER JOIN chapters c ON p.chapterId = c.chapterId
		INNER JOIN books b ON c.bookId = b.bookId 
		WHERE 1=1		
	`
	var queryParams []any

	//TODO: Parace burro, precisa checar o quanto impacta a performance
	if len(params.BookIds) > 0 {
		query += `AND p.bookId IN (`

		for i := 0; i < len(params.BookIds); i++ {
			query += `?,`

			queryParams = append(queryParams, params.BookIds[i])
		}

		query = strings.TrimRight(query, ",")

		query += `)`
	}

	queryParams = append(queryParams, params.SearchTerm)

	query += `
		AND p.content MATCH ? 
		GROUP by p.bookId
		ORDER by count DESC;
	`

	fmt.Println(query)
	fmt.Println(queryParams)

	rows, err := db.Query(query, queryParams...)

	if err != nil {
		return nil, err
	}
	fmt.Println(rows)

	defer rows.Close()

	var countResults []*CountResult

	for rows.Next() {

		var countResult CountResult

		err = rows.Scan(
			&countResult.Count,
			&countResult.BookId,
			&countResult.BookName,
		)

		if err != nil {
			log.Fatal(err)
			return nil, err
		}

		countResults = append(countResults, &countResult)
	}

	if err != nil {
		return nil, err
	}

	return countResults, nil
}

func SearchForString(params SearchRequest) ([]*SearchResult, error) {

	query := `
		SELECT 
			p.bookId, 
			p.chapterId, 
			p.rowid, 
			p.paragraphNumber, 
			p.content,
			c.chapterTitle,
			c.paragraphCount,
			b.name
		FROM paragraphs p 
		INNER JOIN chapters c ON p.chapterId = c.chapterId 
		INNER JOIN books b ON c.bookId = b.bookId 
		WHERE 1=1
	`
	var queryParams []any

	//TODO: Parace burro, precisa checar o quanto impacta a performance
	if len(params.BookIds) > 0 {
		query += `AND p.bookId IN (`

		for i := 0; i < len(params.BookIds); i++ {
			query += `?,`

			queryParams = append(queryParams, params.BookIds[i])
		}

		query = strings.TrimRight(query, ",")

		query += `)`
	}

	queryParams = append(queryParams, params.SearchTerm)
	queryParams = append(queryParams, params.Limit)
	queryParams = append(queryParams, params.Offset)

	query += `
		AND p.content MATCH ? 
		LIMIT ?
		OFFSET ?
	`

	fmt.Println(query)
	fmt.Println(queryParams)

	rows, err := db.Query(query, queryParams...)

	if err != nil {
		return nil, err
	}
	fmt.Println(rows)

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

			&searchResult.ChapterTitle,
			&searchResult.ParagraphCount,
			&searchResult.BookName,
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

func GetAdjacentParagraphs(params AdjacentRequest) ([]*SearchResult, error) {

	query := `
		SELECT 
			p.bookId, 
			p.chapterId, 
			p.rowid, 
			p.paragraphNumber, 
			p.content,
			c.chapterTitle,
			c.paragraphCount,
			b.name
		FROM paragraphs p 
		INNER JOIN chapters c ON p.chapterId = c.chapterId 
		INNER JOIN books b ON c.bookId = b.bookId 
		WHERE 1=1
	`
	var queryParams []any

	//TODO: Parace burro, precisa checar o quanto impacta a performance
	if len(params.ParagraphIds) > 0 {
		query += `AND p.rowid IN (`

		for i := 0; i < len(params.ParagraphIds); i++ {
			query += `?,`

			queryParams = append(queryParams, params.ParagraphIds[i])
		}

		query = strings.TrimRight(query, ",")

		query += `)`
	}

	fmt.Println(query)
	fmt.Println(queryParams)

	rows, err := db.Query(query, queryParams...)

	if err != nil {
		return nil, err
	}
	fmt.Println(rows)

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

			&searchResult.ChapterTitle,
			&searchResult.ParagraphCount,
			&searchResult.BookName,
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

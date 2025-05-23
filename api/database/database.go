package database

import (
	"database/sql"
	"fmt"
	"strconv"
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
	ExactMatch bool     `json:"exactMatch"`
	StartsWith bool     `json:"startsWith"`
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
	ExactMatch bool     `json:"exactMatch"`
	StartsWith bool     `json:"startsWith"`
}

type CountResult struct {
	Count    int    `json:"count"`
	BookId   string `json:"bookId"`
	BookName string `json:"bookName"`
}

var db *sql.DB

func init() {
	_db, err := sql.Open("sqlite3", "../db/cosmere_archive.db")

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

	if len(params.BookIds) > 0 {
		query += `AND p.bookId`

		inQuery, inQueryParams := inStatementFromStringSlice(params.BookIds)

		query += inQuery

		queryParams = append(queryParams, inQueryParams...)
	}

	queryParams = append(queryParams, advanceSearchTerms(params.SearchTerm, params.ExactMatch, params.StartsWith))

	query += `
		AND p.content MATCH ? 
		GROUP by p.bookId
		ORDER by count DESC;
	`

	fmt.Println(query)
	fmt.Println(queryParams)

	rows, err := db.Query(query, queryParams...)

	if err != nil {
		return nil, fmt.Errorf("error:  %w", err)
	}

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
			return nil, fmt.Errorf("error:  %w", err)
		}

		countResults = append(countResults, &countResult)
	}

	if err != nil {
		return nil, fmt.Errorf("error:  %w", err)
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
			op.originalContent,
			c.chapterTitle,
			c.paragraphCount,
			b.name
		FROM paragraphs p 
		INNER JOIN chapters c ON p.chapterId = c.chapterId 
		INNER JOIN books b ON c.bookId = b.bookId
		INNER JOIN original_paragraphs op ON op.rowid = p.rowid
		WHERE 1=1
	`
	var queryParams []any

	if len(params.BookIds) > 0 {
		query += `AND p.bookId`

		inQuery, inQueryParams := inStatementFromStringSlice(params.BookIds)

		query += inQuery

		queryParams = append(queryParams, inQueryParams...)
	}

	queryParams = append(queryParams, advanceSearchTerms(params.SearchTerm, params.ExactMatch, params.StartsWith))

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
		return nil, fmt.Errorf("error:  %w", err)
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

			&searchResult.ChapterTitle,
			&searchResult.ParagraphCount,
			&searchResult.BookName,
		)

		if err != nil {
			return nil, fmt.Errorf("error:  %w", err)
		}

		searchResults = append(searchResults, &searchResult)
	}

	if err != nil {
		return nil, fmt.Errorf("error:  %w", err)
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
			op.originalContent,
			c.chapterTitle,
			c.paragraphCount,
			b.name
		FROM paragraphs p 
		INNER JOIN chapters c ON p.chapterId = c.chapterId 
		INNER JOIN books b ON c.bookId = b.bookId 
		INNER JOIN original_paragraphs op ON op.rowid = p.rowid
		WHERE 1=1
	`
	var queryParams []any

	if len(params.ParagraphIds) > 0 {
		query += `AND p.rowid`

		inQuery, inQueryParams := inStatementFromIntSlice(params.ParagraphIds)

		query += inQuery

		queryParams = append(queryParams, inQueryParams...)
	}

	fmt.Println(query)
	fmt.Println(queryParams)

	rows, err := db.Query(query, queryParams...)

	if err != nil {
		return nil, fmt.Errorf("error:  %w", err)
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

			&searchResult.ChapterTitle,
			&searchResult.ParagraphCount,
			&searchResult.BookName,
		)

		if err != nil {
			return nil, fmt.Errorf("error:  %w", err)
		}

		searchResults = append(searchResults, &searchResult)
	}

	if err != nil {
		return nil, fmt.Errorf("error:  %w", err)
	}

	return searchResults, nil
}

func advanceSearchTerms(searchTerm string, exactMatch bool, startsWith bool) string {

	var sb strings.Builder

	if startsWith {
		sb.WriteString(`^ `)
	}

	if exactMatch {

		sb.WriteString(`"`)
		sb.WriteString(searchTerm)
		sb.WriteString(`"`)
	} else {
		sb.WriteString(searchTerm)
	}

	return sb.String()
}

func inStatementFromIntSlice(paramsList []int) (string, []any) {
	var stringParamsList []string

	for i := 0; i < len(paramsList); i++ {
		stringParamsList = append(stringParamsList, strconv.Itoa(paramsList[i]))
	}

	return inStatementFromStringSlice(stringParamsList)
}

func inStatementFromStringSlice(paramsList []string) (string, []any) {
	query := ` IN (`
	var queryParams []any

	for i := 0; i < len(paramsList); i++ {
		query += `?,`

		queryParams = append(queryParams, paramsList[i])
	}

	query = strings.TrimRight(query, ",")

	query += `)`

	return query, queryParams
}

func check(e error) {
	if e != nil {
		panic(e)
	}
}

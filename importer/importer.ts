import { EpubExtractor } from "./epub-extractor.ts"
import {randomUUID} from 'node:crypto'
import sqlite3 from 'sqlite3'

const db = new sqlite3.Database('../db/cosmere_archive.db');


type Book = {
    bookId: string,
    name: string,
    folder: string
}

type Chapter = {
    chapterId: string,
    bookId: string,
    chapterNumber: number,
    chapterTitle: string,
    paragraphCount: number,
    src: string,
}

type Paragraph = {
    bookId: string,
    chapterId: string,
    paragraphNumber: number,
    content: string,
    originalContent: string
}


const HTML_FOLDER = `../html`

async function main (){
    const books : Book[] = [
        {
            bookId: `twok`,
            name: `The Way of Kings`,
            folder: `${HTML_FOLDER}/twok/`,
        },
        {
            bookId: `wor`,
            name: `Words of Radiance`,
            folder: `${HTML_FOLDER}/wor/OEBPS/`,
        },
        {
            bookId: `edge`,
            name: `Edgedancer`,
            folder: `${HTML_FOLDER}/edge/`,
        },
        {
            bookId: `ob`,
            name: `Oathbringer`,
            folder: `${HTML_FOLDER}/ob/OEBPS/`,
        },
        {
            bookId: `dawn`,
            name: `Dawnshard`,
            folder: `${HTML_FOLDER}/dawn/OEBPS/`,
        },
        {
            bookId: `row`,
            name: `Rhythm of War`,
            folder: `${HTML_FOLDER}/row/`,
        },
    ]

    for(const book of books){
        const BOOK_ID = book.bookId

        const epubExtractor = new EpubExtractor({folder: book.folder})

        const tocChapters = await epubExtractor.getChapterListFromTOC()
    
        const chapterList = tocChapters.filter(c => isValidChapter(c.chapterTitle))
        
        const alreadyExists = await insertBook(book)
        
        if(alreadyExists){
            continue
        }

        for(let i = 0; i < chapterList.length; i++){
    
            const chapter = chapterList[i]
            
            const paragraphs = await epubExtractor.getChapterParagraphs(chapter)

            console.log(`Chapter: ${chapter.chapterTitle}`)
    
            const dbChapter = await insertChapter({
                bookId: BOOK_ID,
                chapterNumber: i + 1,
                chapterTitle: chapter.chapterTitle.toUpperCase(),
                chapterId: randomUUID(),
                paragraphCount: paragraphs.length,
                src: chapter.src
            })
    
            const dbParagraphs : Paragraph[] = paragraphs.map((p, i) => {
                return {
                    chapterId: dbChapter.chapterId,
                    bookId: dbChapter.bookId,
                    paragraphNumber: i + 1,
                    content: p.clean,
                    originalContent: p.original
                }
            })
    
            console.log(`Paragraphs: ${dbParagraphs.length}`)
    
            await insertParagraphs(dbParagraphs)
        }
    }
}

async function runAndGetId(stmt : sqlite3.Statement, params : any[]) : Promise<number> {
    return new Promise((res, rej) => {
        stmt.run(params, function (error) {
            if(error){
                rej(-1)
            }else{
                res(this.lastID)
            }
        })
    })
}
async function insertParagraphs(paragraphs : Paragraph[]) : Promise<void>{
    return new Promise(async (resolve, reject) => {
        console.log(`Inserindo ${paragraphs.length} paragrafos...`)
    
        const stmt = db.prepare("INSERT INTO paragraphs VALUES (?, ?, ?, ?)");
    
        for(const paragraph of paragraphs){
            const id = await runAndGetId(stmt, [
                paragraph.bookId, 
                paragraph.chapterId, 
                paragraph.paragraphNumber, 
                paragraph.content, 
            ])

            if(id > 0) {

                const stmt2 = db.prepare("INSERT INTO original_paragraphs VALUES (?, ?)");
                
                stmt2.run(
                    id,
                    paragraph.originalContent, 
                );
        
            }else{
                throw new Error(`Error inserting paragraphs`)
            }
        }

     
        stmt.finalize((error)=> {
            if(error){
                reject(error)
            }else{
                resolve()
            }
        });
    })
  
}

async function insertChapter(chapter : Chapter) : Promise<Chapter>{
    return new Promise((resolve, reject) => {

        const stmt = db.prepare("INSERT INTO chapters VALUES (?, ?, ?, ?, ?)");

        stmt.run(
            chapter.chapterId, 
            chapter.bookId, 
            chapter.chapterNumber, 
            chapter.chapterTitle,
            chapter.paragraphCount 
        );

        stmt.finalize((error)=> {
            if(error){
                reject(error)
            }else{
                resolve(chapter)
            }
        });
    })
}

async function insertBook(book : Book) : Promise<boolean>{
    return new Promise(async (resolve, reject) => {
        console.log(book)

        const row = await new Promise((res, rej) => {
            db.get("SELECT bookId, name from books WHERE bookId = ?", [book.bookId], (err, response) => {
                res(response)
            });
        })

        if(row){
            resolve(true)
            return
        }
        
        const insertStmt = db.prepare("INSERT INTO books VALUES (?, ?)");

        insertStmt.run(
            book.bookId, 
            book.name
        );

        insertStmt.finalize((error)=> {
            if(error){
                reject(error)
            }else{
                resolve(false)
            }
        });
    })
}

function isValidChapter(chapterTitle){

    if(chapterTitle.indexOf(`Prelude`) > -1){
        return true
    }

    if(chapterTitle.indexOf(`Prologue`) > -1){
        return true
    }

    if(chapterTitle.indexOf(`Postlude`) > -1){
        return true
    }

    if(chapterTitle.indexOf(`Epilogue`) > -1){
        return true
    }

    if(/\d/.test(chapterTitle)){
        return true
    }
   
    return false
}

export {}

await main()
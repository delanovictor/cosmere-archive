import { EpubExtractor } from "./epub-extractor.ts"
import {randomUUID} from 'node:crypto'
import sqlite3 from 'sqlite3'

const db = new sqlite3.Database('./cosmere_archive.db');

type Chapter = {
    chapter_uuid: string,
    book_id: string,
    chapter_index: number,
    chapter_title: string,
    src: string,
}

type Paragraph = {
    book_id: string,
    chapter_uuid: string,
    paragraph_uuid: string,
    content: string,
}

type Book = {
    id: string,
    folder: string
}

async function main (){
    const books : Book[] = [
        {
            id: `twok`,
            folder: `./html/twok/`,
        },
        {
            id: `wor`,
            folder: `./html/wor/OEBPS/`,
        },
        {
            id: `edge`,
            folder: `./html/edge/`,
        },
        {
            id: `ob`,
            folder: `./html/ob/OEBPS/`,
        },
        {
            id: `dawn`,
            folder: `./html/dawn/OEBPS/`,
        },
        {
            id: `row`,
            folder: `./html/row/`,
        },
    ]

    for(const book of books){
        const BOOK_ID = book.id

        const epubExtractor = new EpubExtractor({folder: book.folder})

        const tocChapters = await epubExtractor.getChapterListFromTOC()
    
        const chapterList = tocChapters.filter(c => isValidChapter(c.chapterTitle))
        
     
        for(let i = 0; i < chapterList.length; i++){
    
            const chapter = chapterList[i]
            
            console.log(`Chapter: ${chapter.chapterTitle}`)
    
            const dbChapter = await insertChapter({
                book_id: BOOK_ID,
                chapter_index: i,
                chapter_title: chapter.chapterTitle.toUpperCase(),
                chapter_uuid: randomUUID(),
                src: chapter.src
            })
    
            const paragraphs = await epubExtractor.getChapterParagraphs(chapter)
    
            const dbParagraphs : Paragraph[] = paragraphs.map((p) => {
                return {
                    chapter_uuid: dbChapter.chapter_uuid,
                    paragraph_uuid: randomUUID(),
                    book_id: dbChapter.book_id,
                    content: p
                }
            })
    
            console.log(`Paragraphs: ${dbParagraphs.length}`)
    
            await insertParagraphs(dbParagraphs)
        }
    }
}


async function insertParagraphs(paragraphs : Paragraph[]) : Promise<void>{
    return new Promise((resolve, reject) => {
        console.log(`Inserindo ${paragraphs.length} paragrafos...`)
    
        const stmt = db.prepare("INSERT INTO paragraphs VALUES (?, ?, ?, ?)");
    
        for(const paragraph of paragraphs){
            stmt.run(
                paragraph.book_id, 
                paragraph.chapter_uuid, 
                paragraph.paragraph_uuid, 
                paragraph.content, 
            );
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

        const stmt = db.prepare("INSERT INTO chapters VALUES (?, ?, ?, ?)");

        stmt.run(
            chapter.chapter_uuid, 
            chapter.book_id, 
            chapter.chapter_index, 
            chapter.chapter_title, 
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
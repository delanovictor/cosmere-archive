import {readFile} from "fs/promises"
import x2j from "simple-xml-to-json"
import {randomUUID} from 'node:crypto'
import sqlite3 from "sqlite3"
import he from "he"

const db = new sqlite3.Database('./cosmere_archive.db');
const PREFIX_PATH = `./html/wor/OEBPS/`
const BOOK_ID = `wor`

const ITALIC_CLASSES = [
    `italic`,
    `ePub-I`,
    `ePub-SCI`,
    `cep-I`,
    `CEP`,
    `CEP-NOBOT`,
    `CEPV-NOBOT`,
    `CEPV`,
    `ACL`,
    `ACL1`,
    `blur`
]

const BOLD_CLASSES = [
    `bold`,
    `ePub-B`
]


type NewChapter = {
    chapter_uuid?: string,
    book_id?: number,
    chapter_index?: string,
    chapter_title?: string,
    src?: string,
}

type Chapter = {
    chapter_uuid: string,
    book_id: number,
    chapter_index: string,
    chapter_title: string,
    src: string,
}

type Paragraph = {
    book_id: string,
    chapter_uuid: string,
    paragraph_uuid: string,
    content: string,
}


async function main(){

    const toc = await readTOC()
    
    const chapterList = await getChapterList(toc)
   
    process.exit()
    // const chaptersData : Chapter[] =  chapterList.map((c, i) => {
    //     return {
    //         chapter_uuid:  randomUUID(),
    //         book_id: BOOK_ID,
    //         chapter_index: i,
    //         chapter_title: c.title,
    //         src: c.src
    //     }
    // })
    
    console.log(chaptersData)
    // await insertChapters(chaptersData)
    
    
    for(const chapter of chaptersData){

        console.log(chapter.chapter_title)
    

        const chapterBuffer = await readFile(`${PREFIX_PATH}${chapter.src}`)

        const chapterJSON = x2j.convertXML(chapterBuffer.toString())
    
        const body = getChild(chapterJSON.html.children, `body`)
    
        const paragraphs = body.children.map(
            (el) => extractText(el, 0)
        ).filter(el => el.length > 0)
        

        const paragraphsData : Paragraph[] = paragraphs.map((p, i) => {
            return {
                chapter_uuid: chapter.chapter_uuid,
                paragraph_uuid: randomUUID(),
                book_id: chapter.book_id,
                content: p
            }
        })
    
        console.log(paragraphsData)

        break;
        // await insertParagraphs(paragraphsData)

    }

    console.log(`Finalizado!`)
}


async function readTOC(){
    const fileBuffer = await readFile(`${PREFIX_PATH}toc.ncx`)
    
    const fileLines = fileBuffer.toString().split(`\n`)

    const docTypeIndex = fileLines.findIndex(l => l.indexOf(`<!DOCTYPE`) > -1)

    if(docTypeIndex > -1){
        fileLines.splice(docTypeIndex,1)
    }

    const fileText = fileLines.join(`\n`)

    const toc = x2j.convertXML(fileText)

    return toc
}

async function getChapterList(toc : Record<string, any>){
    
    const navMap = getChild(toc.ncx.children, `navMap`)

    const chapters : NewChapter[] = []

    for(const c of navMap.children){
        console.log(c)
        const navPoint = c.navPoint
        
        chapters.push(...extractChapters(navPoint))
    }


    return chapters.filter()
}

function extractChapters(navPoint) : NewChapter[]{
    const chapters : NewChapter[] = []

    console.log()
    console.log()
    console.log(`Sou o capitulo pai:`, navPoint)

    console.log(`cade o navlabel`)

    const navLabel = getChild(navPoint.children, `navLabel`)

    console.log(`cade o text`)

    const text =  getChild(navLabel.children, `text`)

    console.log(`cade o content`)

    const content = getChild(navPoint.children, `content`)


    const rootChapter : NewChapter = {
        chapter_title: formatString(text.content),
        src: content.src
    }
    chapters.push(rootChapter)

    for(const child of navPoint.children){
      
        if(child.navPoint){
            console.log(`Tenho um filho navPoint`, child.navPoint)

            const childChapters = extractChapters(child.navPoint)

            chapters.push(...childChapters)
        }
    }


    console.log(`meus capitulos`, chapters)

    return chapters
}

async function insertChapters(chapters : Chapter[]) : Promise<void>{
    return new Promise((resolve, reject) => {

        console.log(`Inserindo ${chapters.length} capitulos...`)
        
        const stmt = db.prepare("INSERT INTO chapters VALUES (?, ?, ?, ?)");

        for(const chapter of chapters){
            stmt.run(
                chapter.chapter_uuid, 
                chapter.book_id, 
                chapter.chapter_index, 
                chapter.chapter_title, 
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

    if(/\d/.test(chapterTitle)){
        return true
    }
   
    return false
}

function extractText(parentElement, depth){
    let text = ""
    // console.log()
    // console.log()
    // console.log(`[${depth}] Sou o elemento:`, parentElement)
    
    for(const key in parentElement){

        const element = parentElement[key]
        // console.log(`Esse eh um dos meus filhos:`, element)

        if(key == `content`){
            text += element
        }

        if(element.children){
            for(const childElement of element.children){
                text += extractText(childElement, depth++)
            }
        }

        if(element.content){
            if(ITALIC_CLASSES.indexOf(element.class) > -1){
                text += `<i>${element.content}</i>`    
            }else if(BOLD_CLASSES.indexOf(element.class) > -1){
                text += `<b>${element.content}</b>`    
            }else {
                text += element.content 
            }
        }
    }

    return text
}

function getChild(children, childKey){
    return children.find(c => Object.keys(c).indexOf(childKey) > -1)[childKey]
}

function formatString(string){

    let formattedString = he.decode(string)

    formattedString = formattedString.replace(`’`, `'`)
    
    return formattedString
}

await main()
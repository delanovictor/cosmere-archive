import {readFile, writeFile} from "node:fs/promises"
import x2j from "simple-xml-to-json"
import he from "he"

type EpubChapter = {
    chapterTitle: string,
    src: string,
}

type NewEpubExtractor = {
    folder : string
}

type ExtractedParagraph = {
    original: string,
    clean: string
}

export class EpubExtractor {

    folder : string

    ITALIC_CLASSES = [
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

    BOLD_CLASSES = [
        `bold`,
        `ePub-B`
    ]

    constructor(config : NewEpubExtractor){

        if(config.folder.endsWith(`/`)){
            this.folder = config.folder
        }else{
            throw new Error(`folder must end with / (${config.folder})`)
        }
    }


    public async getChapterListFromTOC(){

        const toc = await this.getTOC()
        
        const navMap = this.getChild(toc.ncx.children, `navMap`)

        const chapters : EpubChapter[] = []
    
        for(const c of navMap.children){
            const navPoint = c.navPoint
            
            chapters.push(...this.recursiveExtractChapters(navPoint))
        }
    
        return chapters
    }

    public async getChapterParagraphs(chapter : EpubChapter) : Promise<ExtractedParagraph[]> {
             
        const chapterBuffer = await readFile(`${this.folder}${chapter.src}`)

        const chapterText = this.removeDoctype(chapterBuffer.toString())

        const chapterJSON = x2j.convertXML(chapterText)
        
        const body = this.getChild(chapterJSON.html.children, `body`)
        
        let elements = body.children
        
        const divContainer = elements.find(el => el?.div?.class == `body`)

        if(divContainer){
            const sectionContainer = this.getChild(divContainer.div.children, `section`)

            if(sectionContainer){
                elements = sectionContainer.children
            }else{
                elements = divContainer.div.children
            }
        }

        const paragraphs = elements.map(
            (el) => this.extractText(el)
        ) as ExtractedParagraph[]

        
        return paragraphs.filter(p => p.original.length > 0)
    }


    private removeDoctype(fileText){

        let formattedText = fileText
        
        const startIndex = fileText.indexOf(`<!DOCTYPE`)
        // console.log(`startIndex`, startIndex)

        if(startIndex > -1){
            const endIndex = fileText.indexOf(`>`, startIndex)
            // console.log(`endIndex`, endIndex)

            if(endIndex > -1){
                formattedText = formattedText.substr(0, startIndex) + formattedText.substr(endIndex + 1);
            }
        }
        // console.log(formattedText.substr(0, 400))

        return formattedText
        // const docTypeRegex = /<!DOCTYPE .*>/gs;

        // return fileText.replace(docTypeRegex, ``);
    }

    private async getTOC(){
        const fileBuffer = await readFile(`${this.folder}toc.ncx`)
    
        const fileText = this.removeDoctype(fileBuffer.toString())

        const toc = x2j.convertXML(fileText)

        // await writeFile(`./toc-${Date.now().toString()}.json`, JSON.stringify(toc))

        return toc
    }


    private recursiveExtractChapters(navPoint) : EpubChapter[]{
        const chapters : EpubChapter[] = []

        const navLabel = this.getChild(navPoint.children, `navLabel`)

        const text =  this.getChild(navLabel.children, `text`)

        const content = this.getChild(navPoint.children, `content`)

        const rootChapter : EpubChapter = {
            chapterTitle: this.sanitizeString(text.content),
            src: content.src.split(`#`)[0]
        }

        chapters.push(rootChapter)

        for(const child of navPoint.children){
        
            if(child.navPoint){

                const childChapters = this.recursiveExtractChapters(child.navPoint)

                chapters.push(...childChapters)
            }
        }


        return chapters
    }

    private extractText(parentElement) : ExtractedParagraph {
        const p : ExtractedParagraph = {
            clean : ``,
            original: ``
        }

        // console.log()
        // console.log()
        // console.log(`[${depth}] Sou o elemento:`, parentElement)
        
        for(const key in parentElement){

            const element = parentElement[key]
            // console.log(`Esse eh um dos meus filhos:`, element)

            if(key == `content`){
                p.clean += element
                p.original += element
            }

            if(element.children){
                for(const childElement of element.children){
                    const childP = this.extractText(childElement)

                    p.clean += childP.clean
                    p.original += childP.original
                }
            }

            if(element.content){
                p.clean += element.content

                if(this.ITALIC_CLASSES.indexOf(element.class) > -1){
                    p.original += `<i>${element.content}</i>`    
                }else if(this.BOLD_CLASSES.indexOf(element.class) > -1){
                    p.original += `<b>${element.content}</b>`    
                }else {
                    p.original += element.content 
                }
            }
        }

        p.clean = this.sanitizeString(p.clean)
        p.original = this.sanitizeString(p.original)
        return p
    }

    private sanitizeString(string){

        let formattedString = he.decode(string)
    
        formattedString = formattedString.replace(`’`, `'`)
        
        return formattedString
    }

    private getChild(children : Array<any>, childKey : string){
        const child = children.find(c => Object.keys(c).indexOf(childKey) > -1)

        if(!child){
            return
        }

        return child[childKey]
    }
    
}






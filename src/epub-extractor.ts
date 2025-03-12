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
        console.log(toc)
        
        const navMap = this.getChild(toc.ncx.children, `navMap`)

        const chapters : EpubChapter[] = []
    
        for(const c of navMap.children){
            const navPoint = c.navPoint
            
            chapters.push(...this.recursiveExtractChapters(navPoint))
        }
    
        return chapters
    }

    public async getChapterParagraphs(chapter : EpubChapter) : Promise<string[]> {
             
        const chapterBuffer = await readFile(`${this.folder}${chapter.src}`)

        const chapterText = this.removeDoctype(chapterBuffer.toString())

        const chapterJSON = x2j.convertXML(chapterText)
        
        const body = this.getChild(chapterJSON.html.children, `body`)
        
        
        let elements = body.children
        
        const divContainer = elements.find(el => el?.div?.class == `body`)

        if(divContainer){
            elements = divContainer.div.children
        }

        const paragraphs = elements.map(
            (el) => this.extractText(el)
        ) as string[]

        
        return paragraphs.filter(p => p.length > 0)
    }


    private removeDoctype(fileText){
        const docTypeRegex = /<!DOCTYPE .*>/gm;

        return fileText.replace(docTypeRegex, ``);
    }

    private async getTOC(){
        const fileBuffer = await readFile(`${this.folder}toc.ncx`)
    
        const fileText = this.removeDoctype(fileBuffer.toString())

        const toc = x2j.convertXML(fileText)
    
        await writeFile(`./toc-${Date.now().toString()}.json`, JSON.stringify(toc))

        return toc
    }


    private recursiveExtractChapters(navPoint) : EpubChapter[]{
        const chapters : EpubChapter[] = []

        const navLabel = this.getChild(navPoint.children, `navLabel`)

        const text =  this.getChild(navLabel.children, `text`)

        const content = this.getChild(navPoint.children, `content`)

        const rootChapter : EpubChapter = {
            chapterTitle: this.formatString(text.content),
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

    private extractText(parentElement){
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
                    text +=  this.extractText(childElement)
                }
            }

            if(element.content){
                if(this.ITALIC_CLASSES.indexOf(element.class) > -1){
                    text += `<i>${element.content}</i>`    
                }else if(this.BOLD_CLASSES.indexOf(element.class) > -1){
                    text += `<b>${element.content}</b>`    
                }else {
                    text += element.content 
                }
            }
        }

        return text
    }

    private formatString(string){

        let formattedString = he.decode(string)
    
        formattedString = formattedString.replace(`’`, `'`)
        
        return formattedString
    }

    private getChild(children, childKey){
        return children.find(c => Object.keys(c).indexOf(childKey) > -1)[childKey]
    }
    
}






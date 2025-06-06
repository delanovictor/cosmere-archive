<script lang="ts">
  import { cubicInOut } from 'svelte/easing';
  import Options from './lib/Options.svelte'
  import { fadeScale } from "./transitions";
  import BackToTop from './lib/BackToTop.svelte';
  import { fade } from 'svelte/transition'

  type CountResult = {
    bookId          :string 
    bookName        :string 
    count           :number 
  }

  type SearchResult = {
    bookId          :string 
    chapterId       :string 
    paragraphId     :number    
    paragraphNumber :number    
    content         :string 
    chapterTitle    :string 
    paragraphCount  :number    
    bookName        :string 
  }

  type Paragraphs = {
    previousParagraph ?: SearchResult
    matchedParagraph : SearchResult
    nextParagraph ?: SearchResult
  }

  const BASE_URL = `http://localhost:8080/api`
  const SEARCH_LIMIT = 50


  let countResultByBook : CountResult[] = $state([])

  let notFound = $state(false)

  let searchInput = $state(``)
  let lastSearchInput = ``

  let optionsElement : Options

  let paragraphs : Paragraphs [] = $state([])

  let totalOfOccurances = $state(0)
  let limit = $state(SEARCH_LIMIT)
  let offset = $state(0)


  let exactMatch = $state(false)
  let pStartsWith = $state(false)



  async function handleSearch(){

    if (searchInput.length < 3) {
        return;
    }

    paragraphs = []

    offset = 0;
    limit = SEARCH_LIMIT 

    notFound = false

    const matchedParagraphs : SearchResult[] = await searchForMatch(searchInput)

    lastSearchInput = searchInput


    if(matchedParagraphs && matchedParagraphs.length > 0) {

      setTimeout(()=>{
        scrollToSearchResults()
      }, 100)


      const adjacentParagraphs = await getAdjacentParagraphs(matchedParagraphs)

      const adjacentParagraphsDict : Record<number, SearchResult> = {}

      buildSearchResultCards(matchedParagraphs, adjacentParagraphs)

      countResultByBook = await getSearchCount()

    }else {
      notFound = true
    }
      
  }

  async function handleLoadMore() {

    offset += limit;

    const matchedParagraphs : SearchResult[] = await searchForMatch(lastSearchInput)

    if(matchedParagraphs && matchedParagraphs.length > 0) {

      const adjacentParagraphs = await getAdjacentParagraphs(matchedParagraphs)

      buildSearchResultCards(matchedParagraphs, adjacentParagraphs)

    }
      
  }

  async function buildSearchResultCards(matchedParagraphs:SearchResult[], adjacentParagraphs : SearchResult[]) {
    const adjacentParagraphsDict : Record<number, SearchResult> = {}

   
    for(const p of adjacentParagraphs){
      adjacentParagraphsDict[p.paragraphId] = p
    }

    for(const p of matchedParagraphs){
      

      let escapedInput = searchInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex special chars
      let regex = new RegExp(escapedInput, 'gi');
      p.content = p.content.replace(regex, (match) => `<span class="matched-word">${match}</span>`);

      if(!exactMatch){

        
        //PThis abomination is here to prevent the exact matches from having two span tags


        //Replace exact matches with a random string
        const randomString = `seilacaratosotestandotaligadoxx12345`
        

        //Save the case of the exact matches and replaces them for the random string
        const backup : string[] = []

        p.content = p.content.replace(regex, (match) => {
          backup.push(match)
          return randomString
        })


        //Add span tags to the other matches
        const searchedWords = searchInput.split(` `)
        for(const word of searchedWords){

          escapedInput = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex special chars
          regex = new RegExp(escapedInput, 'gi');

          p.content = p.content.replace(regex, (match) => `<span class="matched-word">${match}</span>`);
        }


        //Undo the replace made to the exact matches

        escapedInput = randomString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex special chars
        regex = new RegExp(escapedInput, 'gi');

        p.content = p.content.replace(regex, (match) => {
          return backup.pop() ?? ``
        })

      }

      paragraphs.push({
        matchedParagraph: p,
        nextParagraph: adjacentParagraphsDict[p.paragraphId + 1],
        previousParagraph: adjacentParagraphsDict[p.paragraphId - 1],
      })
    }

  }


  async function searchForMatch(searchTerm : string) : Promise<SearchResult[]> {
    try {

        const searchRequestData = {
          method: `POST`,
          body: JSON.stringify({
            "searchTerm": searchTerm, 
            "limit" : limit, 
            "offset": offset, 
            "bookIds" : optionsElement.getSelectedOptions(),
            "exactMatch": exactMatch,
            "startsWith": pStartsWith,
          })
        }

        const searchResponse = await fetch(`${BASE_URL}/search`, searchRequestData)

        if (!searchResponse.ok) {
          console.log(`error`, searchResponse)
          return []
        }

        const matchedParagraphs : SearchResult[] = await searchResponse.json();

        return matchedParagraphs

    } catch (error) {
        console.error(error);
        return []
    }

  }

  async function getAdjacentParagraphs(matchedParagraphs : SearchResult[])  : Promise<SearchResult[]>   {
      try{
        const adjacentParagraphIds = matchedParagraphs.flatMap((item) => [item.paragraphId - 1, item.paragraphId + 1])

        const adjacentRequestData = {
          method: `POST`,
          body: JSON.stringify({
            "paragraphIds" : adjacentParagraphIds
          })
        }
        const adjacentResponse = await fetch(`${BASE_URL}/adjacent`, adjacentRequestData)

        if (!adjacentResponse.ok) {
          console.log(`error`, adjacentResponse)
          return []
        }

        const adjacentParagraphs : SearchResult[] = await adjacentResponse.json();


        return adjacentParagraphs

      }catch(e){
        console.log(e)
        return []
      }
  }

  async function getSearchCount()  : Promise<CountResult[]> {
    try {
        if (searchInput.length < 3) {
            return [];
        }

        totalOfOccurances = 0;

        const countRequestData = {
          method: `POST`,
          body: JSON.stringify({
            "searchTerm": searchInput, 
            "bookIds" : optionsElement.getSelectedOptions(),
            "exactMatch": exactMatch,
            "startsWith": pStartsWith,
          })
        }

        const countResponse = await fetch(`${BASE_URL}/count`, countRequestData)

        if (!countResponse.ok) {
          console.log(`error`, countResponse)
          return []
        }

        const countResult : CountResult[] = await countResponse.json();

        totalOfOccurances = countResult.reduce(
          (accumulator, currentValue) => accumulator + currentValue.count,
          0,
        )

        return countResult

      } catch (error) {
        console.error(error);
        return []
      }
  }


  function scrollToSearchResults() {
		const el = document.querySelector(`#result-count-container`);
		if (!el) return;
    el.scrollIntoView({
      behavior: 'smooth'
    });
  }


</script>

<main>

    <div class="title">
      <h1>Cosmere Archive</h1>
    </div>
  
        
    <div class="search">
      <form
        onsubmit={async (e) => {
          e.preventDefault();
          await handleSearch();
        }}
      >
        <input
          bind:value={searchInput}
          class="search-input"
          type="text"
          id="search-input"
          placeholder="Ex: Hoid"
        />
        <button>Search</button>
      </form>
  
      <div class="advance-search-container">
            <label class="exact-match-label">
              <input type="checkbox" bind:checked={exactMatch}/>
              Exact Match
            </label>
  
            <label class="paragraph-starts-with-label">
              <input type="checkbox" bind:checked={pStartsWith}/>
              Paragraph Starts With
            </label>
      </div>

      <Options bind:this={optionsElement}></Options>
  
    </div>
  
    {#if paragraphs.length > 0}
      <div id="result-count-container" transition:fade class="result-count-container">
        <div class="result-count-container-title"> Results by Book</div>
      
  
        {#each countResultByBook as item, index}
          <div class="result-count-item">
            {item.bookName}: {item.count}
          </div>
        
        
        {/each}
  
        <div class="result-count-item">
          <b>Total: {totalOfOccurances}</b>
        </div>
      </div>
  
      
      <div id="search-result-container" transition:fade class="search-result-container">
        {#each paragraphs as item, index}
          <div 
          transition:fadeScale={{
            delay: 250,
            duration: 500,
            easing: cubicInOut,
            baseScale: 0.5
          }}
          class="search-result-item">
  
            <div class="book-name">{@html item.matchedParagraph.bookName}</div>
            <div class="chapter-title">{@html item.matchedParagraph.chapterTitle}</div>
  
            {#if item.previousParagraph}
              <div class="previous-paragraph content">{@html item.previousParagraph.content}</div>
            {/if}
            
            <div 
            transition:fadeScale={{
              delay: 250,
              duration: 500,
              easing: cubicInOut,
              baseScale: 0.5
            }}
            class="matched-paragraph content">{@html item.matchedParagraph.content}</div>
  
            {#if item.nextParagraph}
              <div class="next-paragraph content">{@html item.nextParagraph.content}</div>
            {/if}
  
          </div>
        {/each}
      </div>
  
      {#if totalOfOccurances > limit + offset}
        <div transition:fade class="progress-container">
          <div class="progress">Showing {limit + offset} of {totalOfOccurances} occurances</div>
        </div>
  
        <div transition:fade class="load-more-container">
          <button class="load-more" onclick={(e)=>handleLoadMore()} >Load More</button>
        </div>
      {:else}
        <div  transition:fade class="progress-container">
          <div class="progress">Showing {totalOfOccurances} of {totalOfOccurances} occurances</div>
        </div>
      {/if}
  
    {/if}
  
    {#if notFound } 
      <div transition:fade  class="no-results-container">
        No results found
      </div>
    {/if}
  

  <!-- <p class="footer">
    Created by <a
      href="https://github.com/delanovictor"
      target="_blank"
      rel="noreferrer">delanovictor</a
    >
  </p> -->

  <BackToTop />

</main>

<style>
  .footer{
    text-align: center;
  }

  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }

  @media (max-width: 1000px) {
    main {
      width: 100%;
    }
  }


  @media (max-width: 1800px) {
    main {
      width: 90%;
    }

    .search > form {
      padding: 0px 10px 0px 10px;
    }
  }

  @media (min-width: 1801px) {
    main {
      width: calc(75% - 20px);
    }

    .search > form {
      padding: 0px 10px 0px 10px;
    }
  }

  main {
    display: flex; 
    flex-direction: column;
    justify-content: center;
  }

  .title {
    text-align: center;
  }

  .search {
    text-align: center;
  }

  .progress-container {
    text-align: center;
    margin-bottom: 10px;
  }

  .load-more-container {
    text-align: center;
  }


  .search > form {
    display: flex; 
    flex-direction: row;
    justify-content: space-between;
  }


  @media (max-width: 1000px) {
    .advance-search-container {
      display: flex;
      justify-content: start;
      flex-direction: column;
      text-align: start;
      gap: 1em;
      padding: 9px 10px 10px 20px;
      background-color: #181818;
      border-radius: 10px;
      margin-top: 10px;
    }
  }

  @media (min-width: 1001px) {
    .advance-search-container {
      display: flex; /* or inline-flex */
      justify-content: start;
      flex-direction: row;
      text-align: start;
      gap: 2em;
      padding: 10px 10px 10px 35px;
      background-color: #181818;
      border-radius: 10px;
      margin: 10px;
    }
  }




  .no-results-container{
    text-align: center;
    align-self: center;
    background: #3f4454;
    border-radius: 14px;
    padding: 20px;
    margin: 10px;
  }

  .result-count-container{
    text-align: center;
    align-self: center;
    background: #3f4454;
    border-radius: 14px;
    padding: 20px;
    margin: 10px;
  }

  .result-count-container-title{
    padding-bottom: 10px;
    font-weight: bold;
  }

  .search-result-container {
    text-align: center;
    align-self: center;
  }

  .search-result-item {
    text-align: center;
    border-radius: 24px;
    margin: 10px 10px 30px 10px;
    padding: 20px;
    background: #3f4454;
  }

  .book-name {
    text-align: start;
    font-size: xx-large;
  }

  .chapter-title {
    text-align: start;
    font-size: x-large;
  }

  .content {
    padding: 10px;
  }

  .search-input {
    min-height: 44px;
    border: 1px solid transparent;
    background: #3f4454;
    box-shadow: none;
    border-radius: 24px;
    width: 100%;
    margin: 0px 20px 0px 0px;
    padding: 0px 0px 0px 20px;
  }


</style>

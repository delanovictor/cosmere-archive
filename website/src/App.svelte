<script lang="ts">
  import { cubicInOut } from 'svelte/easing';
  import Options from './lib/Options.svelte'
  import { fadeScale } from "./transitions";


  type ResultByBook = {
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


  let resultsByBook : Array<ResultByBook> = [
    {
      bookId: `twok`,
      bookName: "The Way of Kings",
      count : 15
    },
    {
      bookId: `tfe`,
      bookName: "The Final Empire",
      count : 3
    }
  ]

  let notFound = $state(false)

  let searchInput = $state(``)
  let optionsElement : Options

  let paragraphs : Paragraphs [] = $state([])

  async function searchForMatch() {
      console.log(`searchForMatch`)

      if (searchInput.length < 3) {
          return;
      }

      paragraphs = []

      try {
          const searchRequestData = {
            method: `POST`,
            body: JSON.stringify({
              "searchTerm": searchInput, 
              "limit" : 10, 
              "offset": 0, 
              "bookIds" : optionsElement.getSelectedOptions()
            })
          }

          const searchResponse = await fetch(`http://localhost:8080/search`, searchRequestData)

          if (!searchResponse.ok) {
            console.log(`error`, searchResponse)
            return
          }

          const matchedParagraphs : SearchResult[] = await searchResponse.json();

          console.log('matchedParagraphs', matchedParagraphs)
          
          if(matchedParagraphs && matchedParagraphs.length > 0){
            notFound = false

            const adjacentParagraphIds = matchedParagraphs.flatMap((item) => [item.paragraphId - 1, item.paragraphId + 1])

            const adjacentRequestData = {
              method: `POST`,
              body: JSON.stringify({
                "paragraphIds" : adjacentParagraphIds
              })
            }
            const adjacentResponse = await fetch(`http://localhost:8080/adjacent`, adjacentRequestData)

            if (!adjacentResponse.ok) {
              console.log(`error`, adjacentResponse)
              return
            }

            const adjacentParagraphs : SearchResult[] = await adjacentResponse.json();
            const adjacentParagraphsDict : Record<number, SearchResult> = {}

            for(const p of adjacentParagraphs){
              adjacentParagraphsDict[p.paragraphId] = p
            }

            for(const p of matchedParagraphs){
              p.content = p.content.replaceAll(searchInput, `<b>${searchInput}</b>`)
              paragraphs.push({
                matchedParagraph: p,
                nextParagraph: adjacentParagraphsDict[p.paragraphId + 1],
                previousParagraph: adjacentParagraphsDict[p.paragraphId - 1],
              })
            }

          } else {
            notFound = true
          }

      } catch (error) {
          console.error(error);
      }

      console.log(`paragraphs`, paragraphs)
  }

</script>

<main>
  <!-- <div>
    <a href="https://vite.dev" target="_blank" rel="noreferrer">
      <img src={viteLogo} class="logo" alt="Vite Logo" />
    </a>
    <a href="https://svelte.dev" target="_blank" rel="noreferrer">
      <img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
    </a>
  </div> -->
  <div class="title">
    <h1>Cosmere Archive</h1>
  </div>

      
  <div class="search">
    <form
      onsubmit={async (e) => {
        e.preventDefault();
        await searchForMatch();
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

    <Options bind:this={optionsElement}></Options>

  </div>

  {#if paragraphs.length > 0}
    <div class="result-count-container">
      <div class="result-count-container-title"> Results by Book</div>
    

      {#each resultsByBook as item, index}
        <div class="result-count-item">
          {item.bookName}: {item.count}
        </div>
      
      
      {/each}
    </div>

    
    <div class="search-result-container">
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

    <div>
      <button class="progress">Showing 50/110</button>
    </div>

    <div>
      <button class="load-more">Load More</button>
    </div>
  {/if}

  {#if notFound } 
    <div class="no-results-container">
      No results found
    </div>
  {/if}

  <p>
    Check out <a
      href="https://github.com/sveltejs/kit#readme"
      target="_blank"
      rel="noreferrer">SvelteKit</a
    >, the official Svelte app framework powered by Vite!
  </p>

  <p class="read-the-docs">Click on the Vite and Svelte logos to learn more</p>
</main>

<style>
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

  @media (max-width: 800px) {
    main {
      width: 100%;
    }
  }

  @media (min-width: 801px) {
    main {
      width: calc(75% - 20px);
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

  .search > form {
    display: flex; 
    flex-direction: row;
    justify-content: start;
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
    width: 80%;
    margin: 0px 20px 0px 10px;
    padding: 0px 0px 0px 20px;
  }

</style>

<script lang="ts">
  import Options from './lib/Options.svelte'

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

  let searchInput = $state(``)
  let optionsElement : Options

  let paragraphs : Paragraphs [] = $state([])

  async function searchForMatch() {
      paragraphs = []
      console.log(`searchForMatch`)

      if (searchInput.length < 3) {
          return;
      }

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
            paragraphs.push({
              matchedParagraph: p,
              nextParagraph: adjacentParagraphsDict[p.paragraphId + 1],
              previousParagraph: adjacentParagraphsDict[p.paragraphId - 1],
            })
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
  <h1>Cosmere Archive</h1>
  <div class="search">
    <form
      onsubmit={async (e) => {
        e.preventDefault();
        await searchForMatch();
      }}
    >
      <input
        bind:value={searchInput}
        type="text"
        id="search-input"
        placeholder="Search for a phrase..."
      />
      <button>Search</button>
    </form>

    <Options bind:this={optionsElement}></Options>

  </div>



  <div class="search-result">
    {#each paragraphs as item, index}
      <div class="book-name">{@html item.matchedParagraph.bookName}</div>

      <div class="chapter-title">{item.matchedParagraph.chapterTitle}</div>

      {#if item.previousParagraph}
        <div class="content">{@html item.previousParagraph.content}</div>
        <br>
      {/if}
      
      <div class="content">{item.matchedParagraph.content}</div>

      {#if item.nextParagraph}
        <br>
        <div class="content">{@html item.nextParagraph.content}</div>
      {/if}
      <br>
    {/each}
  </div>

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
  .search {
    max-width: 70%;
    width: 960px;
  }
</style>

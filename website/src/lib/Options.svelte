<script lang="ts">
  import _planetFilter from "./filter-by-planet.json"
  import _seriesFilter from "./filter-by-series.json"

  type BookOption = {
    bookId: string,
    name: string,
    checked?: boolean
  }
  
  type BookGrouping = {
    name: string,
    books: Array<BookOption>,
    checked?: boolean
  }

  const planetFilter = _planetFilter as Array<BookGrouping>
  const seriesFilter = _seriesFilter as Array<BookGrouping>
    
  let currentFilter :  Array<BookGrouping> = $state(seriesFilter)

  let selectedOptions : string[] = []
  
	$effect(() => {
    selectedOptions = []
    for(const group of currentFilter){
      for(const book of group.books){
        if(book.checked){
          selectedOptions.push(book.bookId)
        }
      }
    }
	});


  export function getSelectedOptions() {
    return selectedOptions
  }

  function switchFilterType(event : MouseEvent & {currentTarget: EventTarget & HTMLButtonElement}){
    const target = event.target || event.srcElement;

    //@ts-ignore
    const id = target?.id

    let newFilter : Array<BookGrouping> = []

    if(id == `series-filter-button`){
      newFilter = [...seriesFilter]
    }else if(id == `planet-filter-button`){
      newFilter = [...planetFilter]
    }

    for(const groupKey in newFilter){
      for(const bookKey in newFilter[groupKey].books){
        const book = newFilter[groupKey].books[bookKey]
        
        if(selectedOptions.indexOf(book.bookId) > -1){
          book.checked = true
        }
      }
    }

    currentFilter = newFilter
  }

  function handleGroupCheck(seriesOption: BookGrouping){
    for(const book of seriesOption.books){
      book.checked = seriesOption.checked
    }
  }

  function isBookOption(option: Record<string, any>) : option is BookOption {
    return option.bookId !== undefined
  }

</script>


<div class="filter-container">
  <div class="filter-type-container">
    <div>Filter By</div>
    <button id="series-filter-button" onclick={(e)=>switchFilterType(e)}>Series</button>
    <button id="planet-filter-button" onclick={(e)=>switchFilterType(e)}>Planet</button>
  </div>

  <div class="options-container">
    
    {#each currentFilter as optionGroup}

      <div class="parent-option-container">
        <label class="parent-option">
          <input type="checkbox"   bind:checked={optionGroup.checked} onchange={(e)=> {handleGroupCheck(optionGroup)}}/>
          {optionGroup.name}
        </label>

        <div class="suboptions-container">
          {#each optionGroup.books as option}
          <label>
            <input type="checkbox" bind:checked={option.checked} />
            {option.name}
          </label>
          {/each}
        </div>
      </div>
      
    {/each}
  </div>
</div>

<style>

  @media (max-width: 800px) {
    .options-container {
      flex-direction: column;
    }
      
    .filter-container {
      flex-direction: row;
      margin-top: 10px;
    }
  }

  @media (min-width: 800px) {
    .options-container {
      flex-direction: row;
    }

    .filter-container {
      flex-direction: row;
      margin: 10px;
    }
  }

  
  .filter-container {
    display: flex; /* or inline-flex */
    justify-content: start;
    flex-direction: column;
    text-align: start;
    padding: 10px;
    background-color: #181818;
    border-radius: 10px;
  }

  .filter-type-container {
    display: flex; /* or inline-flex */
    justify-content: start;
    text-align: start;
    flex-direction: row;
  }

  .filter-type-container > div {
    text-align: center;
    align-content: center;
    margin-right: 10px;
    margin-left: 30px;
  }

  .filter-type-container > button {
    background-color: #3f4454;
    margin-right: 10px;
  }

  .options-container {
    display: flex; /* or inline-flex */
    justify-content: space-around;
    text-align: start;
    padding: 10px;
    margin: 10px;
    background-color: #181818;
    border-radius: 10px;
  }

  .parent-option-container{
    padding: 10px;
  }

  .parent-option{
    font-style: bold;
    font-size: 16px;
  }

  .suboptions-container {
    display: flex; /* or inline-flex */
    flex-direction: column;
    justify-content: flex-start;
    text-align: start;
    margin-left: 20px;
    margin-top: 5px;
  }

</style>
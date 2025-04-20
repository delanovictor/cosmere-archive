<script lang="ts">
  import _planetFilter from "./filter-by-planet.json"
  import _seriesFilter from "./filter-by-series.json"
	import { fade } from 'svelte/transition';
  import { fadeScale } from "../transitions";
  import { cubicInOut } from "svelte/easing";
 
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

  type OptionColumn = {
    rows: Array<BookGrouping>
  }

  type Options = Array<OptionColumn>


  const planetFilter = _planetFilter as Options
  const seriesFilter = _seriesFilter as Options
  

  let currentFilter : Options = $state(checkAll(seriesFilter))

  

  let selectedOptions : string[] = []
  
	$effect(() => {
    console.log(`map selected options`)
    selectedOptions = []
    for(const column of currentFilter){
      for(const bookGrouping of column.rows){
        let allChecked = true

        for(const book of bookGrouping.books){
          if(book.checked){
            selectedOptions.push(book.bookId)
          }

          allChecked = (book.checked ?? false) && allChecked
        }

        bookGrouping.checked = allChecked
      }
    }
    console.log(selectedOptions)
	});


  export function getSelectedOptions() {
    return selectedOptions
  }

  function switchFilterType(event : MouseEvent & {currentTarget: EventTarget & HTMLButtonElement}){
    const target = event.target || event.srcElement;

    //@ts-ignore
    const id = target?.id

    let newFilter : Options = []

    if(id == `series-filter-button`){
      newFilter = [...seriesFilter]
    }else if(id == `planet-filter-button`){
      newFilter = [...planetFilter]
    }
    console.log(`seriesFilter`,seriesFilter)
    console.log(`planetFilter`,planetFilter)

    for(const column of newFilter){
      for(const bookGrouping of column.rows){
        let allChecked = true

        for(const bookKey in bookGrouping.books){
          const book = bookGrouping.books[bookKey]

          book.checked = selectedOptions.indexOf(book.bookId) > -1

          allChecked = book.checked && allChecked
        }

        bookGrouping.checked = allChecked

      }
    }

    console.log(newFilter)
    currentFilter = newFilter
  }

  function handleGroupCheck(seriesOption: BookGrouping){
    for(const book of seriesOption.books){
      book.checked = seriesOption.checked
    }
  }

  function checkAll(opt : Options) : Options {
    console.log(`checkAll`)
    const optAllChecked = [...opt]
    
    for(const column of optAllChecked){
      for(const bookGrouping of column.rows){
        bookGrouping.checked = true
        for(const bookKey in bookGrouping.books){
          const book = bookGrouping.books[bookKey]
          book.checked = true
        }
      }
    }

    return optAllChecked
  }

</script>


<div class="filter-container">
  <div class="filter-type-container">
    <div>Filter By</div>
    <button id="series-filter-button" onclick={(e)=>switchFilterType(e)}>Series</button>
    <button id="planet-filter-button" onclick={(e)=>switchFilterType(e)}>Planet</button>
  </div>

  <div 
  transition:fadeScale={{
		delay: 250,
		duration: 500,
		easing: cubicInOut,
		baseScale: 0.5
	}}
  
  class="options-container">
    
    {#each currentFilter as optionGroup}

      <div 
      
      class="column-container">
        
        {#each optionGroup.rows as row}

        <div class="row-container">

          <label class="parent-option">
            <input type="checkbox"   bind:checked={row.checked} onchange={(e)=> {handleGroupCheck(row)}}/>
            {row.name}
          </label>

          <div class="option-items-container">
            {#each row.books as option}
                <label>
                  <input type="checkbox" bind:checked={option.checked} />
                  {option.name}
                </label>
            {/each}
          </div>

        </div>

        {/each}

      </div>
    {/each}
  </div>
</div>

<style>

  @media (max-width: 800px) {
    .options-container {
      flex-direction: column;
      display: flex;
    }
      
    .filter-container {
      flex-direction: row;
      margin-top: 10px;
    }
  }

  @media (min-width: 800px) {
    .options-container {
      flex-direction: row;
      justify-content: space-evenly;
      display: flex;
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
    padding: 10px 10px 30px 10px;
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

  .column-container {
    display: flex; /* or inline-flex */
    flex-direction: column;
    text-align: start;
  
    background-color: #181818;
    border-radius: 10px;
  }

  .row-container {
    display: flex; /* or inline-flex */
    flex-direction: column;

    padding-top: 10px;
  }

  .parent-option{
    font-style: bold;
    font-size: 16px;
    padding: 10px;
  }

  .option-items-container {
    display: flex; /* or inline-flex */
    flex-direction: column;
    justify-content: flex-start;
    text-align: start;
    margin-left: 20px;
    margin-top: 5px;
  }

</style>
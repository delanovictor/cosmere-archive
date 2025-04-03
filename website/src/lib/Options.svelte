<script lang="ts">

  type BookOption = {
    bookId: string,
    name: string,
    checked?: boolean
  }
  
  type SeriesOptionGroup = {
    name: string,
    books: Array<BookOption>,
    checked?: boolean
  }

  type Options = Array<BookOption | SeriesOptionGroup>

  let options : Options = $state([
    {
      name: `Stormlight Archive`,
      books: [
        {
            bookId: `twok`,
            name: `The Way of Kings`,
        },
        {
            bookId: `wor`,
            name: `Words of Radiance`,
        },
        {
            bookId: `edge`,
            name: `Edgedancer`,
        },
        {
            bookId: `ob`,
            name: `Oathbringer`,
        },
        {
            bookId: `dawn`,
            name: `Dawnshard`,
        },
        {
            bookId: `row`,
            name: `Rhythm of War`,
        },
      ]
    },
    {
      name: `Mistborn Era I`,
      books: [
        {
            bookId: `tfe`,
            name: `The Final Empire`,
        },
        {
            bookId: `woa`,
            name: `Well of Ascencion`,
        },
        {
            bookId: `hoa`,
            name: `Hero of Ages`,
        }
      ]
    },
    {
      name: `Mistborn Era II`,
      books: [
        {
            bookId: `taol`,
            name: `The Alloy of Law`,
        },
        {
            bookId: `sos`,
            name: `Shadows of Self`,
        },
        {
            bookId: `bom`,
            name: `Bands of Mourning`,
        },
        {
            bookId: `tlm`,
            name: `The Lost Metal`,
        }
      ]
    },
    {
      name: `Standalones`,
      books: [ 
        {
          bookId: `wbk`,
          name: `Warbreaker`,
        },
        {
          bookId: `elt`,
          name: `Elantris`,
        },
        {
          bookId: `tress`,
          name: `Tress of the Emerald Sea`,
        },
        {
          bookId: `yumi`,
          name: `Yumi and the Nightmare Painter`,
        },
        {
          bookId: `tsm`,
          name: `The Sunlit Man`,
        },
      ]
    },
    {
      name: `Arcanum Unbounded`,
      books: [
        {
            bookId: `tfe`,
            name: `The Hope of Elantris`,
        },
        {
            bookId: `tem`,
            name: `The Eleventh Metal`,
        },
        {
            bookId: `tes`,
            name: `The Empereor's Soul`,
        },
        {
            bookId: `jak`,
            name: `Allomancer Jak and the Pits of Eltania`,
        },
        {
            bookId: `sfsfh`,
            name: `Shadows for Silence in the Forests of Hell`,
        },
        {
            bookId: `sod`,
            name: `Sixth of Dusk`,
        },
        {
            bookId: `msh`,
            name: `Mistborn: Secret History`,
        }
      ]
    },
  ])

  let selectedOptions : string[] = []
  
	$effect(() => {
    selectedOptions = []
    for(const opt of options){

      if(isBookOption(opt)){

        if(opt.checked){
          selectedOptions.push(opt.bookId)
        }

      }else{

        for(const subOpt of opt.books){
          if(subOpt.checked){
            selectedOptions.push(subOpt.bookId)
          }
        }
      }
    }
    console.log(selectedOptions)
	});


  export function getSelectedOptions() {
    return selectedOptions
  }

  function handleGroupCheck(seriesOption: SeriesOptionGroup){
    for(const book of seriesOption.books){
      book.checked = seriesOption.checked
    }
  }

  function isBookOption(option: Record<string, any>) : option is BookOption {
    return option.bookId !== undefined
  }

</script>

<div class="options-container">
  {#each options as opt}
    {#if isBookOption(opt)}

    <div>
      <label>
        <input type="checkbox" bind:checked={opt.checked}/>
        {opt.name}
      </label>
    </div>


    {:else}
    <div>
      <label>
        <input type="checkbox" bind:checked={opt.checked} onchange={(e)=> {handleGroupCheck(opt)}}/>
        {opt.name}
      </label>

      <div class="suboptions-container">
        {#each opt.books as subOpt}
        <label>
          <input type="checkbox" bind:checked={subOpt.checked} />
          {subOpt.name}
        </label>
        {/each}
      </div>
    </div>
    
    {/if}
  {/each}
</div>

<style>

  .options-container {
    display: flex; /* or inline-flex */
    flex-direction: row;
    justify-content: space-around;
  }

  .suboptions-container {
    display: flex; /* or inline-flex */
    flex-direction: column;
    justify-content: flex-start
  }

</style>
const options = [
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
      folder: `./html/edge/`,
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

// Function to search books
async function searchBooks() {
    const searchInput = document.getElementById('search-input').value;
    const resultsContainer = document.getElementById('results-container');

    // Clear previous results
    resultsContainer.innerHTML = '';

    if (!searchInput) {
        resultsContainer.innerHTML = '<p>Please enter a search term.</p>';
        return;
    }

    try {
      
        const requestData = {
          method: `POST`,
          body: JSON.stringify({
            "searchTerm": searchInput, 
            "limit" : 10, 
            "offset": 0, 
            "bookIds" : ["edge", "dawn"]
          })
        }

        console.log(requestData)
        // Make an API call to the backend with the search term
        const response = await fetch(`http://localhost:8080/search`, requestData)
        console.log(response)

       
        // Check if the response is ok (status 200)
        if (response.ok) {
            const results = await response.json();

            console.log(results)

            if (results.length === 0) {
                resultsContainer.innerHTML = '<p>No results found.</p>';
            } else {
                results.forEach(book => {
                    const resultItem = document.createElement('div');
                    resultItem.classList.add('result-item');

                    resultItem.innerHTML = `
                        <h3>${book.bookName} - Chapter ${book.chapterTitle}, Paragraph ${book.paragraphNumber}</h3>
                        <p class="content">${book.content}</p>
                        <p><strong>Paragraph Count:</strong> ${book.paragraphCount}</p>
                    `;

                    resultsContainer.appendChild(resultItem);
                });
            }
        } else {
            resultsContainer.innerHTML = '<p>Something went wrong. Please try again later.</p>';
        }
    } catch (error) {
        resultsContainer.innerHTML = '<p>Failed to fetch data. Please check your connection.</p>';
        console.error(error);
    }
}

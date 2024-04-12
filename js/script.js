document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        filterPlaces();
    });
});

function filterPlaces() {
    const selectedFilters = Array.from(document.querySelectorAll('.filter-option input[type="checkbox"]:checked')).map(el => el.value);
    
    document.querySelectorAll('.place-card').forEach(card => {
        const categories = [card.dataset.category1]; // Start with the main category
        // Add additional categories if they exist
        if(card.dataset.category2) {
            categories.push(card.dataset.additionalCategory1);
        }

        if(card.dataset.category3) {
            categories.push(card.dataset.additionalCategory1);
        }

        if(card.dataset.category4) {
                categories.push(card.dataset.additionalCategory1);
        }
        if(card.dataset.category5) {
            categories.push(card.dataset.additionalCategory1);
         }

         if(card.dataset.category6) {
            categories.push(card.dataset.additionalCategory1);
         }



        // Repeat for more catagory 

        // Check if any of the card's categories match any of the selected filters
        const isMatch = categories.some(category => selectedFilters.includes(category));
        
        card.style.display = isMatch || selectedFilters.length === 0 ? '' : 'none';
    });
}

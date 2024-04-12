// script.js
var map;
var service;
var infowindow;
var markers = [];
var gmarkers = [];
var mouseIn = false;


// Initialize and add the map
function initMap() {
    var singapore = new google.maps.LatLng(1.28967000,103.85007000); 

    //set the center to be the center coordinates of Singapore and the map to zoom level 15 and 
    map = new google.maps.Map(document.getElementById('map'), {
        center: singapore,
        zoom: 15 
    });

    //get input from searchbar input 
    var input = document.getElementById('place-search')
    //enable autocomplete feature of API to allow for prediction search results 
    let autocomplete = new google.maps.places.Autocomplete(input)
    autocomplete.bindTo('bounds', map) 
    
    //create custom variable 
    let marker = new google.maps.Marker({
        map: map
    })
     
    google.maps.event.addListener(autocomplete,'place_changed', () => {
       clearMarkers();
       
        let place = autocomplete.getPlace()
        if(!place.geometry){
            window.alert("No details available for input:  '" + place.name +"'");
            return;
        }

        
        if(place.geometry.viewport){
            map.fitBounds(place.geometry.viewport)
        }
        else{
            map.setCenter(place.geometry.location)
            map.setZoom(15)
        }
       
        marker.setPosition(place.geometry.location)
        marker.setVisible(true)
        if (place.types.includes('tourist_attraction') || place.types.includes('route')) {
            // Call searchForPlaces for nearby search
            searchForPlaces();
            console.log('Place Types:', place.types);
        } else {
            // Call performQuerySearch for specific place query
            performQuerySearch(place.name);
            console.log('Place Types:', place.types);
        }
        
       //var selectedPlaceType = document.getElementById('place-type').value;
       document.getElementById('place-type').addEventListener('change', function () {
            var selectedPlaceType = this.value;
            searchForPlaces(selectedPlaceType);// Search for new places based on the updated place type
        });

        
    });


    service = new google.maps.places.PlacesService(map);

}

//executes createMarker function every time the request is a valid place 
function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      for (var i = 0; i < results.length; i++) {
        var place = results[i];
        createMarker(results[i]);
      }
    }
}

function setMapOnAll(map) {
    for (let i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
  }

function hideMarkers() {
    setMapOnAll(null);
}

function clearMarkers() {
    hideMarkers();
    markers = [];
}

// img = document.getElementById("img1");
// Function to increase photo size
function enlargePhoto(photo) {
    // Set photo size to 1.5 times original
    photo.style.transform = "scale(5)";
    // Animation effect
    photo.style.transition = "transform 0.25s ease";
}

// Function to reset photo size
function resetPhoto(photo) {
    // Set photo size to original
    photo.style.transform = "scale(1)";
    photo.style.transition = "transform 0.25s ease";
}
function createMarker(place){

    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });

    markers.push(marker);

    var label = new google.maps.InfoWindow({
        content: place.name,
        pixelOffset: new google.maps.Size(25, 0), // Adjust position of label
    });
    label.open(map);


    var card = document.createElement('div');
    card.className = 'place-card';
    card.innerHTML = `
        <div class="place-card">
        <h3 href=>${place.name}</h3>
        ${place.vicinity ? `<p>${place.vicinity}</p>` : '<p>No address available</p>'}
        <p>Rating:  ${getStarRating(place.rating)}</p>
            ${place.website ? `<p>Website: <a href="${place.website}" target="_blank">${place.website}</a></p>` : ''} 
            <div class="text-center">
                <p> <span class="badge badge-primary rounded-pill">${place.types[0]}</span></p>
                ${place.photos && place.photos.length > 0 ? 
                    `
                        <div id="carousel-${place.place_id}" class="carousel slide" data-ride="carousel">
                            <div class="carousel-inner">
                                ${place.photos.map((photo, index) => `
                                    <div class="carousel-item ${index === 0 ? 'active' : ''}">
                                        <img src="${photo.getUrl({ maxWidth: 500, maxHeight: 500 })}" class="d-block w-100" alt="Place Photo">
                                    </div>
                                `).join('')}
                            </div>
                            <a class="carousel-control-prev" href="#carousel-${place.place_id}" role="button" data-slide="prev">
                                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                                <span class="sr-only">Previous</span>
                            </a>
                            <a class="carousel-control-next" href="#carousel-${place.place_id}" role="button" data-slide="next">
                                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                                    <span class="sr-only">Next</span>
                            </a>
                        </div>
                    </div>` : '<p>No photos available</p>'}
                
            </div>
        </div>
    `;
    // Append the card to the container in your HTML
    document.getElementById('place-cards-container').appendChild(card);
    
    let popup = document.getElementById('popUpBox');

    // var moreDetailsBtn = card.querySelector('.more-details-btn');
    // moreDetailsBtn.addEventListener('click', function() {
    //     console.log("Clicked Place:", place); // Log the place object
    //     Alert.render();
    // });
    var images = card.querySelectorAll('img');
    images.forEach(function(photo) {
        photo.addEventListener('click', function() {
            enlargePhoto(photo);
        });
        photo.addEventListener('mouseout', function() {
            resetPhoto(photo);
        });
    });

    var closeInfoWindowTimer;
    infowindow = new google.maps.InfoWindow()
    marker.addListener('mouseover', function (){
        clearTimeout(closeInfoWindowTimer); // Clear any existing timer
        openInfoWindow(place, marker); // Open the info window
    });
    marker.addListener('mouseout', function() {
        // Set a timer to close the info window after 1 second
        closeInfoWindowTimer = setTimeout(function() {
            infowindow.close(); // Close the info window
        }, 2000);
    });

    
    marker.addListener('click', function() {
        var request = {
            placeId: place.place_id,
            fields: ['name', 'types', 'formatted_address', 'rating', 'user_ratings_total', 'current_opening_hours', 'opening_hours', 'price_level', 'photo', 'website'],
        };

        service = new google.maps.places.PlacesService(map);
        service.getDetails(request, function(placeDetails, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                openPopup(placeDetails); // Pass placeDetails to openPopup function
            }
        });
    });
        
    
    // Close the popup when the map is clicked
    map.addListener('click', function() {
        closePopup();
    });
    
}

function openInfoWindow(place, marker){
    var request = {
        placeId: place.place_id,
        fields: ['name', 'types', 'rating', 'user_ratings_total', 'opening_hours', 'price_level', 'photo', 'formatted_address'], 
        
    };

    
    service = new google.maps.places.PlacesService(map);
    service.getDetails(request, function(placeDetails, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
             var contentString = '<div><h3>' + placeDetails.name + '</h3>' + '<br>' +
                 (placeDetails.types.length > 0 ? placeDetails.types[0] : 'Not available') + '<br>' +
                placeDetails.rating + '' + (getStarRating(place.rating)  || 'Not available') + ' (' + (placeDetails.user_ratings_total || 'Not available') + ')' +'<br>'; // Total ratings
            
            // Check if opening hours are available
            if (placeDetails.opening_hours) {
                // Check if open now
                const isOpenNow = place.opening_hours.isOpen() ? 'Open' : 'Closed';
                
                
                if(isOpenNow){
                    console.log(`${place.name} is currently open .`);
                    contentString += 'Open Now: Open' + '<br>'; // Open now status
                }
                
            } else {
                contentString += 'Open Hours: Not available <br>'; // Opening hours not available
            }
            
            // Check if price level is available
            if (placeDetails.price_level) {
                contentString += 'Price Range: ' + getPriceRange(placeDetails.price_level) + '<br>'; // Price range
            } else {
                contentString += 'Price Range: Not available<br>'; // Price range not available
            }
            if (placeDetails.photos && placeDetails.photos.length > 0) {
                // Get the URL of the first photo
                var photoUrl = placeDetails.photos[0].getUrl({ maxWidth: 200, maxHeight: 200 });
                contentString += '<img src="' + photoUrl + '" alt="Place Photo">'; // Display photo
            } else {
                contentString += '<p>No photos available</p>'; // No photos available
            }
            contentString += '</div>';


            //var infowindow = new google.maps.InfoWindow()
            infowindow.setContent('<div onmouseout="mouseOutsideInfowindow()" onmouseover="mouseinsideInfowindow()">'+ contentString + '</div>');
            infowindow.open(map, marker);
            mouseIn = false;

        } else {
            console.error('Error fetching place details:', status); 
        }
    });

}

// Function to get price range as number of dollar signs
function getPriceRange(priceLevel) {
    var dollarSigns = '';
    for (var i = 0; i < priceLevel; i++) {
        dollarSigns += '$';
    }
    return dollarSigns;
}


function openPopup(placeDetails) {
    var popupContent = '<div><h2>' + placeDetails.name + '</h2>' + '<br>' +
        (placeDetails.types.length > 0 ? placeDetails.types[0] : 'Not available') + '<br>' +
        placeDetails.rating + '' + (getStarRating(placeDetails.rating) || 'Not available') + ' (' + (placeDetails.user_ratings_total || 'Not available') + ')' + '<br>' +
        (placeDetails.photos && placeDetails.photos.length > 0 ? '<img src="' + placeDetails.photos[0].getUrl({ maxWidth: 200, maxHeight: 200 }) + '" alt="Place Photo">' : '<p>No photos available</p>') + '<br>' +
        
        '<i class="fas fa-map-marker-alt"></i> ' + 'Address:</strong> ' + (placeDetails.formatted_address || 'Not available') + '</p>' +
        '<i class="fas fa-clock"></i> '+ (placeDetails.opening_hours && placeDetails.opening_hours.weekday_text ? placeDetails.opening_hours.weekday_text.join('<br>') : 'Not available') + '<br>' +
        '<i class="fas fa-globe"></i> ' + (placeDetails.website ? '<a href="' + placeDetails.website + '" target="_blank">' + placeDetails.website + '</a>' : 'Not available') + '</p>' +
        '</div>';

        

    document.getElementById('popup-content').innerHTML = popupContent;
    document.getElementById('popup').style.left = '0'; // Slide in the popup from the left
}

// Function to close the popup
function closePopup() {
    document.getElementById('popup').style.left = '-300px'; // Slide out the popup to the left
}

function toggleOpeningHours() {
    var openingHoursDetails = document.getElementById('opening-hours-details');
    var showMoreButton = document.querySelector('button');

    if (openingHoursDetails.style.display === 'none') {
        openingHoursDetails.style.display = 'block';
        showMoreButton.textContent = 'Show Less';
    } else {
        openingHoursDetails.style.display = 'none';
        showMoreButton.textContent = 'Show More';
    }
}

function getStarRating(rating) {
    var stars = '';
    var fullStars = Math.floor(rating);
    var halfStar = rating % 1 !== 0;

    for (var i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }

    if (halfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
        fullStars++; // Increment fullStars to calculate remaining empty stars
    }

    // Fill the remaining stars with empty stars
    for (var j = fullStars; j < 5; j++) {
        stars += '<i class="far fa-star"></i>';
    }
    return stars;
}



function mouseinsideInfowindow() {
    mouseIn = true;
}
 function mouseOutsideInfowindow() {
   if(mouseIn) {
     infowindow.close();
     mouseIn = false;
   }   
}



//handle search queries 
// we have search based on text search and search based on nearby search 
// search for places will create markers based on the selectedplace type 
function searchForPlaces() {
    
    var selectedPlaceType = document.getElementById('place-type').value;
    var request = {
        location: map.getCenter(), // Use the center of the map as the search location
        radius: '500',
        type: [selectedPlaceType]
    }

    var service = new google.maps.places.PlacesService(map);

    // Perform a nearby search based on the request object
    service.nearbySearch(request, function(results, status) {
        // Check if the status is OK
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Iterate through the results
            clearMarkers();
            clearPlaceCards();
            for (var i = 0; i < results.length; i++) {
                // Create a marker for each place in the results
                createMarker(results[i]);
                
            }
        } else {
            // If the status is not OK, log an error message
            console.error('Error performing nearby search:', status);
        }
    });
}   

// this function will return only the marker of the searched place
function performQuerySearch(query) {
    var request = {
        query: query,
        fields: ['name', 'geometry']
    };

    var service = new google.maps.places.PlacesService(map);

    // Perform a text search based on the request object
    service.textSearch(request, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Clear existing markers and place cards
            clearMarkers();
            clearPlaceCards();
            // Iterate through the results
            for (var i = 0; i < results.length; i++) {
                // Create a marker for each place in the results
                createMarker(results[i]);
            }
            if (results.length === 1) {
                createMarker(results[0]);
                map.setCenter(results[0].geometry.location);
                map.setZoom(15);
            }
        } else {
            // If the status is not OK, log an error message
            console.error('Error performing query search:', status);
        }
    });
}


function clearPlaceCards() {
    var placeCardsContainer = document.getElementById('place-cards-container');
    placeCardsContainer.innerHTML = ''; // Clear the HTML content of the container
}
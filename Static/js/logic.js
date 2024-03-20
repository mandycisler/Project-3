// Center point
var mapAirBnb = L.map("map", {
    center: [37.7544, -122.4477],
    zoom: 13,
});

// Base tile layers
var streetMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mapAirBnb);

// Define price categories and corresponding colors
var priceCategories = [
    { min: 0, max: 100, color: 'green' },      // Lower price range
    { min: 100, max: 300, color: 'yellow' },    // Low-medium price range
    { min: 300, max: 600, color: 'purple' },    // Medium price range
    { min: 600, max: 1000, color: 'blue' },     // Medium-high price range
    { min: 1000, max: Infinity, color: 'red' }, // High-medium price range
];

var markersLayer = L.layerGroup(); // Layer group for markers

// Add district boundaries
fetch('https://raw.githubusercontent.com/mandycisler/Project-3/main/Resources/listings.geojson') // Replace 'listings.geojson' with the path to your GeoJSON file
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: {
                color: 'blue',    // Change boundary color as needed
                weight: 2,        // Change boundary weight as needed
                fillOpacity: 0.2  // Adjust opacity as needed
            }
        }).addTo(mapAirBnb);
    })
    .catch(error => console.error('Error loading district boundaries:', error));

d3.json('https://raw.githubusercontent.com/mandycisler/Project-3/main/Resources/listings_cleaned.json').then(function (data) {
    // Loop through each listing
    data.forEach(function (listing) {
        // Extract latitude and longitude
        var latitude = parseFloat(listing.latitude);
        var longitude = parseFloat(listing.longitude);

        // Determine the price category
        var price = listing.price
        var color = getPriceCategoryColor(price);
        if (listing.host_is_superhost === "f") {
            listing.host_is_superhost = "No";
        } else if (listing.host_is_superhost === "t") {
            listing.host_is_superhost = "Yes";
        }

        // Create marker for each listing with custom color
        var marker = L.circleMarker([latitude, longitude], {
            color: 'black', // Border color
            fillColor: color,
            fillOpacity: 0.6,
            radius: 5
        });

        // Customize popup content
        var popupContent = "<b>Name: </b>" + listing.name +
            "<br><b>Price: </b>" + listing.price +
            "<br><b>Property Type: </b>" + listing.property_type +
            "<br><b>Superhost: </b>" + listing.host_is_superhost +
            "<br><b>Neighbourhood: </b>" + listing.neighbourhood_cleansed +
            "<div class='popup-image'><img src='" + listing.picture_url + "' alt='Listing Image'></div>" +
            "<br><a href='" + listing.listing_url + "'>View Listing</a>";

        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
    });

    // Add markers layer to the map
    markersLayer.addTo(mapAirBnb);

    var legend = L.control({ position: 'topright' });
    legend.onAdd = function () {
        var div = L.DomUtil.create('div', 'legend');
        div.innerHTML += '<h4><b>Price $ Per Night</b></h4>';
        for (var i = 0; i < priceCategories.length; i++) {
            div.innerHTML +=
                '<i style="background:' + priceCategories[i].color + '"></i> ' +
                priceCategories[i].min + (priceCategories[i].max === Infinity ? '+' : ' - ' + priceCategories[i].max) + '<br>';
        }
        return div;
    };
    legend.addTo(mapAirBnb);

    // Layer switcher control
    var baseLayers = {
        "Choose the listings based on the price range": streetMapLayer
    };

    var overlayLayers = {
        "All listings": markersLayer
    };

    L.control.layers(baseLayers, overlayLayers, { position: 'topleft' }).addTo(mapAirBnb);


    // Price category switcher control
    var priceSwitcher = L.control({ position: 'bottomright' });
    priceSwitcher.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'switcher');
        div.innerHTML = '<h4>Show Pins Based on Price</h4>';
        priceCategories.forEach(function (category) {
            div.innerHTML += '<input type="checkbox" id="' +
                category.color + '" class="price-checkbox" checked>' +
                '<label for="' + category.color + '">' +
                category.min + '-' +
                (category.max === Infinity ? '∞' : category.max) + '</label><br>';
        });
        return div;
    };
    priceSwitcher.addTo(mapAirBnb);

    // Event listener for checkbox changes
    document.querySelectorAll('.price-checkbox').forEach(function (checkbox) {
        checkbox.addEventListener('change', function () {
            var color = this.id; // Get color from checkbox id
            toggleMarkers(color);
        });
    });

}).catch(function (error) {
    console.log("Error loading JSON:", error);
});

// Function to get color based on price category
function getPriceCategoryColor(price) {
    for (var i = 0; i < priceCategories.length; i++) {
        if (price >= priceCategories[i].min && price < priceCategories[i].max) {
            return priceCategories[i].color;
        }
    }
}

// Function to toggle marker visibility based on selected color
function toggleMarkers(color) {
    // Get the colors of the checked price switchers
    var checkedColors = Array.from(document.querySelectorAll('.price-checkbox'))
                         .filter(checkbox => checkbox.checked)
                         .map(checkbox => checkbox.id);

    // Loop through each marker
    markersLayer.eachLayer(function (marker) {
        var markerColor = marker.options.fillColor;

        // Check if the marker's color is among the checked colors
        if (checkedColors.includes(markerColor)) {
            // If the marker's color is among the checked colors, add it to the map if it's not already there
            if (!marker._map) {
                mapAirBnb.addLayer(marker);
            } 
        } else {
            // If the marker's color is not among the checked colors, remove it from the map if it's currently there
            if (marker._map) {
                mapAirBnb.removeLayer(marker);
            }
        }
    });
}
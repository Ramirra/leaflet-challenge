//create tile layers for background 
var defaultMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

//grayscale layer
var grayScale  = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

//watercoler layer
var waterColor = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 1,
	maxZoom: 16,
	ext: 'jpg'
});

//topography layer
var topo  = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

//create basemaps object
var basemaps = {
    Grayscale: grayScale,
    Watercolor: waterColor,
    Topography: topo,
    Default: defaultMap
};

//create map object
var myMap = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 3,
    layers: [defaultMap, grayScale, waterColor, topo]
});

//add default to map object
defaultMap.addTo(myMap);


//retrieve data for tectonic plates and add to map
var tectonicPlates = new L.layerGroup(); //variable to hold tectonic plates layers

const url = 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json'

//api call for tectonic plates data
d3.json(url).then(function(plateData){
    //console.log(plateData) to confirm data loads

    //load data using geoJson and add to tectonic plates layer group
    L.geoJson(plateData, {
        //add styling for visible lines
        color: "yellow",
        weight: 1
    }).addTo(tectonicPlates);
});

//add tectonic plates to map
tectonicPlates.addTo(myMap);

//retrieve data for eathquakes and add to map
var earthquakes = new L.layerGroup(); //variable to hold tectonic plates layers

const quake_url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson'

//api call for earthquake data
d3.json(quake_url).then(function(earthquakeData){
    //console.log(earthquakeData) to confirm data loads

    //function to determine color based on data point
    function dataColor(depth){
        if (depth > 90) 
            return "red";
        else if (depth > 70)
            return "#fc4903";
        else if (depth > 50)
            return "#fc8403";
        else if (depth > 30)
            return "#fcad03";
        else if (depth > 10)
            return "#cafc03";
        else
            return "green"
    }

    //function to determine size of radius based on data point
    function radiusSize(mag){
        if (mag == 0)
            return 1; //to visualize 0 mag earthquakes 
        else 
            return mag * 3; //proportions size based on mag
    }

    //add on to style for each data point
    function dataStyle(feature){
        return {
            opacity: 1,
            fillOpacity: 0.5,
            fillColor: dataColor(feature.geometry.coordinates[2]),
            color: "000000",
            radius: radiusSize(feature.properties.mag),
            weight: 0.5
        }
    }

    //add geoJson data to earthquake layer group
    L.geoJson(earthquakeData, {
        //make circle marker on map based on feature 
        pointToLayer: function(feature, latLng){
            return L.circleMarker(latLng);
        },
        //set style for each marker
        style: dataStyle,
        //add popups
        onEachFeature: function(feature, layer){
            layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
            Depth: <b>${feature.geometry.coordinates[2]}</b><br>
            Location: <b><${feature.properties.place}/b>`);
        }
    }).addTo(earthquakes);

});

//add earthquakes to map
earthquakes.addTo(myMap);

//add overlay for tectonic plates and earthquakes
var overlays = {
    "Tectonic Plates": tectonicPlates,
    "Earthquakes": earthquakes
};

//add layer control
L.control
    .layers(basemaps, overlays)
    .addTo(myMap);

//add legend to map
var legend = L.control({
    position: "bottomright"
});

//add properties for legend
legend.onAdd = function() {
    //create div for legend 
    let div = L.DomUtil.create("div", "info legend");

    //create intervals
    let intervals = [-10, 10, 30, 50, 70, 90];

    //set colors to intervals
    let colors = [
        "green",
        "#cafc03",
        "#fcad03",
        "#fc8403",
        "#fc4903",
        "red"
    ];

    div.innerHTML += "<h4>Depth in KM</h4>"

    /*loop through intervals and colors and generate label 
    with a coloed square for each interval*/
    for (var i=0; i < intervals.length; i++)
    {
        //inner html to set square for each interval and label
        div.innerHTML += "<i style='background: "
        + colors[i]
        + "'></i> "
        + intervals[i]
        + (intervals[i + 1] ? "&ndash;" + intervals[i + 1] + "<br>" : "+");
    }
    return div;
};

//add legend to map
legend.addTo(myMap)
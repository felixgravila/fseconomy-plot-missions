
const planes = ['Boeing 737-800', 'Boeing 747-400', 'Airbus A320', 'Airbus A321']
for(idx in planes){
    $('#plane-select').append(`<option value="${idx}">${planes[idx]}</option>`)
}

let map_initialised = false;
let the_map;

function plot(){
    const plane = planes[$('#plane-select').val()];
    const access = $('#input-access-key').val();
    console.log("PLOTTING", access, plane);

    if(!map_initialised){
        initialise_map()
    }

    
}

function transitionOpen(){
    $("#map-jumbo").addClass("transition")
    $("#map-jumbo").addClass("expanded")
}

function initialise_map(){
    map_initialised = true;
    the_map = L.map('map').setView([20, 0], 3);

    mapbox = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1
    });

    googleHybrid = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3'],
        attribution: 'Map data ©2020 Google'
    });

    googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3'],
        attribution: 'Map data ©2020 Google'
    });

    googleTerrain = L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',{
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3'],
        attribution: 'Map data ©2020 Google'
    });

    the_map.addLayer(mapbox)

    var baseMaps = {
        "Mapbox": mapbox,
        "Google Hybrid": googleHybrid,
        "Google Satellite": googleSat,
        "Google Terrain": googleTerrain
    };

    L.control.layers(baseMaps).addTo(the_map)

    $("#map-jumbo").addClass("init")
    window.setTimeout(transitionOpen, 100)

}

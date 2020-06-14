
const planes = ['Boeing 737-800', 'Boeing 747-400', 'Airbus A320', 'Airbus A321', 'Boeing 727-100/200']
planes.sort()
for(idx in planes){
    $('#plane-select').append(`<option value="${idx}">${planes[idx]}</option>`)
}

// If should use saved example csvs for testing
const mock = false

let map_initialised = false;
let the_map;
let on_map = [];
let access;
const icaodata = new Map();

$.ajax({
    url: 'icaodata_small.csv',
    type: 'GET',
    success: function(data){
        let result = $.csv.toArrays(data);
        result = result.slice(1)
        for (airp of result) {
            icaodata[airp[0]] = [parseFloat(airp[1]), parseFloat(airp[2])]
        }
    },
    error: handle_ajax_err
});


const proxy = 'https://cors-anywhere.herokuapp.com/';

function handle_ajax_err(xhr, status){
    console.log(xhr);
    console.log(status);
}

function handle_planes_get(data){
    const result = $.csv.toArrays(data); // create array from csv
    const header = result[0]
    const planes = result.slice(1) // remove header

    if ( planes.length <= 1 ) {
        alert("Something went wrong, possibly wrong access key. Please make sure it's correct.")
        return
    }

    console.log(`Got ${planes.length} planes`)
    planeIds = []
    locations = []
    for (p of planes){
        const pid = parseInt(p[header.indexOf("SerialNumber")]);
        const loc = p[header.indexOf("Location")];
        if ( pid && loc && loc.length == 4 ) {
            planeIds.push(pid)
            if ( locations.indexOf(loc) < 0 ) {
                locations.push(loc)
            }
        }
    }

    console.log(`${locations.length} unique ICAOs`)

    const joined_locs = locations.join("-")
    
    icaos_url = encodeURI(`https://server.fseconomy.net/data?userkey=${access}&format=csv&query=icao&search=jobsfrom&icaos=${joined_locs}`)    
    console.log(`getting ${icaos_url}`);
    
    if (mock){
        $.ajax({
            url: 'test_data/icao.csv',
            type: 'GET',
            success: handle_missions_get(planeIds),
            error: handle_ajax_err
        });
    } else {
        $.ajax({
            url: proxy+icaos_url,
            type: 'GET',
            success: handle_missions_get(planeIds),
            error: handle_ajax_err
        });
    }
}

function handle_missions_get(planeids){
    return function(data){
        const result = $.csv.toArrays(data); // create array from csv
        const header = result[0]
        const all_missions = result.slice(1);
        console.log(`Got ${all_missions.length} total missions from the airports`)

        const missions = []
        for ( m of all_missions ) {
            let m_pid = parseInt(m[header.indexOf("AircraftId")])
            if ( m_pid && planeids.indexOf(m_pid) >= 0 ) {
                missions.push({"fromIcao": m[header.indexOf("FromIcao")], "toIcao": m[header.indexOf("ToIcao")]}) // FromICAO, ToICAO
            }
            
        }

        console.log(`${missions.length} relevant missions found`);

        for (mission of missions) {
            from_latlon = icaodata[mission.fromIcao]
            to_latlon = icaodata[mission.toIcao]
            const fromIcaoMarker = L.circleMarker(from_latlon, {
                color: 'green',
                radius: '3'
            }).addTo(the_map);
            const toIcaoMarker = L.circleMarker(to_latlon, {
                color: 'red',
                radius: '4'
            }).addTo(the_map);
            const lineBetween = L.polyline([from_latlon, to_latlon]).addTo(the_map)

            on_map.push(fromIcaoMarker)
            on_map.push(toIcaoMarker)
            on_map.push(lineBetween)

        }
    }
}

function sanitizeString(str){
    str = str.replace(/[^A-Z0-9]/g,"");
    return str.trim();
}

function plot(){

    const plane = planes[$('#plane-select').val()];
    access = sanitizeString($('#input-access-key').val());    

    if ( access.length != 10 ) {
        alert("Bad access token")
        return
    }

    const plane_get_url = encodeURI(`https://server.fseconomy.net/data?userkey=${access}&format=csv&query=aircraft&search=makemodel&makemodel=${plane}`)
    console.log(`getting ${plane_get_url}`);

    if(!map_initialised){
        initialise_map();
    }

    for (l of on_map){
        the_map.removeLayer(l)
    }
    on_map = []
    
    if (mock) {
        $.ajax({
            url: 'test_data/aircraft.csv',
            type: 'GET',
            success: handle_planes_get,
            error: handle_ajax_err
        });
    } else {
        $.ajax({
            url: proxy+plane_get_url,
            type: 'GET',
            success: handle_planes_get,
            error: handle_ajax_err
        });
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

    the_map.addLayer(mapbox);

    var baseMaps = {
        "Mapbox": mapbox,
        "Google Hybrid": googleHybrid,
        "Google Satellite": googleSat,
        "Google Terrain": googleTerrain
    };

    L.control.layers(baseMaps).addTo(the_map);

    $("#map-jumbo").addClass("init");
    window.setTimeout(transitionOpen, 100);

}

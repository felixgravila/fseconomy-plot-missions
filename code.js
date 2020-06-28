
const planes = [
    "Airbus A320",
    "Airbus A321",
    "BAe 146-100 (Avro RJ70)",
    "Boeing 727-100/200",
    "Boeing 737-800",
    "Boeing 747-400",
    "Bombardier Dash-8 Q400",
    "DeHavilland Dash 7",
    "Douglas DC-6",
    "Douglas DC-8 (10-40)",
    "McDonnell Douglas DC-10-30F"
]

tableColsAndValueKeys = {
    "From": "fromIcao",
    "To": "toIcao",
    "Distance": "distance",
    "Pay": "pay"
}

// main function called on document load
function initAll(){

    // sort the plane list so they're always in alphabetical order
    planes.sort()
    for(idx in planes){
        $('#plane-select').append(`<option value="${idx}">${planes[idx]}</option>`)
    }

    // initialise cookies AFTER list is initialised
    cookieInitialise();

}

// function that handles changing between map and table
function swapMapTable(button){
    // if already selected don't do anything
    if ( isMapButtonSelected() && button === "map" ) {return;}
    if ( !isMapButtonSelected() && button === "table" ) {return;}

    // change the hihglight
    setMapOrTableButtons(button)

    // remove min and max from table
    removeModifiersMapTable()

    if ( button === "map" ) {
        $("#map").addClass("maximised");
        $("#table").addClass("minimised");
    } else {
        $("#map").addClass("minimised");
        $("#table").addClass("maximised");
    }
}


// If should use saved example csvs for testing
const mock = false

let map_initialised = false;
let the_map;
let on_map = [];
let missions = [];
let access;
let sortByKey = "From";
let sortByDesc = false;
const icaodata = new Map();

// load the icao data and form dictionary
// info needed for icao lat and lon
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

// proxy is needed for CORS
const proxy = 'https://cors-anywhere.herokuapp.com/';

// function that logs ajax errors
function handle_ajax_err(xhr, status){
    console.log(xhr);
    console.log(status);
}

// main function called on click of plot button
// gets information, plots on map, opens map
function plot(){

    // get information from form
    const planeIdInList = $('#plane-select').val();
    const plane = planes[planeIdInList];
    access = sanitizeString($('#input-access-key').val());
    const saveTheCookie = $("#saveDataTick").is(":checked")

    // handle cookies if tickbox ticked
    // or clear cookies
    if ( saveTheCookie ){
        saveCookie(cookieListPlane, planeIdInList);
        saveCookie(cookieAccessKey, access)
        saveCookie(cookieSaveTick, true)
    } else {
        clearCookie(cookieListPlane)
        clearCookie(cookieAccessKey)
        clearCookie(cookieSaveTick)
    }

    // verify access key length is 10 (old version) or 16
    // otherwise obviously bad key, exit
    if ( access.length != 10 && access.length != 16 && !mock ) {
        alert("Bad access token")
        return
    }

    // define URL to get all planes
    const plane_get_url = encodeURI(`https://server.fseconomy.net/data?userkey=${access}&format=csv&query=aircraft&search=makemodel&makemodel=${plane}`)
    console.log(`getting ${plane_get_url}`);

    // initialise the map
    if(!map_initialised){
        initialise_map();
    }

    // clear the map
    for (l of on_map){
        the_map.removeLayer(l)
    }
    on_map = []
    
    // execute ajax request to retrieve planes
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

    // show buttons
    $("#btn-show-map").removeClass("hidden")
    $("#btn-show-table").removeClass("hidden")
}

// function executed after plane request returns
// gets ICAOs and requests all their missions
function handle_planes_get(data){
    // parse result
    const result = $.csv.toArrays(data); // create array from csv
    const header = result[0]; // save header separately
    const planes = result.slice(1); // remove header from data

    // stop if short result
    if ( planes.length <= 1 ) {
        alert("Something went wrong, possibly wrong access key. Please make sure it's correct.")
        return
    }

    console.log(`Got ${planes.length} planes`)

    // save planeIds to be used when finding which missions are relevant
    // save locations (icaos) to be used when requesting missions
    // iterate through planes to get info
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

    // form URL to get missions
    const joined_locs = locations.join("-")
    icaos_url = encodeURI(`https://server.fseconomy.net/data?userkey=${access}&format=csv&query=icao&search=jobsfrom&icaos=${joined_locs}`)    
    console.log(`getting ${icaos_url}`);
    
    // execute request
    // use closure to pass planeIds to handle_missions_get as opposed to global variables
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

// function that handles the response containing missions
function handle_missions_get(planeids){
    return function(data){
        // parse result
        const result = $.csv.toArrays(data); // create array from csv
        const header = result[0] // save header separately
        const all_missions = result.slice(1); // remove header
        console.log(`Got ${all_missions.length} total missions from the airports`)

        // create list of missions with From and To ICAOs by iterating over the result
        // and checking which missions have the AircraftId field in planeids
        missions = []
        for ( m of all_missions ) {
            let m_pid = parseInt(m[header.indexOf("AircraftId")])
            if ( m_pid && planeids.indexOf(m_pid) >= 0 ) {

                fromIcao = m[header.indexOf("FromIcao")];
                toIcao = m[header.indexOf("ToIcao")];

                // get latlons from icaodata
                from_latlon = icaodata[fromIcao];
                to_latlon = icaodata[toIcao];

                missions.push({
                    "fromIcao": fromIcao,
                    "toIcao": toIcao,
                    "fromLatLon": from_latlon,
                    "toLatLon": to_latlon,
                    "distance": getDistance(from_latlon, to_latlon),
                    "pay": m[header.indexOf("Pay")]
                })
            }  
        }

        console.log(`${missions.length} relevant missions found`);

        // plot the missions on the map and add them to the table
        for (mission of missions) {

            // first plot to map

            // green circle marker for From
            const fromIcaoMarker = L.circleMarker(mission.fromLatLon, {
                color: 'green',
                radius: '5',
                zIndex: 100
            }).addTo(the_map);
            // smaller red circle marker on top of the green one for To
            const toIcaoMarker = L.circleMarker(mission.toLatLon, {
                color: 'red',
                radius: '3',
                zIndex: 101
            }).addTo(the_map);
            const lineBetween = L.polyline([mission.fromLatLon, mission.toLatLon], {zIndex: 50}).addTo(the_map)

            // add popup with ICAO on mouse hover
            bindMarkerMessage(fromIcaoMarker, mission.fromIcao)
            bindMarkerMessage(toIcaoMarker, mission.toIcao)

            // Goto fseconomy airport on marker click
            onClickGotoFseconomy(fromIcaoMarker, mission.fromIcao)
            onClickGotoFseconomy(toIcaoMarker, mission.toIcao)

            // save layers to list so they can be retrieved later
            on_map.push(fromIcaoMarker)
            on_map.push(toIcaoMarker)
            on_map.push(lineBetween)

        }

        // add the rows to table at the end
        addRowsToTable()
    }
}

 

// function that binds the message to markers
function bindMarkerMessage(marker, message){
    marker.bindPopup(message);
    marker.on('mouseover', function (e) {
        this.openPopup();
    });
    marker.on('mouseout', function (e) {
        this.closePopup();
    });
}

// function that opens the fseconomy airport in a new tab on marker click
function onClickGotoFseconomy(marker, icao) {
    marker.on('click', e => window.open(`https://server.fseconomy.net/airport.jsp?icao=${icao}`,'_blank'));
}

// function that ensures the key only contains valid characters
function sanitizeString(str){
    str = str.replace(/[^A-Z0-9]/g,"");
    return str.trim();
}

// function that adds relevant classes to the map jumbo for expansion
function transitionOpen(){
    $("#map-jumbo").addClass("transition")
    $("#map-jumbo").addClass("expanded")
}

// function that initialises the map
function initialise_map(){
    // save flag so it only gets done once
    map_initialised = true;

    // create and initialise map
    the_map = L.map('map').setView([20, 0], 3);

    // add mapbox layer
    mapbox = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1
    });

    // add google hybrid layer
    googleHybrid = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3'],
        attribution: 'Map data ©2020 Google'
    });

    // add google satellite layer
    googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3'],
        attribution: 'Map data ©2020 Google'
    });

    // add google terrain layer
    googleTerrain = L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',{
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3'],
        attribution: 'Map data ©2020 Google'
    });

    // initialise using mapbox
    the_map.addLayer(mapbox);

    // add all to dictionary for control 
    var baseMaps = {
        "Mapbox": mapbox,
        "Google Hybrid": googleHybrid,
        "Google Satellite": googleSat,
        "Google Terrain": googleTerrain
    };
    L.control.layers(baseMaps).addTo(the_map);

    // timing trick for animation
    $("#map-jumbo").addClass("init");
    window.setTimeout(transitionOpen, 100);

}

// handles the logic of sorting ascending/descending on click
function sortTable(key){
    // if already same sorting swap asc desc
    if ( sortByKey == key ) {
        sortByDesc = !sortByDesc;
    } else {
        sortByKey = key;
        sortByDesc = false;
    }

    // save the cookie if allowed
    if ( $("#saveDataTick").is(":checked") ) {
        saveCookie(cookieFieldSorted, key)
    }

    addRowsToTable()
}

// function that performs the table refresh
function addRowsToTable(){   

    // sort the missions

    // Use cookie if exists
    const sortByKeyCookie = makeCookieMap()[cookieFieldSorted];
    if ( sortByKeyCookie ) {
        sortByKey = sortByKeyCookie;
    }
    missions.sort(sorterBy(tableColsAndValueKeys[sortByKey], sortByDesc))

    // clear table
    $("#mission-table tr").remove()

    // add header to table with arrow to show sorting
    tr_string = "<tr>"
    for (key in tableColsAndValueKeys) {
        tr_string = tr_string + `<th onclick='sortTable("${key}")'>${key} `
        if ( key == sortByKey ) {
            if ( sortByDesc ) {
                tr_string  = tr_string + '<i class="fa fa-caret-down" aria-hidden="true"></i>'
            } else {
                tr_string  = tr_string + '<i class="fa fa-caret-up" aria-hidden="true"></i>'
            }
        }
        tr_string = tr_string + `</th>`
    }
    tr_string = tr_string + "</tr>"
    $("#mission-table").append(tr_string)


    // add lines to table
    for ( mission of missions ) {
        tr_string = `
        <tr>
        <td><a href="https://server.fseconomy.net/airport.jsp?icao=${mission[tableColsAndValueKeys['From']]}" target="_blank">${mission[tableColsAndValueKeys['From']]}</a></td>
        <td><a href="https://server.fseconomy.net/airport.jsp?icao=${mission[tableColsAndValueKeys['To']]}" target="_blank">${mission[tableColsAndValueKeys['To']]}</a></td>
        <td>${Math.round(mission[tableColsAndValueKeys['Distance']])} NM</td>
        <td>\$${Math.round(mission[tableColsAndValueKeys['Pay']])}</td>
        </tr>
        `
        $("#mission-table").append(tr_string)
    }

}

$(document).ready(initAll)
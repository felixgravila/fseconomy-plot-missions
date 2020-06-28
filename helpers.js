// general helper functions

const selectedButtonClass = "btn-success"
const notSelectedButtonClass = "btn-secondary"

function isMapButtonSelected(){
    return $("#btn-show-map").hasClass(selectedButtonClass);
}

// set which button is highlighted
// param button \in {"map", "table"}
function setMapOrTableButtons(button){
    if ( button === "map" ) {
        $("#btn-show-map").removeClass(notSelectedButtonClass);
        $("#btn-show-map").addClass(selectedButtonClass);
        $("#btn-show-table").removeClass(selectedButtonClass);
        $("#btn-show-table").addClass(notSelectedButtonClass);
    } else if ( button === "table" ) {
        $("#btn-show-map").removeClass(selectedButtonClass);
        $("#btn-show-map").addClass(notSelectedButtonClass);
        $("#btn-show-table").removeClass(notSelectedButtonClass);
        $("#btn-show-table").addClass(selectedButtonClass);
    }
}

// removes max and min classes from map and table
function removeModifiersMapTable(){
    $("#map").removeClass("maximised");
    $("#map").removeClass("minimised");
    $("#table").removeClass("maximised");
    $("#table").removeClass("minimised");
}

// converts degrees to radians
function toRadian(degree) {
    return degree*Math.PI/180;
}

// calculates distance between two latlon points
function getDistance(origin, destination) {
    var lon1 = toRadian(origin[1]),
        lat1 = toRadian(origin[0]),
        lon2 = toRadian(destination[1]),
        lat2 = toRadian(destination[0]);

    var deltaLat = lat2 - lat1;
    var deltaLon = lon2 - lon1;

    var a = Math.pow(Math.sin(deltaLat/2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(deltaLon/2), 2);
    var c = 2 * Math.asin(Math.sqrt(a));
    var EARTH_RADIUS = 6371;
    dis_in_meters = c * EARTH_RADIUS * 1000;
    return dis_in_meters / 1852; // return nm
}

// returns closure that sorts list by key
function sorterBy(key, desc){
    console.log("Sorter by ", key, desc)
    return function(a,b) {
        if ( desc ) {
            return b[key] - a[key]
        } else {
            return a[key] - b[key]
        }
    }
}
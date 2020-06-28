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

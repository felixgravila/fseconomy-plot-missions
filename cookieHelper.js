// Handles cookies

//def cookie strings
const cookieListPlane = "plane";
const cookieAccessKey = "accesskey";
const cookieSaveTick = "saveCookieTick";
const cookieFieldSorted = "fieldSorted";

function cookieInitialise(){
    setParamsBasedOnCookies();
}

// create a easy to use map of possibly existing cookies
function makeCookieMap(){
    let cookieMap = {};
    if ( document.cookie.length == 0 ) {
        return {}
    }
    for (c of document.cookie.split(";")){
        c = c.trim().split("=")
        if ( c[1].length > 0 ){
            cookieMap[c[0]] = c[1]
        }
    }
    return cookieMap;
}


function setParamsBasedOnCookies(){
    // make the cookie map
    cookieMap = makeCookieMap()

    // set last used plane in list if cookie
    if ( cookieMap["plane"] !== undefined) {
        $('#plane-select').val(cookieMap[cookieListPlane])
    }

    // set access key if cookie
    if ( cookieMap["accesskey"] ) {
        $('#input-access-key').val(cookieMap[cookieAccessKey])
    }

    // set tickbox ticked if cookie
    if ( cookieMap[cookieSaveTick] ) {
        $("#saveDataTick").prop("checked", true)
    }

}


// warn on remove tick that cookies will be deleted
// only if cookies already exist
function tickBoxTicked(){
    if ( makeCookieMap()[cookieSaveTick] && !$("#saveDataTick").is(":checked") ) {
        alert("All cookies will be removed on next plot if box is left unticked.")
    }
}

function saveCookie(key, value){
    document.cookie = `${key}=${value}`;
}


function clearCookie(key){
    document.cookie = `${key}=`;
}


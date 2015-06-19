var attribution_nypl = 'Map via <a href="http://maps.nypl.org">NYPL</a>';

// manhattan 1857
var ny_1857 = L.tileLayer( 'http://maptiles.nypl.org/859/{z}/{x}/{y}.png',{attribution: attribution_nypl});

// brooklyn 1855
var bk_1855 = L.tileLayer( 'http://maptiles.nypl.org/860/{z}/{x}/{y}.png',{attribution: attribution_nypl});

var attribution_mapbox = 'Map via <a href="http://openstreetmap.org">OpenStreetMap</a>, <a href="http://mapbox.com">Mapbox</a>';

// present
var ny_2014 = L.tileLayer( 'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png',{id: 'nypllabs.7f17c2d1',attribution: attribution_mapbox});

var oldMaps = L.layerGroup([ny_1857, bk_1855]);


// for the toggler
var baseMaps = {
  "Present": ny_2014,
  "1857-9": oldMaps
};

// the tileset switcher control
var control = L.control.layers(baseMaps,{}, {collapsed:false});
// create map with default tileset
var map = L.map('map', {layers:ny_2014, maxZoom:21, minZoom:12, scrollWheelZoom:true});

control.addTo(map);

// the geojson as it comes from the text document
var jsonurl = 'https://gist.githubusercontent.com/mgiraldo/cc86b6b043f3ad16a719/raw/18f5e5233bc64994f81f49d8da3c2736c780d140/merged.geojson';

var topNames, geodata, geolayer, control;
var words, colors, overlays;
var markers;
var bounds = new L.LatLngBounds();
var searchOverlay;
var overlays = [];
words = ["church","coal","office","house","drug","factory","school","stable","lumber","works","bank"];
colors = ["#1f78b4","#888","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#b15928","#000"];

function showMap(geostring) {
  // parse the geojson string to a proper json structure
  geodata = JSON.parse(geostring);
  
  console.log("found", geodata.features.length,"places");

  legend = document.getElementById("legend");

  for (var i=0; i<words.length; i++) {
    var c = colors[i];
    var t = words[i];
    var html = '<span class="key" style="background:'+c+'"></span>' + t;
    // overlay
    var places = extractPlaces(geodata, t, i);
    var overlay = overlayForPlaces(places);
    overlay.addTo(map);
    bounds.extend(overlay.getBounds());
  	control.addOverlay(overlay, html);
    overlays.push(overlay);
  }

  geolayer = L.geoJson(topNames);
    
  // zoom the map to the bounds of the points
  map.fitBounds(bounds);
  
  document.getElementById("keyword").onchange = onKeywordSubmitted;
}

function showPopup(feature, layer) {
    var key, val;
    var content = [];
    for (key in feature.properties) {
        val = feature.properties[key];
        if (key=="consensus") content.push(val);
    }
    layer.bindPopup(content.join("<br />"));
}

function extractPlaces(raw, place, index) {
  result = {}
  result.type = raw.type;
  result.features = [];
  for (var i=0; i<raw.features.length; i++) {
    if (raw.features[i].properties.consensus.toLowerCase().indexOf(place) != -1) {
      raw.features[i].properties.index = index;
      result.features.push(raw.features[i]);
    }
  }
  return result;
}

var client = new XMLHttpRequest();
client.open('GET', jsonurl);
client.onloadend = function() {
  showMap(client.responseText);
}
client.send();

function hidePopular() {
  for (var o in overlays) {
    var layer = overlays[o];
    if(map.hasLayer(layer)) {
      map.removeLayer(layer);
    }
  }
}

function search(keyword) {
  if (searchOverlay) {
    map.removeLayer(searchOverlay);
  }
  var places = extractPlaces(geodata, keyword, colors.length-1);
  if (places.features.length==0) return;
  searchOverlay = overlayForPlaces(places);
  searchOverlay.addTo(map);
  map.fitBounds(searchOverlay.getBounds());
}

function onKeywordSubmitted(event) {
  clearMap();
  var keyword = event.target.value.trim().toLowerCase();
  event.target.value = keyword;
  if (keyword != "") search(keyword);
}

function clearMap() {
  hidePopular();
  if (searchOverlay) {
    map.removeLayer(searchOverlay);
  }
}

function overlayForPlaces(places) {
  return L.geoJson(places, {
    pointToLayer: function (f,latlon) {
      return L.circle(latlon, 10, {
        color: colors[f.properties.index],
        fillOpacity: 1,
        stroke: false
      });
    },
    onEachFeature: showPopup
  });
}
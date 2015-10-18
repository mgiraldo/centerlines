var attribution_nypl = 'Map via <a href="http://maps.nypl.org">NYPL</a>';

// manhattan 1857
var ny_1857 = L.tileLayer( 'http://maptiles.nypl.org/859/{z}/{x}/{y}.png',{attribution: attribution_nypl,minZoom:12,maxZoom:21});

// brooklyn 1855
var bk_1855 = L.tileLayer( 'http://maptiles.nypl.org/860/{z}/{x}/{y}.png',{attribution: attribution_nypl,minZoom:12,maxZoom:21});

var oldtiles = [ny_1857, bk_1855];
// create map with default tileset
var map = L.map('map', {layers:oldtiles, maxZoom:21, minZoom:13});

// the geojson as it comes from the text document
var jsonurl = 'js/centerlines.geojson';

var geodata, geolayer, control;
var currentLine = 0;
var markers;
var lineStyle = {
        color: '#f0f',
        opacity: 0.7,
        weight: 3
    };

var fadeStyle = {
        color: '#ff0',
        opacity: 1,
        weight: 3
    };

var skipped = false;

function showMap(geostring) {
  // parse the geojson string to a proper json structure
  geodata = JSON.parse(geostring);

  // now make it understandable by leaflet
  geolayer = L.featureGroup();
  
  // add the points to the map
  geolayer.addTo(map);
  var el = document.getElementById("skip"); 
  el.addEventListener("click", skip);
  
  // zoom the map to the bounds of the points
  map.setZoom(16);//fitBounds(geolayer.getBounds());
  showNextLine();
}

function showNextLine() {
  if (skipped) return;

  var line = L.geoJson(geodata.features[currentLine], {
    onEachFeature: showPopup,
    style: lineStyle
  });

  var lineFade = L.geoJson(geodata.features[currentLine], {
    onEachFeature: fadeOut,
    style: fadeStyle
  });

  var totalLines = geodata.features.length;
  geolayer.addLayer(line);
  
  lineFade.addTo(map);
  
  var center = line.getBounds().getCenter();

  map.panTo(center);

  line.openPopup();

  if (currentLine+1 < totalLines-1) {
    currentLine++;
    window.setTimeout(showNextLine, 150);
  } else {
    map.fitBounds(geolayer.getBounds());
    map.closePopup();
  }
}

function skip(e) {
  skipped = true;

  e.target.parentNode.removeChild(e.target);

  map.removeLayer(geolayer);

  var all = L.geoJson(geodata, {
    onEachFeature: showPopup,
    style: lineStyle
  });

  all.addTo(map);
  map.fitBounds(all.getBounds());
}

function fadeOut(feature, layer) {
  var l = layer;
  window.setTimeout(function () {
    map.removeLayer(l);
  }, 430);
}

function showPopup(feature, layer) {
    var key, val;
    var content = [];
    for (key in feature.properties) {
        if (key != "streetname") continue;
        val = feature.properties[key];
        if (val != null) {
          val = val.toUpperCase();
        } else {
          val = "UNNAMED STREET";
        }
        content.push(val);
    }
    layer.bindPopup(content.join("<br />"), {
      closeButton: false
    });
}

var client = new XMLHttpRequest();
client.open('GET', jsonurl);
client.onloadend = function() {
  showMap(client.responseText);
}
client.send();

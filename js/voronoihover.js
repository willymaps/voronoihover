var voronoiDrawn = false;
var voronoiShown = true;
var hoveredPointId =  null;

var hoverPolygon = {
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": []
    }
  }]
};


function queryMap(dataName) {

    // array to hold rendered features
    var featureArray = [];

    // point data within map view on load
    var features = map.queryRenderedFeatures({layers:['pointsLayer']});

    for (var i=0;i<features.length;i++) {

        var point = features[i].geometry.coordinates;

	    // array to hold attribute names for popup
	    var featureNameArray = {};

	    for (var p=0;p<dataName.length;p++) {

			pushToAry(dataName[p]);

        	function pushToAry(name) {
			    featureNameArray[name] = features[i].properties[name];
			}

		}

        let voronoiPoint = turf.point(point, featureNameArray);
        featureArray.push(voronoiPoint);

        if (i==features.length-1) {
            generateVoronoi(featureArray);
        }
    };
};



function generateVoronoi(data) {

    var collection = turf.featureCollection(data);
    var voronoiExtent = mapBounds[0].concat(mapBounds[1]);
    var options = {
      bbox: voronoiExtent
    };
    var voronoiPolygons = turf.voronoi(collection, options);


    // Because turf.voronoi is returning null geometries, I create
    // another version of the voronoi geojson with the variable
    // and if statement directly below

    var geojsonPolygon = {
      "type": "FeatureCollection",
      "features": []
    };

    for (var i=0;i<voronoiPolygons.features.length;i++) {

        var geojsonArray = geojsonPolygon.features;

        if (voronoiPolygons.features[i] != null) {

            var featurePush = {
                "type": "Feature",
                "properties": collection.features[i].properties,
                "geometry": voronoiPolygons.features[i].geometry
            }
            geojsonArray.push(featurePush);
        }

    }

    if (voronoiDrawn == false) {
        addVoronoiLayer(geojsonPolygon);
        voronoiDrawn = true;
    }

}

function addVoronoiLayer(data) {

    map.addSource('voronoiData', {
        type: 'geojson',
        data: data
    });

    map.addLayer({
        'id': 'voronoiPolygonLayer',
        'type': 'fill',
        'source': 'voronoiData',
        'layout': {},
        'paint': {
          'fill-color': 'rgba(0,0,0,0)',
          "fill-opacity": 1,
          'fill-outline-color': 'coral'
        }
    });

    map.on("mousemove", "voronoiPolygonLayer", function(e) {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features.length > 0) {
            hoveredPointId = e.features[0].properties.id;

            var feature = map.querySourceFeatures("points", { sourceLayer: ['pointsLayer'], filter: ['==', 'id', hoveredPointId] });

            var coordinates = feature[0].geometry.coordinates.slice();
            var attributes = feature[0].properties;
            var attributesArray = [];

			Object.keys(attributes).forEach(function(key) {
			  attributesArray.push('<b>' + key + '</b>: ' + attributes[key] + '<br>');
			});

			var attributesClean = attributesArray.join('');

            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            popup.setLngLat(coordinates)
                .setHTML(attributesClean)
                .addTo(map);
        }

    });

    map.on("mouseleave", "voronoiPolygon", function() {
        hoveredPointId =  null;
        popup.remove();
    });

}
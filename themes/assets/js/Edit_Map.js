var basemap = new ol.layer.Tile({
        source: new ol.source.OSM()
      });

var map = new ol.Map({
	layers: [basemap],
	target: 'map',
        view: new ol.View({
		projection: "http://www.opengis.net/gml/srs/epsg.xml#4326",
        	center: [-7.6158 , 33.5593],
        	zoom: 12
        	})
      	});

//the microzones layer as a geojson layer
var Microzones_Source=new ol.source.Vector({
	format: new ol.format.GeoJSON(),
	url: function(extent) {
		return 'http://localhost:8080/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typename=Afriquia_Gaz:Microzones&outputFormat=application/json';
		},
        strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
        	maxZoom: 19
        	}))
      	});
var Microzones_Layer=new ol.layer.Vector({
     			title: 'Microzones',
      			source: Microzones_Source,
			style: new ol.style.Style({
    					fill: new ol.style.Fill({
      						color: 'rgba(255, 255, 255, 0.2)'
    						}),
    					stroke: new ol.style.Stroke({
      						color: '#737373',
      						width: 2
    						}),
    					image: new ol.style.Circle({
      						radius: 7,
      						fill: new ol.style.Fill({
        						color: '#ffcc33'
      							})
    						})
  					})
			});

map.addLayer(Microzones_Layer);

// Editing Features code --------------------------------------------------

// Edits will be done on an Overlay and then will be saved
var features = new ol.Collection();
var featureOverlay = new ol.layer.Vector({
	source: new ol.source.Vector({features: features}),
	style: new ol.style.Style({
        	fill: new ol.style.Fill({
            		color: 'rgba(255, 255, 255, 0.2)'
          		}),
          	stroke: new ol.style.Stroke({
            		color: '#ffcc33',
            		width: 2
          		}),
          	image: new ol.style.Circle({
            		radius: 7,
            		fill: new ol.style.Fill({
              			color: '#ffcc33'
            			})
          		})
        	})
      	});
featureOverlay.setMap(map);
//we add a select interaction to the map so that we can use it later to modify the selected feature
var select = new ol.interaction.Select();
map.addInteraction(select);



var key=map.on('singleclick', function(evt) {
	var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
        	return feature;
    		});
	if (feature) {
        	var props = feature.getProperties();
        	$('#ID').val(props.ID);
		$('#Microzone').val(props.microzone);
		$('#Arrondissement').val(props.arrondissement);
		$('#Prefecture').val(props.prefecture);
		$('#Population').val(props.population);
		$('#Superficie').val(props.superficie);
		}	
	});

//Drawing code starts here

var draw; // global so we can remove it later
var formatwfs = new ol.format.WFS();// here we declare the format WFS to be used later on the transaction
draw = new ol.interaction.Draw({
       		features: features, // we set the newly drawn feature on the overlay declared previously
       		type: /** @type {ol.geom.GeometryType} */ ('Polygon') // Type of the feature in our case it's polygon
       		});
// when a new feature has been drawn...
draw.on('drawend', function(event) {
	/*var formatwkt = new ol.format.WKT();
	var wkt = formatwkt.writeGeometry(event.feature.getGeometry());
	alert(wkt);*/
	var feature = event.feature;// this variable feature will serve to store the attributes of the new zone 
	feature.set('microzone', $('#Microzone').val());//then the rest
	feature.set('arrondissement', $('#Arrondissement').val());//----
	feature.set('prefecture', $('#Prefecture').val());//----
	feature.set('population', $('#Population').val());//----
	feature.set('superficie', $('#Superficie').val());//from the forms we set in the html page
	var node = formatwfs.writeTransaction([feature], null, null, {//here we make the wfs-t call to insert the feature
		featureNS: "Afriquia_Gaz",//Namespace in Geoserver
		featureType: "Afriquia_Gaz:Microzones"//the layer's name
        	});
	
	//an AJAX call to store the data
        $.ajax({
        	type: "POST",
		url: "http://localhost:8080/geoserver/wfs",
		data: new XMLSerializer().serializeToString(node),
		contentType: 'text/xml',
		success: function(data) {
			alert("feature successfully added");
		},
		error: function(e) {
			var errorMsg = e? (e.status + ' ' + e.statusText) : "";
			alert('Error saving this feature to GeoServer.<br><br>'
			+ errorMsg);
		},
		context: this
	});
	//and voila
});

$('#Draw').click( function(){
	map.unByKey(key);	
	map.removeInteraction(modify);// we disable the modify interaction so there can be no conflicts between events
	map.addInteraction(draw);//not to forget to add the interaction to the map
	});

$('#Stop_Drawing').click( function(){
	map.removeInteraction(draw);//Here we disable dranwing
	key=map.on('singleclick', function(evt) {
		var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
        		return feature;
		});
		if (feature) {
        		var props = feature.getProperties();
        		$('#ID').val(props.ID);
			$('#Microzone').val(props.microzone);
			$('#Arrondissement').val(props.arrondissement);
			$('#Prefecture').val(props.prefecture);
			$('#Population').val(props.population);
			$('#Superficie').val(props.superficie);
		}	
	});
});

// Drawing code ends here

//Modification code starts here

//we add the modify interaction to the selected feature
var modify = new ol.interaction.Modify({
	features: select.getFeatures(),
        // the SHIFT key must be pressed to delete vertices, so
        // that new vertices can be drawn at the same position
        // of existing vertices
        deleteCondition: function(event) {
        	return ol.events.condition.shiftKeyOnly(event) &&
              	ol.events.condition.singleClick(event);
        	}
      	});

var dirty = {};
select.getFeatures().on('add', function(e) {
	e.element.on('change', function(e) {
		dirty[e.target.getId()] = true;
	});
});
var clone;
select.getFeatures().on('remove', function(e) {
	var f = e.element;
	if (dirty[f.getId()]){
		delete dirty[f.getId()];
		featureProperties = f.getProperties();
		delete featureProperties.boundedBy;
		clone = new ol.Feature(featureProperties);
		clone.setId(f.getId());
		/*var formatwkt = new ol.format.WKT();
		var wkt = formatwkt.writeGeometry(clone.getGeometry());
		alert(wkt);*/
	}
});
$('#Modify').click( function(){
	map.unByKey(key);
	map.removeInteraction(draw);
	map.addInteraction(modify);
	
	
});

$('#Stop_Modifying').click( function(){
	map.removeInteraction(modify);
	key=map.on('singleclick', function(evt) {
	var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
        	return feature;
    		});
	if (feature) {
        	var props = feature.getProperties();
        	$('#ID').val(props.ID);
		$('#Microzone').val(props.microzone);
		$('#Arrondissement').val(props.arrondissement);
		$('#Prefecture').val(props.prefecture);
		$('#Population').val(props.population);
		$('#Superficie').val(props.superficie);
		}	
	});
});

$('#Save').click( function(){
	var swappedFeature = clone;
	swappedFeature.getGeometry().applyTransform(function (coords, coords2, stride) {
    		for (var i=0;i<coords.length;i+=stride) {
        		var y = coords[i];
        		var x = coords[i+1];
        		coords[i] = x;
        		coords[i+1] = y;
    		}
	});
	var node = formatwfs.writeTransaction(null, [clone], null, {//here we make the wfs-t call to insert the feature	
		//srsName:"CRS:84",				
		featureNS: "Afriquia_Gaz",//Namespace in Geoserver
		featureType: "Microzones"//the layer's name
	});
	var str=new XMLSerializer().serializeToString(node);
	var data=str.replace("feature:Microzones","Afriquia_Gaz:Microzones");
	//alert(data);
	//an AJAX call to store the data
	$.ajax({
		type: "POST",
		url: "http://localhost:8080/geoserver/wfs",
		data: data,
		contentType: 'text/xml',
		success: function(data) {
			alert(new XMLSerializer().serializeToString(data));
		},
		error: function(e) {
			var errorMsg = e? (e.status + ' ' + e.statusText) : "";
			alert('Error saving this feature to GeoServer.<br><br>'+ errorMsg);
		},
		context: this
	});
	location.reload();
});
// Editing code ends here

// Hover Interaction code starts here
hoverInteraction = new ol.interaction.Select({
	condition: ol.events.condition.pointerMove,
	layers:[Microzones_Layer]	//Setting layers to be hovered
	});
map.addInteraction(hoverInteraction);

// Hover interaction ends here

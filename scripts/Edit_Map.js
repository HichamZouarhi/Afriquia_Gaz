var basemap = new ol.layer.Tile({
		source: new ol.source.OSM()
	  });

/*For Bing maps basemap
new ol.layer.Tile({
		  visible: true,
		  preload: Infinity,
		  source: new ol.source.BingMaps({
			key: 'Ap9VqFbJYRNkatdxt3KyzfJxXN_9GlfABRyX3k_JsQTkMQLfK_-AzDyJHI5nojyP',
			imagerySet: 'Aerial',
			// use maxZoom 19 to see stretched tiles instead of the BingMaps
			// "no photos at this zoom level" tiles
			maxZoom: 19
		  })
		});*/

var map = new ol.Map({
	layers: [basemap],
	target: 'map',
	view: new ol.View({
		projection: "http://www.opengis.net/gml/srs/epsg.xml#4326",
		center: [-7.6158 , 33.5593],
		zoom: 12
	})
});

var sphere = new ol.Sphere(6378137);//the geodesic sphere to compute area of polygons

//the microzones layer as a geojson layer
var microzonesSource=new ol.source.Vector({
	format: new ol.format.GeoJSON(),
	url: function(extent) {
		return 'http://localhost:8080/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typename=afriquia_gaz:microzones&outputFormat=application/json';
	},
	strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
		maxZoom: 19
	}))
});
var microzonesLayer=new ol.layer.Vector({
	title: 'Microzones',
	source: microzonesSource,
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

var table=$('#dataTable_microzones').DataTable({
	responsive: true,
	"columnDefs": [
		{
			"targets": [ 0 ],
			"visible": false
		}
	]
});

microzonesSource.on('change', function(evt){
	var source=evt.target;
		if(source.getState() === 'ready'){
			console.log("source ready");
			source.forEachFeature(function(feature){
				table.row.add([
					feature.get('id'),
					feature.get('microzone'),
					feature.get('arrondissement'),
					feature.get('prefecture'),
					feature.get('population'),
					feature.get('superficie')
					]).draw(false);
			});
		}
});

var prefecturesSource=new ol.source.Vector({
	projection : 'EPSG:4326',
	url: 'Maps/Prefectures.geojson',
	format: new ol.format.GeoJSON()
});
var prefecturesLayer=new ol.layer.Vector({
	title: 'Prefectures',
	source: prefecturesSource,
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

var arrondissementsSource=new ol.source.Vector({
	projection : 'EPSG:4326',
	url: 'Maps/Arrondissements.geojson',
	format: new ol.format.GeoJSON()
});
var arrondissementsLayer=new ol.layer.Vector({
	title: 'Arrondissements',
	source: arrondissementsSource,
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

map.addLayer(arrondissementsLayer);
map.addLayer(prefecturesLayer);
map.addLayer(microzonesLayer);

arrondissementsLayer.setVisible(false);
prefecturesLayer.setVisible(false);

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
var select = new ol.interaction.Select({layers : [microzonesLayer]});
map.addInteraction(select);
var selectedFeature;

var popup = new ol.Overlay.Popup();
map.addOverlay(popup);
var singleClickListener=function(evt) {
	popup.hide();
	var layerType;
	popup.setOffset([0, 0]);
	var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
		if(layer==microzonesLayer){
			layerType="microzones";
			return feature;
		}
		if(layer==prefecturesLayer){
			layerType="prefectures";
			return feature;
		}
		if(layer==arrondissementsLayer){
			layerType="arrondissements";
			return feature;
		}
	});
	if(layerType=="microzones"){
		if (feature) {
			selectedFeature=feature;
			//getting the center of the polygons to display the popup on its coordinates
			var ext=feature.getGeometry().getExtent();
			var center=ol.extent.getCenter(ext);
			var props = feature.getProperties();
			//console.log(props.microzone);
			var info =  "<form class='form-container'>"
				+"<table>"
					+"<tr>"
						+"<td><div class='form-title'>ID</div></td>"
						+"<td><input id='ID' class='form-field' type='text' value="+props.id+" /></td>"
					+"</tr>"
					+"<tr>"
						+"<td><div class='form-title'>Zone</div></td>"
						+"<td><input id='Microzone' class='form-field' type='text' value='"+props.microzone+"' /></td>"
					+"</tr>"
					+"<tr>"
						+"<td><div class='form-title'>Arrondissement</div></td>"
						+"<td><input id='Arrondissement' class='form-field' type='text' value='"+props.arrondissement+"' /></td>"
					+"</tr>"
					+"<tr>"
						+"<td><div class='form-title'>Prefecture</div></td>"
						+"<td><input id='Prefecture' class='form-field' type='text' value='"+props.prefecture+"' /></td>"
					+"</tr>"
					+"<tr>"
						+"<td><div class='form-title'>Population</div></td>"
						+"<td><input id='Population' class='form-field' type='text' value="+props.population+" /></td>"
					+"</tr>"
					+"<tr>"
						+"<td><div class='form-title'>Superficie m²</div></td>"
						+"<td><input id='Superficie' class='form-field' type='text' value="+props.superficie+" /></td>"
					+"</tr>"
				+"</table>"
				+"<div class='submit-container'>"
					+"<input id='Save' class='submit-button' type='button' value='Save' />"
				+"</div>"
			+"</form>";
			// Offset the popup so it points at the middle of the marker not the tip
			popup.setOffset([0, -22]);
			popup.show(center,info);
			map.setView( new ol.View({
				projection: "http://www.opengis.net/gml/srs/epsg.xml#4326",
				center: [center[0] , center[1]+0.056571],
				zoom: 12
			}));
		}
		$('#Save').click(function(evt){
			evt.preventDefault();
			selectedFeature.set('microzone',$('#Microzone').val());
			selectedFeature.set('arrondissement',$('#Arrondissement').val());
			selectedFeature.set('prefecture',$('#Prefecture').val());
			selectedFeature.set('population',$('#Population').val());
			var swappedFeature = selectedFeature;
			swappedFeature.getGeometry().applyTransform(function (coords, coords2, stride) {
				for (var i=0;i<coords.length;i+=stride) {
					var y = coords[i];
					var x = coords[i+1];
					coords[i] = x;
					coords[i+1] = y;
				}
			});
			var node = formatwfs.writeTransaction(null, [swappedFeature], null, {
				featureNS: "afriquia_gaz",//Namespace in Geoserver
				featureType: "microzones"//the layer's name
			});
			var str=new XMLSerializer().serializeToString(node);
			var data=str.replace("feature:microzones","afriquia_gaz:microzones");
			//alert(data);
			//an AJAX call to store the data
			$.ajax({
				type: "POST",
				url: "http://localhost:8080/geoserver/wfs",
				data: data,
				contentType: 'text/xml',
				success: function(data) {
					console.log("Attributes successfully modified");
				},
				error: function(e) {
					var errorMsg = e? (e.status + ' ' + e.statusText) : "";
					console.log('Error saving this feature to GeoServer.<br><br>'+ errorMsg);
				},
				context: this
			});
			location.reload();
		});
	}
	if(layerType=="arrondissements"){
		if (feature) {
			//selectedFeature=feature;
			//getting the center of the polygons to display the popup on its coordinates
			var ext=feature.getGeometry().getExtent();
			var center=ol.extent.getCenter(ext);
			var props = feature.getProperties();
			//console.log(props.microzone);
			var info =  "<form class='form-container'>"
				+"</br>Arrondissement : "+props.Arrondissement
				+"</br>Prefecture : "+props.Prefecture
				+"</br>Population : "+props.Population
				+"</br>Superficie : "+props.Superficie+"m²"
			+"</br></form>";
			// Offset the popup so it points at the middle of the marker not the tip
			popup.setOffset([0, -22]);
			popup.show(center,info);
		}
	}
	if(layerType=="prefectures"){
		if (feature) {
			//selectedFeature=feature;
			//getting the center of the polygons to display the popup on its coordinates
			var ext=feature.getGeometry().getExtent();
			var center=ol.extent.getCenter(ext);
			var props = feature.getProperties();
			//console.log(props.microzone);
			var info =  "<form class='form-container'>"
				+"</br>Prefecture : "+props.Prefecture
				+"</br>Population : "+props.Population
				+"</br>Superficie : "+props.Superficie+"m²"
			+"</br></form>";
			// Offset the popup so it points at the middle of the marker not the tip
			popup.setOffset([0, -22]);
			popup.show(center,info);
		}
	}
}
var key=map.on('singleclick', singleClickListener);

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
	feature.set('superficie',Math.abs(sphere.geodesicArea(feature.getGeometry().getLinearRing(0).getCoordinates())));
	var node = formatwfs.writeTransaction([feature], null, null, {//here we make the wfs-t call to insert the feature
		featureNS: "afriquia_gaz",//Namespace in Geoserver
		featureType: "afriquia_gaz:microzones"//the layer's name
	});
	console.log(new XMLSerializer().serializeToString(node));
	//an AJAX call to store the data
	$.ajax({
		type: "POST",
		url: "http://localhost:8080/geoserver/wfs",
		data: new XMLSerializer().serializeToString(node),
		contentType: 'text/xml',
		success: function(data) {
			console.log("feature successfully added");
			location.reload();
		},
		error: function(e) {
			var errorMsg = e? (e.status + ' ' + e.statusText) : "";
			console.log('Error saving this feature to GeoServer.<br><br>'
			+ errorMsg);
		},
		context: this
	});
	//and voila
});

$('#Start_Drawing').click( function(){
	if(microzonesLayer.getVisible()==true){
		map.unByKey(key);	
		map.removeInteraction(modify);// we disable the modify interaction so there can be no conflicts between events
		map.addInteraction(draw);//not to forget to add the interaction to the map
	}
	else{
		alert("Veuillez activer la couche microzones pour pouvoir ajouter un élément");
	}
});

$('#Stop_Drawing').click( function(){
	map.removeInteraction(draw);//Here we disable drawing
	key=map.on('singleclick',singleClickListener);//and re-enable the singleClickListener to display the popup form
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
			featureNS: "afriquia_gaz",//Namespace in Geoserver
			featureType: "microzones"//the layer's name
		});
		var str=new XMLSerializer().serializeToString(node);
		var data=str.replace("feature:microzones","afriquia_gaz:microzones");
		//alert(data);
		//an AJAX call to store the data
		$.ajax({
			type: "POST",
			url: "http://localhost:8080/geoserver/wfs",
			data: data,
			contentType: 'text/xml',
			success: function(data) {
				console.log("Geometry successfully modified");
			},
			error: function(e) {
				var errorMsg = e? (e.status + ' ' + e.statusText) : "";
				console.log('Error saving this feature to GeoServer.<br><br>'+ errorMsg);
			},
			context: this
		});
		location.reload();
	}
});
$('#Start_Modifying').click( function(){
	if(microzonesLayer.getVisible()==true){
		map.unByKey(key);
		map.removeInteraction(draw);
		map.addInteraction(modify);
	}
	else{
		alaert("Veuillez activer la couche microzones pour pouvoir modifer un élément");
	}
	
});

//Delete Feature code starts here
$('#Delete').click( function(){
	if(microzonesLayer.getVisible()==true){
		var node = formatwfs.writeTransaction(null, null, [selectedFeature], {//here we make the wfs-t call to insert the feature	
			//srsName:"CRS:84",				
			featureNS: "afriquia_gaz",//Namespace in Geoserver
			featureType: "microzones"//the layer's name
		});
		var str=new XMLSerializer().serializeToString(node);
		var data=str.replace("feature:microzones","afriquia_gaz:microzones");
		//alert(data);
		//an AJAX call to store the data
		$.ajax({
			type: "POST",
			url: "http://localhost:8080/geoserver/wfs",
			data: data,
			contentType: 'text/xml',
			success: function(data) {
				console.log("Microzone successfully deleted");
			},
			error: function(e) {
				var errorMsg = e? (e.status + ' ' + e.statusText) : "";
				console.log('Error deleting this feature from GeoServer.<br><br>'+ errorMsg);
			},
			context: this
		});
		location.reload();
	}
	else{
		alert("Veuillez activer la couche microzones pour pouvoir supprimer l'élément");
	}
});
// Delete code ends here
// Editing code ends here

//Search features by ID starts here
$('#open-search').click( function(evt){
	if(microzonesLayer.getVisible()==true){
		if(isFinite($('#ID-search').val().trim())){
			console.log("a number");
			microzonesSource.forEachFeature(function(feature) {
				if(feature.get('id')==$('#ID-search').val()){
					select.getFeatures().clear();
					select.getFeatures().push(feature);
					//getting the center of the polygons to display the popup on its coordinates
					var ext=feature.getGeometry().getExtent();
					var center=ol.extent.getCenter(ext);
					var props = feature.getProperties();
					var info =  "<form class='form-container'>"
						+"<table>"
							+"<tr>"
								+"<td><div class='form-title'>ID</div></td>"
								+"<td><input id='ID' class='form-field' type='text' value="+props.id+" /></td>"
							+"</tr>"
							+"<tr>"
								+"<td><div class='form-title'>Zone</div></td>"
								+"<td><input id='Microzone' class='form-field' type='text' value='"+props.microzone+"' /></td>"
							+"</tr>"
							+"<tr>"
								+"<td><div class='form-title'>Arrondissement</div></td>"
								+"<td><input id='Arrondissement' class='form-field' type='text' value='"+props.arrondissement+"' /></td>"
							+"</tr>"
							+"<tr>"
								+"<td><div class='form-title'>Prefecture</div></td>"
								+"<td><input id='Prefecture' class='form-field' type='text' value='"+props.prefecture+"' /></td>"
							+"</tr>"
							+"<tr>"
								+"<td><div class='form-title'>Population</div></td>"
								+"<td><input id='Population' class='form-field' type='text' value="+props.population+" /></td>"
							+"</tr>"
							+"<tr>"
								+"<td><div class='form-title'>Superficie m²</div></td>"
								+"<td><input id='Superficie' class='form-field' type='text' value="+props.superficie+" /></td>"
							+"</tr>"
						+"</table>"
						+"<div class='submit-container'>"
							+"<input id='Save' class='submit-button' type='button' value='Save' />"
						+"</div>"
					+"</form>";
					// Offset the popup so it points at the middle of the marker not the tip
					popup.setOffset([0, -22]);
					popup.show(center,info);
					map.setView( new ol.View({
						projection: "http://www.opengis.net/gml/srs/epsg.xml#4326",
						center: [center[0] , center[1]+0.056571],
						zoom: 12
					}));
				}
			});
		}
		else{
			microzonesSource.forEachFeature(function(feature) {
				if(feature.get('microzone')==$('#ID-search').val()){
					select.getFeatures().clear();
					select.getFeatures().push(feature);
					//getting the center of the polygons to display the popup on its coordinates
					var ext=feature.getGeometry().getExtent();
					var center=ol.extent.getCenter(ext);
					var props = feature.getProperties();
					var info =  "<form class='form-container'>"
						+"<table>"
							+"<tr>"
								+"<td><div class='form-title'>ID</div></td>"
								+"<td><input id='ID' class='form-field' type='text' value="+props.id+" /></td>"
							+"</tr>"
							+"<tr>"
								+"<td><div class='form-title'>Zone</div></td>"
								+"<td><input id='Microzone' class='form-field' type='text' value='"+props.microzone+"' /></td>"
							+"</tr>"
							+"<tr>"
								+"<td><div class='form-title'>Arrondissement</div></td>"
								+"<td><input id='Arrondissement' class='form-field' type='text' value='"+props.arrondissement+"' /></td>"
							+"</tr>"
							+"<tr>"
								+"<td><div class='form-title'>Prefecture</div></td>"
								+"<td><input id='Prefecture' class='form-field' type='text' value='"+props.prefecture+"' /></td>"
							+"</tr>"
							+"<tr>"
								+"<td><div class='form-title'>Population</div></td>"
								+"<td><input id='Population' class='form-field' type='text' value="+props.population+" /></td>"
							+"</tr>"
							+"<tr>"
								+"<td><div class='form-title'>Superficie</div></td>"
								+"<td><input id='Superficie' class='form-field' type='text' value="+props.superficie+" /></td>"
							+"</tr>"
						+"</table>"
						+"<div class='submit-container'>"
							+"<input id='Save' class='submit-button' type='button' value='Save' />"
						+"</div>"
					+"</form>";
					// Offset the popup so it points at the middle of the marker not the tip
					popup.setOffset([0, -22]);
					popup.show(center,info);
					map.setView( new ol.View({
						projection: "http://www.opengis.net/gml/srs/epsg.xml#4326",
						center: [center[0] , center[1]+0.056571],
						zoom: 12
					}));
				}
			});
		}
	}
	else{
		alert("Veuillez activer la couche microzones pour pouvoir chercher un élément");
	}
});
//Search code ends here

//layer toggling (prefectures and arrondissements) code starts here
$('#togglePrefectures').click(function() {
	if(prefecturesLayer.getVisible()){
		prefecturesLayer.setVisible(false);
		console.log("layer prefectures is not visible");
	}
	else{
		prefecturesLayer.setVisible(true);
		microzonesLayer.setVisible(false);
		arrondissementsLayer.setVisible(false);
		console.log("layer prefectures is visible");
	}
});

$('#toggleArrondissements').click(function() {
	if(arrondissementsLayer.getVisible()){
		arrondissementsLayer.setVisible(false);
		console.log("layer arrondissements is not visible");
	}
	else{
		arrondissementsLayer.setVisible(true);
		microzonesLayer.setVisible(false);
		prefecturesLayer.setVisible(false);
		console.log("layer arrondissements is visible");
	}
});

$('#toggleMicrozones').click(function() {
	if(microzonesLayer.getVisible()){
		microzonesLayer.setVisible(false);
		console.log("layer microzones is not visible");
	}
	else{
		microzonesLayer.setVisible(true);
		prefecturesLayer.setVisible(false);
		arrondissementsLayer.setVisible(false);
		console.log("layer microzones is visible");
	}
});

//layer toggling code ends here
// Hover Interaction code starts here
hoverInteraction = new ol.interaction.Select({
	condition: ol.events.condition.pointerMove,
	layers:[microzonesLayer, prefecturesLayer, arrondissementsLayer]	//Setting layers to be hovered
	});
map.addInteraction(hoverInteraction);

// Hover interaction ends here

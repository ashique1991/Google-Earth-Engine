var aoi: Table projects/ashique1991/assets/bangladesh_districts;
var Sentinel_SAR: ee.ImageCollection("COPERNICUS/S1_GRD");

Map.addLayer(aoi)
Map.centerObject(aoi,7)

var filtered_Collection = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(aoi)
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.or(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'),ee.Filter.eq('orbitProperties_pass', 'AESCENDING')));


var goodState = filtered_Collection.filterDate('2022-02-01', '2022-04-30')
var floodState = filtered_Collection.filterDate('2022-05-01', '2022-10-30')

print(goodState.size())
print(floodState.size())

var goodImage = goodState.select('VH').mosaic().clip(aoi)
var floodImage = floodState.select('VH').mosaic().clip(aoi)

var goodFilter = ee.Image(toDB(RefinedLee(toNatural(goodImage))))
var floodFilter = ee.Image(toDB(RefinedLee(toNatural(floodImage))))

Map.addLayer(goodFilter,{min:-25, max:0},'Good Filter')
Map.addLayer(floodFilter,{min:-25, max:0},'Flood Filter')

var flood = goodFilter.gt(-20).and(floodFilter.lt(-20))
var floodMask = flood.updateMask(flood.eq(1))

var water = goodFilter.lt(-20).and(floodFilter.lt(-20))
var waterMask = water.updateMask(water.eq(1))


Map.addLayer(floodMask, {palette:['Red']}, 'Flood Water')
Map.addLayer(waterMask, {palette:['Blue']}, ' Water Body')
// Function to convert from d
function toNatural(img){
  return ee.Image(10.0).pow(img.select(0).divide(10.0));
}

// Function to convert db
function toDB(img){
  return ee.Image(img).log10().multiply(10.0);
}


///////////////

// Define a Refined Lee filter function
function RefinedLee(image) {
  var kernel = ee.Kernel.square({
    radius: 2,
    units: 'pixels',
    normalize: true
  });

  // Calculate the mean and variance within the kernel neighborhood
  var mean = image.reduceNeighborhood(ee.Reducer.mean(), kernel);
  var variance = image.reduceNeighborhood(ee.Reducer.variance(), kernel);

  // Calculate the signal-to-noise ratio
  var signalToNoise = image.divide(variance.sqrt());

  // Estimate the local noise
  var localNoise = image.subtract(mean);

  // Calculate the weighted mean
  var weightedMean = mean.add(signalToNoise.pow(2).multiply(localNoise).divide(variance.add(signalToNoise.pow(2))));

  return weightedMean.rename(image.bandNames());
}

// Convert your binary masks to vector features

/*
var floodMaskFeatures = floodMask.reduceToVectors({
  geometry: aoi,
  crs: 'EPSG:4326',
  scale: 10,
  geometryType: 'polygon',
  bestEffort: true // Use bestEffort
});

var waterMaskFeatures = waterMask.reduceToVectors({
  geometry: aoi,
  crs: 'EPSG:4326',
  scale: 10,
  geometryType: 'polygon',
  bestEffort: true // Use bestEffort
});

// Export the feature collections to SHP
Export.table.toDrive({
  collection: floodMaskFeatures,
  description: 'Flood_Mask',
  folder: 'Flood Mapping with Sentinel-1 SAR GRD',
  fileNamePrefix: 'Flood_Mask',
  fileFormat: 'SHP'
});

Export.table.toDrive({
  collection: waterMaskFeatures,
  description: 'Water_Mask',
  folder: 'Flood Mapping with Sentinel-1 SAR GRD',
  fileNamePrefix: 'Water_Mask',
  fileFormat: 'SHP'
});
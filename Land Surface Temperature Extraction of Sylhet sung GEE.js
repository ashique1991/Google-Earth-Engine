var aoi: Table projects/ashique1991/assets/bangladesh_districts;
var terra: ee.ImageCollection("MODIS/006/MOD11A2")

var Sylhet_BD = aoi.filter(ee.Filter.eq('DISTRICT_N', 'Sylhet'));

print(Sylhet_BD);

Map.centerObject(Sylhet_BD, 6);
Map.addLayer(Sylhet_BD);

// Terra Land Surface Temperature and Emicivity 8 day Global 1km

var start = ee.Date('2010-01-01');
var dateRange = ee.DateRange(start, start.advance(23, 'year'));

// Filter the LST collection to include only images intersecting the desired
// date range.
var mod11a2 = terra.filterDate(dateRange);

// Select only the 1km day LST data band.
var modLST = mod11a2.select('LST_Day_1km', 'LST_Night_1km');
print(modLST)

var inCelsius = modLST.map(function(img) {
  return img
    .multiply(0.02)
    .subtract(273.15)
    .copyProperties(img, ['system:time_start']);
});

print('Converted', inCelsius);

var ts1 = ui.Chart.image.series({
  imageCollection: inCelsius,
  region: Sylhet_BD,
  reducer: ee.Reducer.mean(),
  scale: 1000,
  xProperty: 'system:time_start'})
  .setOptions({
     title: 'Time Series Data of LST for Sylhet District from 2010 to 2023',
     vAxis: {title: 'LST Celsius'}});
print(ts1);

var LST_day = inCelsius.select('LST_Day_1km').mean().clip(Sylhet_BD);
var LST_night = inCelsius.select('LST_Night_1km').mean().clip(Sylhet_BD);
Map.addLayer(LST_day, {
  min: 10, max: 40,
  palette: ['blue', 'limegreen', 'yellow', 'darkorange', 'red']},
  'Mean Day temperature');

Map.addLayer(LST_night, {
  min: 10, max: 40,
  palette: ['blue', 'limegreen', 'yellow', 'darkorange', 'red']},
  'Mean Night temperature');

// Export LST Day image to  Google Drive account
Export.image.toDrive({
  image: LST_day,
  description: 'LST_Sylhet at Day Time',
  folder: 'Land Surface Temperatures Bangladesh ',
  region: Sylhet_BD,
  scale: 1000,
  crs: 'EPSG:4326',
  maxPixels: 1e10});
  
  // Export LST Night image to  Google Drive account
Export.image.toDrive({
  image: LST_day,
  description: 'LST_Sylhet at Night Time',
  folder: 'Land Surface Temperatures Bangladesh ',
  region: Sylhet_BD,
  scale: 1000,
  crs: 'EPSG:4326',
  maxPixels: 1e10});

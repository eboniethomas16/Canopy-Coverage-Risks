/* global d3 */


// --- Chart Dimensions (GLOBAL) ---
const chart = {};
const margin = {top: 30, right: 0, bottom: -100, left: 70},
  width  = 650 - margin.left - margin.right,
  height = 450 - margin.top - margin.bottom;

// For Map Highlighting. remembers the selected countries
chart.selectedCountries = new Set();


//DEFINE GLOBAL DATA VARIABLE
let data =[]
let lastYear = null;

// --- INDICATOR DROPDOWN MENU SELECT ----
let currentIndicator = document.getElementById("indicator-select").value;

//let selectedBubble = new set();
let selectedCountries = new Set();
//let activeRegion = null;
let activeRegions = new Set();


//Ratio Indicators
const ratioIndicators = new Set([
  "Primary Pupil-Teacher Ratio",
  "Secondary Pupil-Teacher Ratio"
]);

//INDICATORS (%) THAT SURPASS 100%
const indicatorsOver100 = new Set([
  "Primary School Completion Rate %",
  "Primary School Enrollment %",
  "Secondary School Enrollment %",
  "Tertiary School Enrollment %"
]);
const playButton = document.getElementById("play-button");
const slider = document.getElementById("year-slider");
 // your existing slider
let isPlaying = false;
let playInterval = null;


const years = d3.range(1999, 2023);         // or whatever your dataset uses

playButton.addEventListener("click", () => {
  if (!isPlaying) {
    startAnimation();
  } else {
    stopAnimation();
  }
});

//RESET BUTTON LOGIC
d3.select("#reset-selection").on("click", () => {

  selectedCountries.clear();
  activeRegions.clear();
  chart.selectedCountries.clear();

  d3.selectAll(".legend-item")
    .classed("legend-active", false)
    .classed("legend-inactive", false);

  chart.bubbleLayer.selectAll("circle.bubbles")
    .classed("bubble-selected", false)
    .style("opacity", 0.85);

  chart.labelLayer.selectAll("text.bubble-label").remove();

  // Reset map using TRUE RESET MODE
  applyCountryHighlight(null, chart);

  // Reapply bubble logic
  applyBubbleHighlightOnly(chart);
  updateBubbleLabels(chart);
});


// GLOBAL FUNCTIONS (NEEDED)!

function makeXGridlines(x) {
  return d3.axisBottom(x).ticks(10);
}


function makeYGridlines(y) {
  return d3.axisLeft(y)
    .ticks(10);
}

// 4. Safe value extraction
function safeValue(d, indicator) {
  const v = d[indicator];
  if (v == null || v === "" || isNaN(+v)) return null;

  return ratioIndicators.has(indicator) ? +v : +v * 100;
}

// --- Tooltip ---
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);


///////////////////////
// --- FUNCTIONS -----\\
/////////////////////////
//update color legend
function updateColors(chart) {
  // Update the color scale to use the new palette
  // chart.color.range(chart.regionColors);
  d3.selectAll(".bubbles")
    .style("fill", d => chart.color(d.Region));
  // Update legend circles
  d3.selectAll(".legend-dot")
    .style("fill", d => chart.color(d));

  // Update bubble circles
  // d3.selectAll(".bubbles")
  //   .style("fill", d => chart.color(d.region));

  // Update world map regions
  updateMapStyling(chart);

}
function hasValidData(row, indicator) {
  if (!row) return false;

  const wealth = row["Wealth Index"];
  const value = row[indicator];

  if (wealth == null || wealth === 0) return false;
  if (value == null || value === 0) return false;

  return true;
}
 // Draws the World Map
function drawMap(world, chart) {
  const mapPanelWidth = 600;      // left panel width inside the translated <g>
  const mapPanelHeight = chart.height*1.3;
  const mapOffset = chart.width;   // move map to the right


  chart.mapLayer = chart.svg.append("g")
    .attr("class", "map-layer")
    .attr("transform", `translate(${mapOffset +350}, ${20})`);

  // Add border rectangle behind the map
  chart.mapLayer.append("rect")
    .attr("class", "map-border")
    .attr("x", -1)
    .attr("y", 0)
    .attr("width", mapPanelWidth+2)
    .attr("height", mapPanelHeight-47)
    .lower(); // ensure it sits behind the countries

  chart.mapLayer.append("text")
    .attr("class", "map-title")
    .attr("x", mapPanelWidth / 2)   // center within the map panel
    .attr("y", -20)                 // slightly above the map border
    .attr("text-anchor", "middle")
    .text("Select or Hover over Colored Countries For More Info");


  const projection = d3.geoMercator()
    .fitSize([mapPanelWidth, mapPanelHeight], world);

  const path = d3.geoPath().projection(projection);

  chart.countryDataLookup = {};
  data.forEach(row => {
    const countryKey = row.Country.trim();
    const yearKey = +row.Year;  // ensure number

    if (!chart.countryDataLookup[countryKey]) {
      chart.countryDataLookup[countryKey] = {};
    }

    chart.countryDataLookup[countryKey][yearKey] = row;
  });

  console.log([...chart.countryToRegion.keys()]);


  // Draw Countries into mapGroup, not mapSvg
  chart.mapLayer.selectAll("path.country")
    .data(world.features)
    .enter()
    .append("path")
    .attr("class", "country")
    .attr("d", path)
    //.attr("fill", "#ccc")
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5)
    .style("fill", d => {
      const currentIndicator = document.getElementById("indicator-select").value;
      const currentYear = +document.getElementById("year-slider").value;
      const key = d.properties.name.trim();
      const row = chart.countryDataLookup[key]?.[currentYear];

      // 1. No data → grey
      if (!row || !hasValidData(row, currentIndicator)) {
        return "#e5e5e5";
      }

      // 2. Valid data → region color
      const region = chart.countryToRegion.get(d.properties.name);
      const baseColor = chart.color(region);


      // Selected → full color
      if (chart.selectedCountries.has(d.properties.name)) {
        return baseColor;
      }

      // Valid but unselected → lightened region color
      return d3.color(baseColor).brighter(1.2);
    })
    .style("stroke", d => {
      const currentIndicator = document.getElementById("indicator-select").value;
      const currentYear = +document.getElementById("year-slider").value;
      const key = d.properties.name.trim();
      const row = chart.countryDataLookup[key]?.[currentYear];

      if (!row || !hasValidData(row, currentIndicator)) {
        return "#999"; // muted border for no-data
      }

      if (chart.selectedCountries.has(d.properties.name)) {
        return "#000"; // bold border for selected
      }

      return "#666"; // normal border for valid but unselected
    })
    .style("stroke-width", d => {
      const currentIndicator = document.getElementById("indicator-select").value;
      const currentYear = +document.getElementById("year-slider").value;
      const key = d.properties.name.trim();
      const row = chart.countryDataLookup[key]?.[currentYear];

      if (!row || !hasValidData(row, currentIndicator)) {
        return 0.5;
      }

      if (chart.selectedCountries.has(d.properties.name)) {
        return 1.5;
      }

      return 0.8;
    })
    .on("mouseover", (event, d) => {
      const currentIndicator = document.getElementById("indicator-select").value;
      const currentYear = +document.getElementById("year-slider").value;
      const key = d.properties.name.trim();
      const countryData = chart.countryDataLookup[key]?.[currentYear];

      if (countryData && hasValidData(countryData, currentIndicator) && !selectedBubble) {
        showTooltip(event, countryData);
      }

      d3.select(event.currentTarget)
        .raise()
        .style("stroke", "black")
        .style("stroke-width", 1.5);
    })
    .on("mouseout", (event, d) => {
      if (!selectedBubble) hideTooltip();

      // ⭐ Reapply correct styling for ALL countries
      updateMapStyling(chart);
    })
    .on("click", (event, d) => {
      const currentIndicator = document.getElementById("indicator-select").value;
      const currentYear = +document.getElementById("year-slider").value;
      const key = d.properties.name.trim();
      const countryData = chart.countryDataLookup[key]?.[currentYear];

      // Only allow clicking valid countries
      if (!chart.countryDataLookup[key]) {
        return;   // e.g., Antarctica, Western Sahara, etc.
      }
      // if (!countryData || !hasValidData(countryData, currentIndicator)) {
      //   return;
      // }
// ⭐ Toggle persistent selection (valid OR invalid)
      if (chart.selectedCountries.has(key)) {
        chart.selectedCountries.delete(key);   // deselect
      } else {
        chart.selectedCountries.add(key);      // select
      }


      // // Set selected bubble
      // selectedCountries.clear();
      // selectedCountries.add(key);   // key = country name

      // Highlight bubble on the chart
      applyBubbleHighlightOnly(chart);
      updateBubbleLabels(chart);

      // Update map styling (selected country gets bold outline)
      updateMapStyling(chart);
    });


  chart.countryPathLookup = new Map();
  chart.mapLayer.selectAll("path.country").each(function(d) {
    const key = d.properties.name.trim();
    chart.countryPathLookup.set(key, d3.select(this));
  });
}

function updateMapStyling(chart) {
  const currentIndicator = document.getElementById("indicator-select").value;
  const currentYear = +document.getElementById("year-slider").value;

  chart.mapLayer
    .selectAll("path.country")
    .style("fill", d => {
      const key = d.properties.name.trim();
      const row = chart.countryDataLookup[key]?.[currentYear];

      if (!row || !hasValidData(row, currentIndicator)) {
        return "#e5e5e5"; // no data
      }

      const region = chart.countryToRegion.get(d.properties.name);
      const baseColor = chart.color(region);

      if (chart.selectedCountries.has(key)) {
        return baseColor; // selected stays full region color
      }

      return d3.color(baseColor).brighter(1.2); // valid but unselected
    })
    .style("stroke", d => {
      const key = d.properties.name.trim();
      const row = chart.countryDataLookup[key]?.[currentYear];
      const isValid = row && hasValidData(row, currentIndicator);
      const isSelected = chart.selectedCountries.has(key);

      if (!isValid) {
        return "#999";          // invalid always grey
      }
      if (isSelected) {
        return "#000";          // selected stays bold
      }
      return "#666";            // normal valid
    })
    .style("stroke-width", d => {
      const key = d.properties.name.trim();
      const row = chart.countryDataLookup[key]?.[currentYear];
      const isValid = row && hasValidData(row, currentIndicator);
      const isSelected = chart.selectedCountries.has(key);

      if (!isValid) {
        return 0.5;
      }
      if (isSelected) {
        return 1.5;             // persistent bold outline
      }
      return 0.8;
    });
}


function applyCountryHighlight(target, chart) {

  // 1. Clear all selections
  if (target === null) {
    chart.selectedCountries.clear();
    updateMapStyling(chart);
    return;
  }

  const isRegion = chart.regionToCountries.has(target);

  if (isRegion) {
    const countries = chart.regionToCountries.get(target).map(d => d.Country);

    // Check if region is already fully active
    const isRegionActive = countries.every(c =>
      chart.selectedCountries.has(c)
    );

    if (isRegionActive) {
      // Turn region OFF
      countries.forEach(c => chart.selectedCountries.delete(c));
    } else {
      // Turn region ON
      countries.forEach(c => chart.selectedCountries.add(c));
    }

  } else {
    // Toggle single country
    if (chart.selectedCountries.has(target)) {
      chart.selectedCountries.delete(target);
    } else {
      chart.selectedCountries.add(target);
    }
  }

  // ⭐ Reapply correct map styling (valid countries stay coloured)
  updateMapStyling(chart);
}

function applyBubbleHighlightOnly(chart) {
  const bubbles = chart.bubbleLayer.selectAll("circle.bubbles");

  bubbles
    .classed("bubble-selected", d => selectedCountries.has(d.Country))
    .style("opacity", d => {

      const isSelected = chart.selectedCountries.has(d.Country);
      const regionMatch = activeRegions.size === 0 || activeRegions.has(d.Region);

      // 1. If a country is selected → it ALWAYS wins
      if (isSelected) {
        return 1;
      }

      // 2. If regions are active → dim bubbles outside those regions
      if (activeRegions.size > 0) {
        return regionMatch ? 1 : 0.25;
      }

      // 3. If countries are selected but this bubble is not selected
      if (chart.selectedCountries.size > 0) {
        return 0.40;
      }

      // 4. Default state
      return 0.85;
    });

  // Raise selected bubbles
  bubbles
    .filter(d => chart.selectedCountries.has(d.Country))
    .raise();
}

function updateBubbleLabels(chart) {
  // 1. Get the actual bubble-bound data (correct references)
  const { bubbleLayer, labelLayer, x, y } = chart;

  const bubbleData = bubbleLayer.selectAll("circle.bubbles").data();
  const visibleSelected = bubbleData.filter(d => {
    const isSelected = chart.selectedCountries.has(d.Country);
    //const regionMatch = !activeRegion || d.Region === activeRegion;
    const regionMatch =
      activeRegions.size === 0 || activeRegions.has(d.Region);

    // If a country is selected → show label
    if (isSelected) return true;

    // If legend filter is active → show labels for that region
    //if (activeRegion) return regionMatch;
    if (activeRegions.size > 0) return regionMatch;


    return false;
  });

  // 2. Only selected AND visible in the filtered dataset
  // const visibleSelected = bubbleData.filter(d =>
  //   selectedCountries.has(d.Country));


  // JOIN DATA
  const labels = labelLayer.selectAll("text.bubble-label")
    .data(visibleSelected, d => d.Country);

  // EXIT
  labels.exit().remove();

  // ENTER
  const labelsEnter = labels.enter()
    .append("text")
    .attr("class", "bubble-label")
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .attr("fill", "black")
    .style("pointer-events", "none")
    .text(d => d.Country);

  // UPDATE + ENTER MERGE
  labelsEnter.merge(labels)
    .attr("x", d => x(d["Wealth Index"]))
    .attr("y", d => y(safeValue(d, currentIndicator)) - 12);
}

// UPDATES WHETHER THE LEGEND IS HIGHLIGHTED OR NOT //
function updateLegendHighlight(chart) {
d3.select("#legend")
  .selectAll(".legend-item")
  .classed("legend-active", d => activeRegions.has(d))
  .classed("legend-inactive", d => activeRegions.size > 0 && !activeRegions.has(d));
}



/////////////////////////////////////
// -- TOOLTIP HELPER FUNCTIONS -- //
////////////////////////////////////
function showTooltip(event, d) {
  const indicator = document.getElementById("indicator-select").value;
  const raw = d[indicator];
  let displayValue;

  if (raw == null || isNaN(raw)) {
    displayValue = "N/A";
  } else if (ratioIndicators.has(indicator)) {
    displayValue = raw.toFixed(1);
  } else {
    displayValue = (raw * 100).toFixed(1) + "%";
  }
  tooltip.style("opacity", 1)
    .html(`
        <strong>${d.Country} (${currentYear})</strong><br>
        Wealth Index: ${d["Wealth Index"]}<br>
        ${indicator}: ${
      ratioIndicators.has(indicator)
        ? d[indicator].toFixed(1)
        : (d[indicator] * 100).toFixed(1) + "%"
    }
      `);
  moveTooltip(event);
}
function moveTooltip(event) {
  tooltip.style("left", event.pageX + 10 + "px")
    .style("top", event.pageY - 20 + "px");
}

function hideTooltip() {
  tooltip.style("opacity", 0);
}


/////////////////////////////////////
// -- Draw Chart -- //
////////////////////////////////////
function drawChart(data,chart) {

  const svg = d3.select("#my_dataviz")
    .attr("width",  width  + margin.left + margin.right)
    .attr("height", height + margin.top  + margin.bottom);

  // Main translated group (all chart + map layers live inside this)
  const mainGroup = svg.append("g")
    .attr("class", "main-group")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  chart.svg = mainGroup;
  chart.width = width;
  chart.height = height;
  const mapOffset = chart.width + 300;   // 50px padding


  // --- STORE DATA ---//
  chart.data = data;
  chart.svg = svg;


  chart.chartLayer = mainGroup.append("g")
    .attr("class", "chart-layer")
    .attr("transform", `translate(0, 0)`);   // adjust upward/downward here


  // --- Legend ---
  const legend = mainGroup.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width +40}, 20)`);
  // allow region groupings to properly assign to map
  chart.regionToCountries = d3.group(chart.data, d => d.Region);
  //chart.selectedRegions = new Set();
  chart.countryToRegion = new Map();
  chart.data.forEach(d => {
    chart.countryToRegion.set(d.Country, d.Region);
  });


  // chart.labelLayer = labelLayer;
// --- GRID LAYER ----
  let gridLayer = mainGroup.append("g").attr("class", "grid-layer");
  chart.gridLayer = gridLayer
// --- BUBBLE LABEL LAYER ---
  chart.labelLayer = mainGroup.append("g").attr("class", "label-layer");


// Background click-catcher
  mainGroup.append("rect")
    .attr("class", "chart-bg")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    .style("fill", "transparent")
    .style("pointer-events", "all")
    .on("click", () => {
      selectedBubble = null;

      chart.bubbleLayer.selectAll("circle.bubbles")
        .classed("bubble-selected", false);

      hideTooltip();
    });

// --- Scales ---
  let x = d3.scaleLinear().range([0, width]);
  let y = d3.scaleLinear().range([height, 0]);
  let bubbleRadius = 10;   // size of the bubbles
  const originalColors = [
    "#0072B2", // deep blue
    "#E69F00", // amber
    "#009E73", // emerald
    "#D55E00", // burnt orange
    "#CC79A7", // magenta
    "#56B4E9", // sky blue
    "#F0E442", // yellow
    "#A6761D", // warm brown
    "#B22222", // firebrick red
    "#0099CC"  // turquoise
  ];

  const cbfColors = [
    "#0072B2", // strong blue
    "#E69F00", // orange
    "#009E73", // bluish green
    "#D55E00", // vermillion
    "#CC79A7", // reddish purple
    "#56B4E9", // sky blue
    "#F0A202", // warm gold (CVD-safe alternative to yellow)
    "#8C564B", // muted brown (CVD-safe)
    "#9467BD", // purple (CVD-safe)
    "#17BECF"  // teal (CVD-safe)
  ];


  let regionColors = originalColors;
  let usingCBF = false;

  let color = d3.scaleOrdinal()
    .domain(["North America","South America", "North Africa","Sub-Saharan Africa", "East Asia","South Asia",
      "South East Asia","Central Asia", "Middle East", "Europe"])
    .range(regionColors);


  chart.color = color //now this can be used anywhere
  chart.x = x
  chart.y = y
  chart.bubbleRadius = bubbleRadius;
  chart.originalColors = originalColors;
  chart.cbfColors = cbfColors;
  chart.regionColors = regionColors;
  chart.usingCBF = usingCBF;
  chart.color = color;

// --- Axes ---
  let indicatorMax = 100;  // default
  let xAxis = mainGroup.append("g")
    .attr("transform", `translate(0, ${height})`);
  let yAxis = mainGroup.append("g");

  chart.indicatorMax = indicatorMax
  chart.xAxis = xAxis
  chart.yAxis = yAxis
//bubble layer used for all bubble operations

  //const bubbleLayer = svg.append("g").attr("class", "bubble-layer");
  chart.bubbleLayer = mainGroup.append("g").attr("class", "bubble-layer");
  //chart.bubbleLayer = bubbleLayer

// Draw axes immediately so they appear on load
  x.domain([0, 100]);
  y.domain([0, 100]);

  xAxis.call(d3.axisBottom(x).ticks(10));
  yAxis.call(d3.axisLeft(y).ticks(10));

// --- Axis labels ---
  const xLabel = mainGroup.append("text")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .style("font-size", "14px")
    .text("Wealth Index");

  let yLabel = mainGroup.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `translate(-45, ${height / 2}) rotate(-90)`)
    .style("font-size", "14px")
    .text("Adult Literacy Rate (%)");   // default indicator label

  chart.yLabel = yLabel

    // Clicking on slider track moves handle (D3 v6 uses d3.pointer)
  mainGroup.on("click", (event) => {
      const [px] = d3.pointer(event);
      const year = Math.round(x.invert(px));

      handle.attr("cx", x(year));
      label.attr("x", x(year)).text(year);

      currentYear = year;
      chart.update(currentIndicator, currentYear);
      updateMapStyling(chart);


  });

  mainGroup.on("click", (event) => {
    // If the click target *is* a bubble, ignore this handler
    if (event.target.tagName === "circle") return;

    selectedBubble = null;

    bubbleLayer.selectAll("circle.bubbles")
      .classed("bubble-selected", false);

    hideTooltip(); //hides tooltip when the user clicks off the bubble
  });


  return {
    mainGroup,
    chart
    // bubbleLayer: chart.bubbleLayer,
    // gridLayer: chart.gridLayer,
    // labelLayer: chart.labelLayer,
    // x: chart.x,
    // y: chart.y,
    // xAxis: chart.xAxis,
    // yAxis: chart.yAxis,
    // yLabel: chart.yLabel,
    // color: chart.color,
    // data: chart.data,
    // bubbleRadius: chart.bubbleRadius,
    // indicatorMax: chart.indicatorMax
  };


}

function update(indicator, year,chart) {
  // Clear any previous selection + tooltip when year/indicator changes
  const {
    svg,
    bubbleLayer,
    gridLayer,
    labelLayer,
    bubbleRadius,
    x,
    y,
    xAxis,
    yAxis,
    yLabel,
    color,
    data,
    indicatorMax
  } = chart;

  selectedBubble = null;
  chart.currentIndicator = indicator;
  chart.currentYear = year;
  bubbleLayer.selectAll("circle.bubbles").classed("bubble-selected", false);
  //hideTooltip();

  currentYear = year;
  const yearFiltered = data.filter(d => +d.Year === currentYear);

  const filtered = yearFiltered.filter(d => {
    const wealth = +d["Wealth Index"];
    const rawVal = d[indicator];
    if (!Number.isFinite(wealth) || wealth <= 0) return false;
    if (rawVal == null || rawVal === "" || isNaN(+rawVal)) return false;
    return true;
  });


  x.domain([0, 100]);
  y.domain([0, indicatorMax]);

  xAxis.transition().duration(500).call(d3.axisBottom(x).ticks(10));
  yAxis.transition().duration(500).call(d3.axisLeft(y));

  //yAxis.transition().duration(500).call(d3.axisLeft(y).ticks(10));

  yLabel.text(
    ratioIndicators.has(indicator)
      ? indicator
      : indicator + " (%)"
  );


  //GENERATE GRID LAYER AND UPDATE WHEN SCALES CHANGE
  gridLayer.selectAll("*").remove();  // clear old grid

  // X gridlines
  gridLayer.append("g")
    .attr("class", "grid x-grid")
    .attr("transform", `translate(0,${height})`)
    .call(
      makeXGridlines(x)
        .tickSize(-height)
        .tickFormat("")
    );

  // Y gridlines
  gridLayer.append("g")
    .attr("class", "grid y-grid")
    .call(
      makeYGridlines(y)
        .tickSize(-width)
        .tickFormat("")
    );

  // Bind data
  let bubbles = bubbleLayer.selectAll("circle.bubbles")
    .data(filtered, d => d.Country);

  bubbles.exit()
    .transition()
    .duration(300)
    .attr("r", 0)
    .remove()
    .on("end", () => {
      updateBubbleLabels(chart); // run AFTER bubble is removed
    });


  // ENTER
  const bubblesEnter = bubbles.enter()
    .append("circle")
    .attr("class", "bubbles")
    .attr("cx", d => x(d["Wealth Index"]))
    .attr("cy", d => y(safeValue(d,indicator))) //changed
    .attr("r", 0)
    .style("fill", d => chart.color(d.Region))
    .style("opacity", 0.9)
    .on("mouseover", (event, d) => {
      if (!selectedBubble) showTooltip(event, d);
    })
    .on("mousemove", (event) => {
      if (!selectedBubble) moveTooltip(event);
    })
    .on("mouseout", () => {
      if (!selectedBubble) hideTooltip();
    })
    .on("click", (event, d) => {
      const country = d.Country;
      // Toggle selection
      if (selectedCountries.has(country)) {
        selectedCountries.delete(country); //clicking again removes the highlight
      } else {
        selectedCountries.add(country);
      }
      applyBubbleHighlightOnly(chart);
      applyCountryHighlight(country,chart)
      chart.update(indicator, currentYear);
      updateMapStyling(chart);
    })



  // MERGE
  bubbles = bubblesEnter.merge(bubbles);

  bubbleLayer.selectAll("circle.bubbles")
    .classed("bubble-selected", false)
    .style("opacity", 0.85);


  // UPDATE
  const tUpdate = d3.transition("update").duration(100).ease(d3.easeLinear);
  bubbles
    .transition(tUpdate)
    .attr("cx", d => x(d["Wealth Index"]))
    .attr("cy", d => y(safeValue(d, currentIndicator)))
    //.attr("cy", d => y(safeValue(d, indicator)))
    .attr("r", chart.bubbleRadius)
    .style("fill", d => chart.color(d.Region));


  // Re-apply selected bubble highlight
  bubbleLayer.selectAll("circle.bubbles")
    .classed("bubble-selected", d =>
      selectedBubble && d.Country === selectedBubble.Country
    );

  applyBubbleHighlightOnly(chart);
  updateBubbleLabels(chart);





}//// END OF THE UPDATE() FUNCTION


// -----------------------------
// SLIDER CREATION
// -----------------------------


function createYearSlider(minYear, maxYear, defaultYear,chart) {
  const slider = document.getElementById("year-slider");
  const yearValue = document.getElementById("year-value");

  slider.min = minYear;
  slider.max = maxYear;
  slider.value = defaultYear;
  yearValue.textContent = defaultYear;

  slider.addEventListener("input", () => {
    const year = +slider.value;
    yearValue.textContent = year;
    chart.update(currentIndicator, year);
    updateMapStyling(chart);

  });
}

// SLIDER PLAY ANIMATION
function startAnimation() {
  isPlaying = true;
  playButton.textContent = "⏸ Pause";

  playInterval = setInterval(() => {
    let currentYear = +slider.value;
    let nextYear = currentYear + 1;

    if (nextYear > +slider.max) {
      nextYear = +slider.min;
    }

    slider.value = nextYear;

    // Trigger your existing slider logic
    slider.dispatchEvent(new Event("input"));

  }, 500);
}



// SLIDER ANIMATION WHEN STOP
function stopAnimation() {
  isPlaying = false;
  playButton.textContent = "▶ Play";
  clearInterval(playInterval);
}

// -----------------------------
// 2. INDICATOR CHANGE HANDLER
// -----------------------------
function setupIndicatorSelect(chart, data) {
  const select = document.getElementById("indicator-select");

  select.addEventListener("change", (event) => {
    currentIndicator = event.target.value;

    if (indicatorsOver100.has(currentIndicator)) {

      const filtered = data.filter(d =>
        isFinite(safeValue(d, currentIndicator)) &&
        d["Wealth Index"] != null &&
        d["Wealth Index"] !== "" &&
        !Number.isNaN(+d["Wealth Index"])
      );


      chart.indicatorMax = Math.ceil(
        d3.max(filtered, d => safeValue(d, currentIndicator)) / 10
      ) * 10;

    } else {
      chart.indicatorMax = 100;
    }

    chart.update(currentIndicator, currentYear);
    updateMapStyling(chart);

  });
}

// -----------------------------
// 4. LEGEND CREATION
// -----------------------------
function createLegend(chart,legend) {
  //const { color } = chart;

  const regions = [
    "North America","South America", "North Africa","Sub-Saharan Africa", "East Asia","South Asia",
    "South East Asia","Central Asia", "Middle East", "Europe"
  ];

  legend
    .attr("width", 200)
    .attr("height", regions.length * 24 + 20);

  //THIS IS WHERE LEGEND-ITEM IS ASSIGNED TO #legend HTML SVG
  const legendItems = legend.selectAll(".legend-item")
    .data(regions)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 24})`)
    .on("click", (event, region) => {
      //activeRegion = activeRegion === region ? null : region; //fix this
      if (activeRegions.has(region)) {
        activeRegions.delete(region);   // unselect
      } else {
        activeRegions.add(region);      // select
      }

      updateLegendHighlight(chart);
      applyBubbleHighlightOnly(chart);
      updateBubbleLabels(chart);
      applyCountryHighlight(region,chart);
    });

  legendItems.append("circle")
    .attr("class", "legend-dot")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 6)
    .style("fill", d => chart.color(d));

  legendItems.append("text")
    .attr("x", 15)
    .attr("y", 4)
    .style("font-size", "12px")
    .text(d => d);
}
//COLOR BLIND TOGGLE LOGIC

document.getElementById("toggleColors").addEventListener("click", () => {
  // Flip the palette
  chart.usingCBF = !chart.usingCBF;
  chart.regionColors = chart.usingCBF ? chart.cbfColors : chart.originalColors;

  // Update the scale
  chart.color.range(chart.regionColors);

  //Rebind bubble data so d.Region exists again
  update(chart.currentIndicator, chart.currentYear, chart);
  // Recolour marks + legend
  updateColors(chart);
});

// -----------------------------
// 1. LOAD & PREPARE DATA
// -----------------------------
window.addEventListener("DOMContentLoaded", () => {

Promise.all([
  d3.json("world.json"),
  d3.csv("data/Wealth-GINI-Education_Data.csv")
]).then(([world, rawdata]) =>
{

  // -----------------------------
  // 1. CLEAN & PREP DATA
  // -----------------------------
  rawdata.forEach(d => {
    d.Year = +d.Year;
    d.Region = d.Region.replace(/\u00A0/g, "").trim();
  });

  data = rawdata;

  const years = Array.from(new Set(data.map(d => +d.Year))).sort((a, b) => a - b);
  const minYear = 1999;
  const maxYear = d3.max(years);

  // Convert numeric fields
  data.forEach(d => {
    for (const key in d) {
      if (["Country", "ISO Code", "Region", "Year"].includes(key)) continue;

      const raw = d[key];
      if (raw == null || (typeof raw === "string" && raw.trim() === "")) {
        d[key] = null;
        continue;
      }

      const num = +raw;
      d[key] = isNaN(num) ? null : num;
    }
  });


  // -----------------------------
  // 5. INITIAL RENDER
  // -----------------------------

  // DRAW CHART BUILDS CHART AND RETURNS EVERYTHING UPDATE NEEDS
  drawChart(data,chart);
  //UPDATE IS ATTACHED TO THE CHART OBJECT
  chart.update = (indicator, year) => update(indicator, year, chart);

  // -----------------------------
  // --- GEOJSON MAP CREATION ---
  // -----------------------------
  const countries = world.features;   // use .features because your file is GeoJSON
  drawMap(world, chart);
  // initial sync of map colors
  updateMapStyling(chart);



  // 🔹 Call update once with your initial state
  const initialIndicator = document.getElementById("indicator-select").value;
  const initialYear = +document.getElementById("year-slider").value;

  chart.update(initialIndicator, maxYear);


  // -----------------------------
  //  CALL LEGEND CREATION
  // -----------------------------
  const legend = d3.select("#legend");
  createLegend(chart, legend);

  const defaultIndicator = document.getElementById("indicator-select").value;
  const defaultYear = maxYear;
  chart.update(defaultIndicator, defaultYear);
  currentYear = defaultYear;
  positionControls();


  // -----------------------------
  //  CALL THE INDICATOR CHANGE HANDLER
  // -----------------------------

  setupIndicatorSelect(chart, data);

  // -----------------------------
  //  CALL SLIDER CREATION
  // -----------------------------
  createYearSlider(minYear, maxYear, defaultYear, chart);

  // -----------------------------
  //  UPDATE THE MAP HIGHLIGHTS
  // -----------------------------
  updateMapStyling(chart);

}); // <-- THIS is the ONLY closing brace for d3.csv
});


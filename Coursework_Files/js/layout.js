function positionControls() {



  const chartSvg = d3.select("#my_dataviz");
  const chartBBox = chartSvg.node().getBBox();
  const chartRect = document
    .getElementById("my_dataviz")
    .getBoundingClientRect();

  const containerRect = document
    .getElementById("my_dataviz-container")
    .getBoundingClientRect();

  //LEGEND VARIABLES //
  const legend = d3.select("#legend");


  //INDICATOR VARIABLES //
  const indicator = document.getElementById("indicator-container");




  //RESET BUTTON VARIABLES //
  const reset = document.getElementById("reset-button-container");
  reset.style.position = "absolute";
  const resetRect = reset.getBoundingClientRect();

  //Toggle Colors BUTTON VARIABLES //
  const toggleButton = document.getElementById("toggle-Colors-container");
  toggleButton.style.position = "absolute";
  const toggleRect = toggleButton.getBoundingClientRect();


  // --- LEGEND POSITION ---
  // Legend is absolutely positioned in page coordinates
  legend.style("position", "absolute");

// Compute pixel offsets
  const legendLeft = chartRect.right +80;   // 30px from right edge
  const legendTop  = chartRect.top + 70;     // 70px below top of chart

  legend.style("left", `${legendLeft}px`);
  legend.style("top", `${legendTop}px`);

// Set legend width AFTER positioning
  legend.attr("width", 120);

// Now get the true bounding box
  const legendRect = legend.node().getBoundingClientRect();



  // --- INDICATOR POSITION ---
  indicator.style.position = "absolute";
  indicator.style.left = `${legendLeft-60}px`;
  indicator.style.top = `${legendTop + legendRect.height-20}px`;
  const indicatorRect = indicator.getBoundingClientRect();


  // --- RESET BUTTON POSITION ---
  // Center horizontally under indicator
  reset.offsetHeight;

  reset.style.left =
    `${indicatorRect.left - containerRect.left +
    (indicatorRect.width - resetRect.width) / 2}px`;

  // Place vertically below indicator
  reset.style.top =
    `${indicatorRect.bottom - 20}px`;


  // --- Toggle BUTTON POSITION ---
  toggleButton.offsetHeight;
  toggleButton.style.left =
    `${legendRect.left-40}px`;

  // Place vertically below indicator
  toggleButton.style.top =
    `${legendRect.top-70}px`;

  }




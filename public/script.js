const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("svg")
    .attr("id", "map")
    .attr("viewBox", [0, 0, width, height])
    .on("click", reset);

var g = svg.append("g");

const zoom = d3.zoom()
  .scaleExtent([0.75, 500]).filter(function() {
    return !d3.event.button && d3.event.type != "dblclick";
  })
  .on("zoom", zoomed);

const drag = d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);

const water = [
  258800, 259200, 259400, 306400, 363900, 363700, 259900, 259600, 119300, 258000, 
  258200, 110600, 112000, 100300, 105000, 147300, 112000, 258400, 110300, 141400,
  258700, 258300, 258700, 188100, 258500, 111000, 198300, 259000, 259300, 363600,
  363400, 300200, 363500, 363800, 341700, 341600, 343200, 346300, 346100, 346500,
  357200, 357400, 357100, 357800, 342900, 207500, 207500, 257600, 309100, 336500,
  333000, 311600, 300400, 301900, 303700, 308700, 332300, 333400, 349500, 344600,
  363200, 359200, 361800, 359200, 171000, 186900, 185100, 259700, 212700, 259500,
  203300, 204000, 192200, 190700, 192700, 166800, 239700, 258600, 301400, 350800
]

SA2work = null;
SA2edu = null;
SA2total = null;
pointer = "origin";
origin = null;
destination = null;
strokeWidth = null;
chartData = null;
infoData = null;
chartDataVisible = "off";

d3.csv("/SA2work_v2.csv", function(data) {
  // console.log(data);
  SA2work = data;
}).on("progress", function(event){
    //update progress bar
    //console.log(event)
    if (event.lengthComputable) {
      var percentComplete = Math.round(event.loaded * 100 / event.total);
      console.log("SA2work_v2 loaded: " + percentComplete);
    }
});

d3.csv("/SA2education_v2.csv", function(data) {
  // console.log(data);
  SA2edu = data;
}).on("progress", function(event){
    //update progress bar
    if (event.lengthComputable) {
      var percentComplete = Math.round(event.loaded * 100 / event.total);
      console.log("SA2education_v2 loaded: " + percentComplete);
    }
});

d3.csv("/SA2total_v3.csv", function(data) {
  // console.log(data);
  SA2total = data;
}).on("progress", function(event){
    //update progress bar
    if (event.lengthComputable) {
      var percentComplete = Math.round(event.loaded * 100 / event.total);
      console.log("SA2total_v3 loaded: " + percentComplete);
    }
});

d3.queue()
    .defer(d3.json, "/SA2supersimple.json")
    .await(ready);

function ready(error, SA2) {
  if (error) throw error;

  var geoData = topojson.feature(SA2, SA2.objects.SA2)
  var projection = d3.geoMercator()
  var path = d3.geoPath().projection(projection)
  projection.fitSize([width, height], geoData);

  g.selectAll("path")
    .data(geoData.features).enter()
    .append("path")
    .attr("id", d => "m" + d.properties.SA22018_V1 )
    .attr("class", d => {
      if (water.includes(parseInt(d.properties.SA22018_V1))) {
        return "water";
      } else {
        return "land"
      }
    })
    .style("stroke-width", 1)
    .attr("d", path)
    .on("click", clicked)
    .on("mouseover", destinationPointer);

  g.selectAll(".water").style("fill", "#6ba3c9");
  g.selectAll(".land").style("fill", "#edebe8");

  svg.call(zoom);
  svg.call(drag);
  reset()

  function destinationPointer(d) {
    
    if (matchMedia('(pointer:fine)').matches) {
      // Device has a mouse
      // document.getElementById("destination-box").style.display = "inline-block"
      document.getElementById('destinationArea').innerHTML = d.properties.SA22018__1
      destination = d
    }

    if (infoData && destination) {
      if (infoData.length > 0) {
        createInfoCharts()
      }
    } 
  }

  function clicked(d) {
    if (origin == d) {
      g.selectAll('.land').style('fill', '#edebe8').style('fill-opacity', 1).style('stroke', '#63758d').style('stroke-width', strokeWidth)
      g.selectAll('.water').style('fill', '#6ba3c9').style('fill-opacity', 1).style('stroke', '#63758d').style('stroke-width', strokeWidth)
      d3.event.stopPropagation();
      document.getElementById('originArea').innerHTML = "Click on the map to select an area";
      document.getElementById('destinationArea').innerHTML = null;
      origin = null;
      chartNone()
      hideInfoCharts();

      if (matchMedia('(pointer:coarse)').matches) {
        changePointer("origin")
      }
    // document.getElementById("origin-box").style.display = "none"
    } else {
      document.getElementById("reset-button").style.display = "none"
      document.getElementById("clear-button").style.display = "inline-block"

      if (pointer == "origin") {
        g.selectAll('.land').style('fill', '#edebe8').style('fill-opacity', 1).style('stroke', '#63758d').style('stroke-width', strokeWidth)
        g.selectAll('.water').style('fill', '#6ba3c9').style('fill-opacity', 1).style('stroke', '#63758d').style('stroke-width', strokeWidth)
        origin = d;
        // console.log(d)
        document.getElementById('originArea').innerHTML = d.properties.SA22018__1
        document.getElementById('destinationArea').innerHTML = "Click on the map to select an area"
        // document.getElementById("origin-box").style.display = "inline-block"
        selectArea()

        var [[x0, y0], [x1, y1]] = d3.geoBounds(d);
        [[x0, y0], [x1, y1]] = [projection([x0, y0]), projection([x1, y1])]

        d3.event.stopPropagation();
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(Math.min(25, 1 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
            d3.mouse(svg.node())
        );

        if (matchMedia('(pointer:coarse)').matches) {
          changePointer("destination")
        }
      } else {
        destination = d
        d3.event.stopPropagation();
        document.getElementById('destinationArea').innerHTML = d.properties.SA22018__1
        createInfoCharts()
      }
    }
  }
}

function changePointer(mode) {
  if (mode == "origin") {
    pointer = "origin"
    console.log("origin pointer")
  } else {
    pointer = "destination"
    console.log("destination pointer")
  }
}

function selectArea(){
    g.selectAll('circle').style('display', 'none')
    g.selectAll('.land').style('fill', '#edebe8').style('fill-opacity', 1)
    g.selectAll('.water').style('fill', '#6ba3c9').style('fill-opacity', 1)

    var mapView = document.getElementById("mapView").value
    var mapDirection = document.getElementById("mapDirection").value

    console.log(mapView);
    console.log(mapDirection);

    var mapData = {}
    if (mapView == "education") { mapData = SA2edu } else if (mapView == "work") {  mapData = SA2work } else { mapData = SA2total; }

    console.log(typeof(mapData))

    var x = mapData.filter(p => {
      if (mapDirection == "inbound") {
        return (p.SA2_code_other_address == origin.properties.SA22018_V1) || (p.SA2_code_workplace_address == origin.properties.SA22018_V1) || (p.SA2_code_educational_address == origin.properties.SA22018_V1)
      } else if (mapDirection == "outbound") {
        return (p.SA2_code_usual_residence_address == origin.properties.SA22018_V1)
      } else {
        return (p.SA2_code_usual_residence_address == origin.properties.SA22018_V1) || (p.SA2_code_other_address == origin.properties.SA22018_V1) || (p.SA2_code_workplace_address == origin.properties.SA22018_V1) || (p.SA2_code_educational_address == origin.properties.SA22018_V1)
      }
    })

    var max = 0;
    var min = 10000;

    x.forEach(function(e) {  
      //e.g. 187100 and 187500
      var b = x.filter(d => {
        // look for (usual = 187100 AND other = 187500) OR (usual = 187500 AND other = 187100)
        return (
                  ((d.SA2_code_usual_residence_address == e.SA2_code_usual_residence_address) && 
                  ((d.SA2_code_educational_address || d.SA2_code_workplace_address || d.SA2_code_other_address) == (e.SA2_code_educational_address || e.SA2_code_workplace_address || e.SA2_code_other_address))
                  ||
                  ((d.SA2_code_educational_address || d.SA2_code_workplace_address || d.SA2_code_other_address) == e.SA2_code_usual_residence_address) &&
                  (d.SA2_code_usual_residence_address == (e.SA2_code_educational_address || e.SA2_code_workplace_address || e.SA2_code_other_address)))


                // (((e.SA2_code_usual_residence_address == (d.SA2_code_educational_address || d.SA2_code_workplace_address || d.SA2_code_other_address)) && 
                //  ((e.SA2_code_educational_address || e.SA2_code_workplace_address || e.SA2_code_other_address) == d.SA2_code_usual_residence_address))) || 

                // (((d.SA2_code_usual_residence_address == (e.SA2_code_educational_address || e.SA2_code_workplace_address || e.SA2_code_other_address)) && 
                //  ((d.SA2_code_educational_address || d.SA2_code_workplace_address || d.SA2_code_other_address) == e.SA2_code_usual_residence_address)))
                )
      });

      var total = 0;

      if (b.length > 1){
        total = parseInt(b[0].Total) + parseInt(b[1].Total)
        console.log(b)
      } else {
        total = parseInt(e.Total)
      }
      console.log(total)
      
      if (total > max) {
        max = total;
      }

      if (total < min) {
        min = total;
      }
    });

    document.getElementById("min").innerHTML = min;
    document.getElementById("max").innerHTML = max;

    x.forEach(function(e) {
      var b = x.filter(d => {
        return (
                ((d.SA2_code_usual_residence_address == e.SA2_code_usual_residence_address) && 
                ((d.SA2_code_educational_address || d.SA2_code_workplace_address || d.SA2_code_other_address) == (e.SA2_code_educational_address || e.SA2_code_workplace_address || e.SA2_code_other_address))
                ||
                ((d.SA2_code_educational_address || d.SA2_code_workplace_address || d.SA2_code_other_address) == e.SA2_code_usual_residence_address) &&
                (d.SA2_code_usual_residence_address == (e.SA2_code_educational_address || e.SA2_code_workplace_address || e.SA2_code_other_address)))
              )
      });

      var total = 0;

      if (b.length > 1){
        total = parseInt(b[0].Total) + parseInt(b[1].Total)
      } else {
        total = parseInt(e.Total)
      }

      if ((e.SA2_code_educational_address || e.SA2_code_workplace_address || e.SA2_code_other_address) == origin.properties.SA22018_V1) {
        g.selectAll("#m" + e.SA2_code_usual_residence_address).style('fill', 'hsl(' + (5+(1-(total/max))*50) +',97%,48%')//.style('fill-opacity', element.Total/max)
        // console.log("in: " + element.SA2_code_usual_residence_address)
      } else {
        g.selectAll("#m" + (e.SA2_code_educational_address || e.SA2_code_workplace_address || e.SA2_code_other_address)).style('fill', 'hsl(' + (5+(1-(total/max))*50) +',97%,48%')//.style('fill-opacity', element.Total/max)
        // console.log("out: " + element.SA2_code_workplace_address)
      }
    });

    var a = [], b = [], c = [];

    x.forEach(function(element) {
      //local
      if ((element.SA2_code_usual_residence_address == origin.properties.SA22018_V1) && ((element.SA2_code_educational_address || element.SA2_code_workplace_address || element.SA2_code_other_address) == origin.properties.SA22018_V1) ) {
        // g.selectAll("#m" + element.SA2_code_usual_residence_address).style('fill', 'hsl(' + (5+(1-(element.Total/max))*50) +',97%,48%')//.style('fill-opacity', element.Total/max)

        var t = []

        Object.keys(element).forEach(e => {
          if (!(e.includes("SA2") || e.includes("Total"))) {
            t.push({
              name: e,
              value: parseInt(element[e])
            });
          } 
        })
        // console.log(t)
        
        a.push({name: element.SA2_name_usual_residence_address, children: t})
      }
      //inbound
      else if ((element.SA2_code_usual_residence_address == origin.properties.SA22018_V1) && ((element.SA2_code_educational_address || element.SA2_code_workplace_address || element.SA2_code_other_address) != origin.properties.SA22018_V1)) {
        // g.selectAll("#m" + element.SA2_code_usual_residence_address).style('fill', 'hsl(' + (5+(1-(element.Total/max))*50) +',97%,48%')//.style('fill-opacity', element.Total/max)

        var t = []

        Object.keys(element).forEach(e => {
          if (!(e.includes("SA2") || e.includes("Total"))) {
            t.push({
              name: e,
              value: parseInt(element[e])
            });
          } 
        })
        // console.log(t)

        b.push({name: element.SA2_name_usual_residence_address, children: t})
      } else {
        // g.selectAll("#m" + (element.SA2_code_educational_address || element.SA2_code_workplace_address || element.SA2_code_other_address)).style('fill', 'hsl(' + (5+(1-(element.Total/max))*50) +',97%,48%')//.style('fill-opacity', element.Total/max)

        var t = []

        Object.keys(element).forEach(e => {
          if (!(e.includes("SA2") || e.includes("Total"))) {
            t.push({
              name: e,
              value: parseInt(element[e])
            });
          } 
        })
        // console.log(t)

        c.push({name: element.SA2_name_educational_address || element.SA2_name_workplace_address || element.SA2_name_other_address, children: t})
      }
    });

    infoData = x;

    chartArray = []

    if (a) {
      chartArray.push({
        name: "Local",
        children: a
      })
    }
    if (b) {
      chartArray.push({
        name: "Inbound",
        children: b
      })
    }
    if (c) {
      chartArray.push({
        name: "Outbound",
        children: c
      })
    }

    chartData = {
      name: origin.properties.SA22018__1 + " (" + origin.properties.SA22018_V1 + ")",
      children: chartArray
    };

    document.getElementById("view-chart-button").style.display = "inline-block"

    if (infoData.length > 0) {
      // console.log(infoData)
      createBreakdownChart()
    } else {
      chartNone()
      hideInfoCharts();  
    }
}

function createBreakdownChart() {

  data = chartData
  color = d3.scaleOrdinal().range(d3.schemeCategory20c);

  d3.select("#chart").remove()

  // var el_id = '';
  // var obj = document.getElementById(el_id);
  // var divWidth = obj.offsetWidth;
  var margin = {top: 30, right: 0, bottom: 0, left: 0},
      // chartWidth = divWidth -25,
      // chartHeight = 600 - margin.top - margin.bottom,
      formatNumber = d3.format(","),
      transitioning;

  chartWidth = window.innerWidth;
  chartHeight = window.innerHeight * 0.70 - margin.top - margin.bottom;
  // sets x and y scale to determine size of visible boxes
  var x = d3.scaleLinear()
      .domain([0, chartWidth])
      .range([0, chartWidth]);
  var y = d3.scaleLinear()
      .domain([0, chartHeight])
      .range([0, chartHeight]);
  var treemap = d3.treemap()
          .size([chartWidth, chartHeight])
          .paddingInner(0)
          .round(false);
  var svg = d3.select('#chart-container').append("svg")
      .attr("id", "chart")
      .attr("width", chartWidth + margin.left + margin.right)
      .attr("height", chartHeight + margin.bottom + margin.top)
      .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
          .style("shape-rendering", "crispEdges");
  var grandparent = svg.append("g")
          .attr("class", "grandparent")
      grandparent.append("rect")
          .attr("y", -margin.top)
          .attr("width", chartWidth)
          .attr("height", margin.top)
          .attr("fill", '#205281');
      grandparent.append("text")
          .attr("x", 6)
          .attr("y", 6 - margin.top)
          .attr("dy", ".75em")
          .attr("fill", "white");


    var root = d3.hierarchy(data);
    // console.log(root);
    treemap(root
        .sum(function (d) {
            return d.value;
        })
        .sort(function (a, b) {
            return b.height - a.height || b.value - a.value
        })
    );
    display(root);
    chartHide();

    // document.getElementById("chart-container").style.display = "inline-block"

  function display(d) {
      // write text into grandparent
      // and activate click's handler
      grandparent
          .datum(d.parent)
          .on("click", transition)
          .select("text")
          .text(name(d));
      // grandparent color
      grandparent
          .datum(d.parent)
          .select("rect")
      var g1 = svg.insert("g", ".grandparent")
          .datum(d)
          .attr("class", "depth")
      var g = g1.selectAll("g")
          .data(d.children)
          .enter().
          append("g");
      // add class and click handler to all g's with children
      g.filter(function (d) {
          return d.children;
      })
          .classed("children", true)
          .on("click", transition);
      g.selectAll(".child")
          .data(function (d) {
              return d.children || [d];
          })
          .enter().append("rect")
          .attr("class", "child")
          .attr("fill", function (d) {
            return color(d.parent.data.name)
          })
          .call(rect);
      // add title to parents
      g.append("rect")
          .attr("class", "parent")
          .call(rect)
          .append("title")
          .text(function (d){
              return d.data.name;
          });
      /* Adding a foreign object instead of a text object, allows for text wrapping */
      g.append("foreignObject")
          .call(rect)
          .attr("class", "foreignobj")
          .append("xhtml:div")
          .attr("dy", ".75em")
          .html(function (d) {
              return '' +
                  '<p class="title"> ' + d.data.name + '</p>' +
                  '<p>' + formatNumber(d.value) + '</p>'
              ;
          })
          .attr("class", "textdiv"); //textdiv class allows us to style the text easily with CSS
      function transition(d) {
          if (transitioning || !d) return;
          transitioning = true;
          var g2 = display(d),
              t1 = g1.transition().duration(650),
              t2 = g2.transition().duration(650);
          // Update the domain only after entering new elements.
          x.domain([d.x0, d.x1]);
          y.domain([d.y0, d.y1]);
          // Enable anti-aliasing during the transition.
          svg.style("shape-rendering", null);
          // Draw child nodes on top of parent nodes.
          svg.selectAll(".depth").sort(function (a, b) {
              return a.depth - b.depth;
          });
          // Fade-in entering text.
          g2.selectAll("text").style("fill-opacity", 0);
          g2.selectAll("foreignObject div").style("display", "none");
          /*added*/
          // Transition to the new view.
          t1.selectAll("text").call(text).style("fill-opacity", 0);
          t2.selectAll("text").call(text).style("fill-opacity", 1);
          t1.selectAll("rect").call(rect);
          t2.selectAll("rect").call(rect);
          /* Foreign object */
          t1.selectAll(".textdiv").style("display", "none");
          /* added */
          t1.selectAll(".foreignobj").call(foreign);
          /* added */
          t2.selectAll(".textdiv").style("display", "block");
          /* added */
          t2.selectAll(".foreignobj").call(foreign);
          /* added */
          // Remove the old node when the transition is finished.
          t1.on("end.remove", function(){
              this.remove();
              transitioning = false;
          });
      }
      return g;
  }
  function text(text) {
      text.attr("x", function (d) {
          return x(d.x) + 6;
      })
          .attr("y", function (d) {
              return y(d.y) + 6;
          });
  }
  function rect(rect) {
      rect
          .attr("x", function (d) {
              return x(d.x0);
          })
          .attr("y", function (d) {
              return y(d.y0);
          })
          .attr("width", function (d) {
              return x(d.x1) - x(d.x0);
          })
          .attr("height", function (d) {
              return y(d.y1) - y(d.y0);
          })
          .attr("fill", function (d) {
              return '#205281';
          });
  }
  function foreign(foreign) { /* added */
      foreign
          .attr("x", function (d) {
              return x(d.x0);
          })
          .attr("y", function (d) {
              return y(d.y0);
          })
          .attr("width", function (d) {
              return x(d.x1) - x(d.x0);
          })
          .attr("height", function (d) {
              return y(d.y1) - y(d.y0);
          });
  }
  function name(d) {
      return breadcrumbs(d) +
          (d.parent
          ? " - Click here to zoom out"
          : " - Click squares below to zoom in");
  }
  function breadcrumbs(d) {
      var res = "";
      var sep = " > ";
      d.ancestors().reverse().forEach(function(i){
          res += i.data.name + sep;
      });
      return res
          .split(sep)
          .filter(function(i){
              return i!== "";
          })
          .join(sep);
  }
}

window.addEventListener('resize', function() {
  createBreakdownChart();
});


function createInfoCharts(){

  data = infoData.filter(d => {
    return ((destination.properties.SA22018_V1 == (d.SA2_code_other_address || d.SA2_code_educational_address || d.SA2_code_workplace_address)) || (destination.properties.SA22018_V1 == d.SA2_code_usual_residence_address))
  })

  if (data.length == 0) { hideInfoCharts(); return }

  if ((data.length > 0) && origin && destination) {
    data.forEach(item => {

      element = item

      Object.keys(element).forEach(e => {
        if (!e.includes("SA2")) {
          item[e] = parseInt(element[e]);
        };
      })
    });

    document.getElementById("info-inbound").innerHTML = 0
    document.getElementById("info-outbound").innerHTML = 0

    console.log("createInfoCharts")
    console.log(data)

    var inboundTotal = 0;
    var outboundTotal = 0;
    var localTotal = 0;

    data.forEach(item => {
      if ((item.SA2_code_usual_residence_address == origin.properties.SA22018_V1) && ((item.SA2_code_other_address || item.SA2_code_educational_address || item.SA2_code_workplace_address) == origin.properties.SA22018_V1)) {
        localTotal += item.Total
      } else if (item["SA2_code_usual_residence_address"] != origin.properties.SA22018_V1){
        inboundTotal += item.Total
      } else if (item["SA2_code_usual_residence_address"] == origin.properties.SA22018_V1){
        outboundTotal += item.Total
      }
    });

    document.getElementById("info-local").innerHTML = localTotal
    document.getElementById("info-inbound").innerHTML = inboundTotal
    document.getElementById("info-outbound").innerHTML = outboundTotal
    document.getElementById("info-net").innerHTML = outboundTotal + inboundTotal + localTotal

    document.getElementById("info-box").style.display = "inline-block"
    document.getElementById("origin").innerHTML = origin.properties.SA22018__1
    document.getElementById("destination").innerHTML = destination.properties.SA22018__1
  }
}

function hideInfoCharts() {
  document.getElementById("info-box").style.display = "none"
  document.getElementById("origin").innerHTML = null
  document.getElementById("destination").innerHTML = null
  document.getElementById("info-inbound").innerHTML = 0
  document.getElementById("info-outbound").innerHTML = 0
  document.getElementById("info-net").innerHTML = 0
}

function chartExpand() {
  document.getElementById("chart-container").style.display = "inline-block";
  document.getElementById("close-chart-button").style.display = "inline-block";
  document.getElementById("view-chart-button").style.display = "none";
  document.getElementById("reset-button").style.display = "none";
  document.getElementById("clear-button").style.display = "none";
}

function chartHide() {
  document.getElementById("chart-container").style.display = "none";
  document.getElementById("close-chart-button").style.display = "none";
  document.getElementById("view-chart-button").style.display = "inline-block";
  document.getElementById("reset-button").style.display = "none";
  document.getElementById("clear-button").style.display = "inline-block";
}

function chartNone() {
  document.getElementById("chart-container").style.display = "none";
  document.getElementById("close-chart-button").style.display = "none";
  document.getElementById("view-chart-button").style.display = "none";
}

function zoomed() {
  const {transform} = d3.event;
  g.attr("transform", transform);
  strokeWidth = 1 / transform.k;
  g.selectAll("path").style("stroke-width", 1 / transform.k);
  if (origin) {
    g.selectAll("#m" + origin.properties.SA22018_V1).style('stroke-width', 4 / transform.k).style('stroke', 'black').raise()
  }
  //g.selectAll("circle").style("r", 4 / transform.k);
}

function reset() {
    g.selectAll('.land').style('fill', '#edebe8').style('fill-opacity', 1).style('stroke', '#63758d').style('stroke-width', strokeWidth)
    g.selectAll('.water').style('fill', '#6ba3c9').style('fill-opacity', 1).style('stroke', '#63758d').style('stroke-width', strokeWidth)
    // d3.event.stopPropagation();
    document.getElementById('originArea').innerHTML = "Click on the map to select an area";
    document.getElementById('destinationArea').innerHTML = null;
    document.getElementById("min").innerHTML = null;
    document.getElementById("max").innerHTML = null;
    origin = null;
    destination = null;

    chartNone()
    hideInfoCharts();

    if (matchMedia('(pointer:coarse)').matches) {
      changePointer("origin")
    }
    // document.getElementById("destination-box").style.display = "none"
    // document.getElementById("origin-box").style.display = "none"
  svg.transition().duration(750).call(
    zoom.transform,
    d3.zoomIdentity.scale(0.75).translate(width / 5, height / 5)
    //d3.zoomTransform(svg.node())//.invert([width / 4, height / 4])
  );

  document.getElementById("reset-button").style.display = "none"
  document.getElementById("clear-button").style.display = "none"
}

function resetOrigin(){
    document.getElementById("clear-button").style.display = "none"
    document.getElementById("reset-button").style.display = "inline-block"


    g.selectAll('.land').style('fill', '#edebe8').style('fill-opacity', 1).style('stroke', '#63758d').style('stroke-width', strokeWidth)
    g.selectAll('.water').style('fill', '#6ba3c9').style('fill-opacity', 1).style('stroke', '#63758d').style('stroke-width', strokeWidth)
    // d3.event.stopPropagation();
    document.getElementById('originArea').innerHTML = "Click on the map to select an area";
    document.getElementById('destinationArea').innerHTML = null;
    document.getElementById("min").innerHTML = null;
    document.getElementById("max").innerHTML = null;
    origin = null;
    destination = null;

    chartNone()
    hideInfoCharts();

    if (matchMedia('(pointer:coarse)').matches) {
      changePointer("origin")
    }
}

function dragstarted(d) {
  d3.select(this).raise().attr("stroke", "black");
}

function dragged(d) {
  d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
}

function dragended(d) {
  d3.select(this).attr("stroke", null);
}

function showAbout() {
  document.getElementById("about").style.display = "inline-block"
}

function enter() {
  document.getElementById("about").style.display = "none"
}
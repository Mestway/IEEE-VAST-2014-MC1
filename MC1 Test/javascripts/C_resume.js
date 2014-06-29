// attributes for svg
var div_width = $("#resume_chart").width();

var focusHeight = 630;
var contextHeight = focusHeight + 70;

var margin = {top: 10, right: 10, bottom: 100, left: 40},
    margin2 = {top: focusHeight, right: 10, bottom: 20, left: 40},
    width = div_width - margin.left - margin.right,
    height = contextHeight - margin.top - margin.bottom,
    height2 = contextHeight - margin2.top - margin2.bottom;

var rectOpacity = 0.45;
var ifDrawYAxis = false;

var x = d3.time.scale().range([0, width]),
    x2 = d3.time.scale().range([0, width]),
    y = d3.scale.linear().range([height, 0]),
    y2 = d3.scale.linear().range([height2, 0]);

var ht = height * 0.5 / 35;

var xAxis = d3.svg.axis().scale(x).orient("bottom"),
    xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
    yAxis = d3.svg.axis().scale(y).orient("left");
    yAxis2 = d3.svg.axis().scale(y2).orient("left");

// brush for context
var brush = d3.svg.brush()
    .x(x2)
    .on("brush", brushed);

var svg = d3.select("#resume_chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

svg.append("defs").append("clipPath")
    .attr("id", "clip")
  	.append("rect")
    .attr("width", width)
    .attr("height", height);

var focus = svg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

// when we brush the "context" part, we will invoke this function to build "focus" graph
function brushed() {
    x.domain(brush.empty() ? x2.domain() : brush.extent());

    focus.selectAll(".employ_circle")
        .attr("cx", function(d) {
            return x(new Date(d.CurrentEmploymentStartDate * 1000));
        });
    focus.selectAll(".force_circle")
        .attr("cx", function(d) {
            return x(new Date(d.forceDischarge * 1000));
        });

    focus.selectAll(".experience")
        .attr("transform", function(d) { 
            var l = x(new Date(d.start * 1000));
            if (l < 0) l = 0;

            return  "translate(" + l + "," + (y(d.id + 1) - $(".focus > .experience").attr("height")/2) + ")";
        })
        .attr("width", function(d) {
            var l = x(new Date(d.start * 1000));
            var r = x(new Date(d.end * 1000));

            if (l < 0)
                l = 0;
            if (r < 0)
                r = 0;

            return r - l;
        })
        .attr("height", ht);
    focus.select(".x.axis").call(xAxis);
}

function update2min(a, b) {
	if (b < a && b != 0)
		return b;
	else return a;
}

function update2max(a, b) {
	if (b > a)
		return b;
	else return a;
}

//Only used for test
var asyncData = [];

// read the data from json file
d3.json("resumev3.json", function(error, rawData) {

    //generate id for each person
    var data = dataProcessor(rawData);

    for (var i = 0; i < 7; i ++) {
        asyncData.push(data[i]);
    }

	var minDate = 9999999999;
	var maxDate = 1390262400;

	for (var i = 0; i < data.length; i ++) {
		minDate = update2min(minDate, data[i].CurrentEmploymentStartDate);
		maxDate = update2max(maxDate, data[i].CurrentEmploymentStartDate);

		for (var j = 0; j < data[i].experience.length; j ++) {
			minDate = update2min(minDate, data[i].experience[j].start);
			minDate = update2min(minDate, data[i].experience[j].end);
			if (data[i].experience[j].start > maxDate)
                data[i].experience[j].start = maxDate;
			if (data[i].experience[j].end > maxDate)
                data[i].experience[j].end = maxDate;
		}
	}

    for (var i = 0; i < data.length; i ++) {
        for (var j = 0; j < data[i].experience.length; j ++) {
            if (data[i].experience[j].end > 1390262400) {
                console.log(data[i]);
            }
            if (data[i].experience[j].start == 0)
                data[i].experience[j].start = minDate;
        }
    }

	x.domain([new Date(minDate * 1000), new Date(maxDate * 1000)]);
	y.domain([0, data.length + 1]);
	x2.domain(x.domain());
	y2.domain(y.domain());

  	focus.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  	if (ifDrawYAxis) {
        focus.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    }

    focus.append("g")
        .datum(data)
        .attr("class", "focus.employ");

	context.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height2 + ")")
    .call(xAxis2);

  	context.append("g")
    .attr("class", "x brush")
    .call(brush)
    .selectAll("rect")
    .attr("y", -6)
    .attr("height", height2 + 7);

    generateTable(data);
    // draw three different parts
    drawGridLine(data, x, y);
    drawAllExperience(data, context, x2, y2, height2, false);
    drawAllExperience(data, focus, x, y, height, true);
    drawFocusCircle(data, x, y);
    drawContextCircle(data, x2, y2);
});

function dataProcessor(data) {

    for (var i = 0; i < data.length; i ++) {
        data[i].id = i;
        data[i].pos = data[i].id;
    
        var minNonZero = 9999999999;
        for (var j = 0; j < data[i].experience.length; j ++) {
            if (data[i].experience[j].start < minNonZero && data[i].experience[j].start != 0) {
                minNonZero = data[i].experience[j].start;
            }
        }

        for (var j = 0; j < data[i].experience.length; j ++) {
            data[i].experience[j].confidenceLevel = 2;
            data[i].experience[j].eid = j;
            if (data[i].experience[j].end == 0) {
                data[i].experience[j].end = minNonZero;
                data[i].experience[j].confidenceLevel = 1;
            }
        }
    }

    return data;
}

function employmentOnClick(d) {
    console.log(d);
}

function getForceRecord(data) {
    var force = [];
    for (var i = 0; i < data.length; i ++) {
        if (data[i].forceDischarge != 0) {
            force.push(data[i]);
        }
    }
    return force;
}

function drawGridLine(data, scaleX, scaleY) {

    var targetClass = focus.attr("class");
    $( "." + targetClass + " > " + ".gridLine").remove();

    focus.selectAll(".gridLine")
        .data(data)
        .enter()
        .append("line")
        .attr("class", "gridLine")
        .attr("x1", "0")
        .attr("y1", function(d) {return scaleY(d.pos + 1);})
        .attr("x2", width)
        .attr("y2", function(d) {
            return scaleY(d.pos + 1);
        })
        .style("stroke", "rgb(200, 200, 200)")
        .style("stroke-width", "1")
        .style("stroke-dasharray", "5,5");
}

function drawContextCircle(data, scaleX, scaleY) {

    var targetClass = context.attr("class");
    $( "." + targetClass + " > " + ".employ_circle").remove();

    context.selectAll(".employ_circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "employ_circle")
        .attr("r", "2")
        .attr("cx", function(d) {
            return scaleX(new Date(d.CurrentEmploymentStartDate * 1000));
        })
        .attr("cy", function(d) {
            return scaleY(d.pos + 1);
        }) 
        .attr("fill", "red")
        .on("click", employmentOnClick);

    var forceData = getForceRecord(data);

    targetClass = context.attr("class");
    $( "." + targetClass + " > " + ".force_circle").remove();

    context.selectAll(".force_circle")
        .data(forceData)
        .enter()
        .append("circle")
        .attr("r", "2")
        .attr("class", "force_circle")
        .attr("cx", function(d) {
            return scaleX(new Date(d.forceDischarge * 1000));
        })
        .attr("cy", function(d) {
            return scaleY(d.pos + 1);
        })
        .attr("fill", "blue");
}

function drawFocusCircle(data, scaleX, scaleY) {

    var targetClass = focus.attr("class");
    $( "." + targetClass + " > " + ".employ_circle").remove();

    focus.selectAll(".employ_circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "employ_circle")
        .attr("r", ht/2)
        .attr("cx", function(d) {
            return scaleX(new Date(d.CurrentEmploymentStartDate * 1000));
        })
        .attr("cy", function(d) {
            return scaleY(d.pos + 1);
        })
        .attr("fill", "red")
        .on("click", employmentOnClick);

    var forceData = getForceRecord(data);

    targetClass = focus.attr("class");
    $( "." + targetClass + " > " + ".force_circle").remove();

    focus.selectAll(".force_circle")
        .data(forceData)
        .enter()
        .append("circle")
        .attr("class", "force_circle")
        .attr("r", ht/2)
        .attr("cx", function(d) {
            return scaleX(new Date(d.forceDischarge * 1000));
        })
        .attr("cy", function(d) {
            return scaleY(d.pos + 1);
        })
        .attr("fill", "blue")
        .on("click", function(d) {
            console.log(d);
        });
}

function drawAllExperience(data, target, scaleX, scaleY, height, useStroke) {
    
    var targetClass = target.attr("class");
    $( "." + targetClass + " > " + ".experience").remove();

    var exps = [];
    for (var i = 0; i < data.length; i ++) {
        for (var j = 0; j < data[i].experience.length; j ++) {
            var tempExp = data[i].experience[j];
            tempExp.id = data[i].id;
            exps.push(tempExp);
        }
    }

    var ht = height * 0.5 / data.length;

    target.selectAll(".experience")
        .data(exps)
        .enter()
        .append("rect")
        .attr("uid", function(d) { return d.id; })
        .attr("eid", function(d) { return d.eid; })
        .attr("class", "experience")
        .attr("transform", function(d) {
            return  "translate(" + scaleX(new Date(d.start * 1000)) + "," + (scaleY(d.id + 1) - ht/2) + ")";
        })
        .attr("width", function(d) {
            var l = scaleX(new Date(d.start * 1000));
            var r = scaleX(new Date(d.end * 1000));
            return r - l;
        })
        .attr("height", ht)
        .style("stroke-width", function() {
            if (useStroke)
                return 1;
            else 
                return 0;
        })
        .style("stroke", "black")
        .style("fill-opacity", rectOpacity)
        .style("fill", function(d) {
            if (d.position == "student") {
                d.genre = "student";
                return "rgb(44, 160, 44)";
            }
            if (d.location.indexOf("Defense") > -1 || d.location.indexOf("Forces") > -1) {
                d.genre = "force";
                return "rgb(31, 119, 180)";
            }
            if (d.location.indexOf("GASTech") > -1) {
                d.genre = "GASTech";
                return "rgb(214, 39, 40)";
            }
            
            d.genre = "work";
            return "gray";
        })
        .on("click", selectRect);
}

function generateTable(data) {

    $("#text_board").empty();
    $("#text_board").append("<table id=\"text_table\" class=\"display\" cellspacing=\"0\" width=\"100%\"></table>");

    var table = $('#text_table').DataTable( {
        "data": data,
        "columns": [
            {
                "class":          'details-control',
                "orderable":      false,
                "data":           null,
                "defaultContent": ''
            },
            { "data": "name" },
            { "data": "Gender" },
            { "data": "CurrentEmploymentTitle" },
            { "data": "CurrentEmploymentType"},
            { "data": "EmailAddress" }
        ],
        "order": [[1, 'asc']]
    });

    $('#text_table tbody').on('click', 'td.details-control', function () {
        var tr = $(this).closest('tr');
        var row = table.row( tr );
 
        if ( row.child.isShown() ) {
            // This row is already open - close it
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            // Open this row
            row.child( format(row.data()) ).show();
            tr.addClass('shown');
        }
    } );
}

function selectRect(d) {
    // Add event listener for opening and closing details
    //var table = $("#text_table").DataTable();
    console.log(d);
    $("#text_board").empty();
    $("#text_board").append("<table id=\"text_table\" class=\"display\" cellspacing=\"0\" width=\"100%\"></table>");
}

function date2str(x,y) {
    var z ={y:x.getFullYear(),M:x.getMonth()+1,d:x.getDate(),h:x.getHours(),m:x.getMinutes(),s:x.getSeconds()};
    return y.replace(/(y+|M+|d+|h+|m+|s+)/g,function(v) {return ((v.length>1?"0":"")+eval('z.'+v.slice(-1))).slice(-(v.length>2?v.length:2))});
}

/* Formatting function for row details - modify as you need */
function format ( d ) {
    // `d` is the original data object for the row

    var result = '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">';
    for (var i = 0; i < d.experience.length; i ++) {
        var this_row = "";
        this_row += "<tr>";
        this_row += "<td>" + d.experience[i].position + "</td>";
        this_row += "<td>" + d.experience[i].location + "</td>";
        var sdate = new Date(d.experience[i].start * 1000);
        var stime = sdate.getYear() + "/" + sdate.getMonth() + "/" + sdate.getDate();
        var edate = new Date(d.experience[i].end * 1000);
        var etime = edate.getYear() + "/" + edate.getMonth() + "/" + edate.getDate();
        this_row += "<td>" + date2str(sdate,"yy/M/d") + " - " + date2str(edate,"yy/M/d") + "</td>";
        this_row += "<td>" + d.experience[i].description + "</td>";
        this_row += "</tr>";
        result += this_row;
    }
    result += "</table>";
    return result;
}

/* For test purpose */
d3.select("#hello")
    .on("click", function() {
        console.log("Hello World!");
        reDrawDiagram(asyncData);
        
    });

function reDrawDiagram(data) {

    // reset the scale domain
    var yp = y;
    var yp2 = y2;
    yp.domain([0, asyncData.length + 1]);
    yp2.domain(yp.domain());

    data.sort(function(a, b) {
        return a.id - b.id;
    });

    for (var i = 0; i < data.length; i ++) {
        data[i].pos = i;
    }

    generateTable(data);
    drawGridLine(data, x, yp);
    drawAllExperience(data, context, x2, yp2, height2, false);
    drawAllExperience(data, focus, x, yp, height, true);
    drawContextCircle(data, x2, yp2);
    drawFocusCircle(data, x, yp);
}
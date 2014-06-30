// attributes for svg
var div_width = $("#resume_chart").width();

var focusHeight = 630;
var contextHeight = focusHeight + 70;

var margin = {top: 10, right: 120, bottom: 100, left: 20},
    margin2 = {top: focusHeight, right: 120, bottom: 20, left: 20},
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

// Global Data
//data
var asyncData = [];
var dataStack = new Array();
var dataStackBackward = new Array();


// when we brush the "context" part, we will invoke this function to build "focus" graph
function brushed() {
    x.domain(brush.empty() ? x2.domain() : brush.extent());

    focus.selectAll(".employ_circle")
        .attr("cx", function(d) {
            var cx = x(new Date(d.CurrentEmploymentStartDate * 1000));

             if (cx > 0 && cx < width) {
                return cx;
            }
            else return -100;
        });

    focus.selectAll(".force_circle")
        .attr("cx", function(d) {
            var cx = x(new Date(d.forceDischarge * 1000));

            if (cx > 0 && cx < width) {
                return cx;
            }
            else return -100;
        });

    focus.selectAll(".experience")
        .attr("transform", function(d) { 
            var l = x(new Date(d.start * 1000));
            if (l < 0) l = 0;
            //if (r > width) r = width;

            return  "translate(" + l + "," + (y(d.pos + 1) - $(".focus > .experience").attr("height")/2) + ")";
        })
        .attr("width", function(d) {
            var l = x(new Date(d.start * 1000));
            var r = x(new Date(d.end * 1000));

            if (l < 0)
                l = 0;
            if (r < 0)
                r = 0;
            
            if (r > width) r = width;

            if (r - l < 0)
                return 0;

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

// read the data from json file
d3.json("resumev3.json", function(error, rawData) {

    //generate id for each person
    var data = dataProcessor(rawData);



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

    asyncData = data;
    for (var i = 0; i < data.length; i ++) {
        data.pos = i;
    }

    generateTable(data);
    // draw three different parts
    drawGridLine(data, x, y);
    drawAllExperience(data, context, x2, y2, height2, false);
    drawAllExperience(data, focus, x, y, height, true);
    drawFocusCircle(data, x, y);
    drawContextCircle(data, x2, y2);
    drawCheckBox(data, x, y);
    drawName(data, x, y);
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
        .attr("r", "1")
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
        .attr("r", "1")
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
        .attr("r", ht/3)
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
        .attr("r", ht/3)
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
        for (var j = data[i].experience.length - 1; j >= 0; j --) {
            var tempExp = data[i].experience[j];
            tempExp.id = data[i].id;
            tempExp.pos = data[i].pos;
            exps.push(tempExp);
        }
    }

    var localHt = height * 0.5 / data.length;
    if (targetClass == "focus")
        localHt = ht;

    target.selectAll(".experience")
        .data(exps)
        .enter()
        .append("rect")
        .attr("uid", function(d) { return d.id; })
        .attr("eid", function(d) { return d.eid; })
        .attr("class", "experience")
        .attr("transform", function(d) {
            return  "translate(" + scaleX(new Date(d.start * 1000)) + "," + (scaleY(d.pos + 1) - ht/2) + ")";
        })
        .attr("width", function(d) {
            var l = scaleX(new Date(d.start * 1000));
            var r = scaleX(new Date(d.end * 1000));
            return r - l;
        })
        .attr("height", localHt)
        .attr("slcted", 0)
        .style("stroke-width", function() {
            if (useStroke)
                return 0.5;
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
        .on("click", experienceClick);
}

function drawCheckBox(data, scaleX, scaleY) {

    $(".focus > .checkbox").remove();

    focus.selectAll(".checkbox")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "checkbox")
        .attr("x", -20)
        .attr("y", function (d) {
            return (scaleY(d.pos + 1) - ht/2);
        })
        .attr("width", ht)
        .attr("height", ht)
        .attr("id", function(d) {
            return "checkbox" + d.id;
        })
        .attr("ckted", 0)
        .attr("stroke", "black")
        .attr("fill", "transparent")
        .on("click", checkboxClick);
}

function drawName(data, scaleX, scaleY) {
    $(".focus > .name").remove();
    focus.selectAll(".name")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "name")
        .attr("uid", function(d) {
            return d.id;
        })
        .attr("x", width + 5)
        .attr("y", function(d) {
            return scaleY(d.pos + 1) + ht/2;
        })
        .style("font-size", ht)
        .style("font-family", "Verdana")
        .text(function(d) {
            return d.name;
        })
        .on("mouseover", function(d) {
            $(".focus > .name[uid=" + d.id + "]")
            .css("fill", "blue")
            .css("cursor","pointer");
        })
        .on("mouseout", function(d) {
            //console.log($(".focus > #checkbox" + d.id).attr("ckted"));
            if ($(".focus > #checkbox" + d.id).attr("ckted") == 0) {
                $(".focus > .name[uid=" + d.id + "]").css("fill", "black");
            }
        })
        .on("click", nameClick);
}

function generateTable(data) {

    $("#text_board").empty();
    $("#text_board").append("<table id=\"text_table\" class=\"display\" cellspacing=\"0\" width=\"100%\"></table>");
    //$("#text_board").append("<thead><tr><th></th><th>ID</th><th>Name</th><th>Gender</th><th>Title</th><th>Type</th><th>E-mail</th></tr></thead>");

    var table = $('#text_table').DataTable( {
        "data": data,
        "scrollY":        550,
        "scrollX": false,
        //"scrollCollapse": true,
        "paging":         false,
        "columns": [
            {
                "class":          'details-control',
                "orderable":      false,
                "data":           null,
                "defaultContent": '',
            },
            { "data": "id", "title" : "ID"},
            { "data": "name", "title" : "Name", "class" : "" },
            { "data": "Gender", "title": "Gender" },
            { "data": "CurrentEmploymentTitle", "title" : "Title" },
            { "data": "CurrentEmploymentType", "title": "Employ-Type"},
            { "data": "EmailAddress", "title": "E-mail" }
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
            //console.log(row.data());
            tr.addClass('shown');
        }
    } );

    $('#text_table')
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
    drawCheckBox(data, x, yp);
    drawName(data, x, yp);
}

/* For test purpose */
d3.select("#hello")
    .on("click", function() {
        $("#resume_chart").css("width", "60%");
        $("#resume_board").css("width", "33%")
            .css("float", "right");
        location.reload();
    });


// some "library functions"
function getAsyncData(id) {
    for (var i = 0; i < asyncData.length; i ++) {
        if (asyncData[i].id == id)
            return asyncData[i];
    }
    return null;
}

// Actions
// listener for submission button
$("#resume_filter > #submit_button")
    .attr("class", "button")
    .click(function () {
        dataStack.push(asyncData);
        asyncData = [];

        d3.select(".focus")
            .selectAll(".checkbox")
            .each(function(d){
                if ($("#checkbox" + d.id).attr("ckted") == 1) {
                    asyncData.push(d);
                }
            });

        for (var i = 0; i < asyncData.length; i ++) {
            asyncData[i].pos = i;
        }
        reDrawDiagram(asyncData);
        dataStackBackward = [];
    });

// listener for undo button
$("#resume_filter > #undo_button")
    .attr("class", "button")
    .click(function() {
        if (dataStack.length == 0)
            return;
        dataStackBackward.push(asyncData);
        asyncData = dataStack.pop();
        reDrawDiagram(asyncData);
    });

// listener for redo button
$("#resume_filter > #redo_button")
    .attr("class", "button")
    .click(function() {
        if (dataStackBackward.length == 0)
            return;
        dataStack.push(asyncData);
        asyncData = dataStackBackward.pop();
        reDrawDiagram(asyncData);
    });

// listener for click on checkbox 
function checkboxClick(d) {
    $("#checkbox" + d.id).attr("ckted",1-$("#checkbox"+d.id).attr("ckted"));

    if ($("#checkbox" + d.id).attr("ckted") == 1) {
        $("#checkbox" + d.id).attr("fill", "black");
        $(".focus > .name[uid=" + d.id + "]")
            .css("fill", "blue")
            .css("font-weight", "bold");
    } else {
        $("#checkbox" + d.id).attr("fill", "transparent");
        $(".focus > .name[uid=" + d.id + "]")
            .css("fill", "black")
            .css("font-weight", "normal");
    }
}

function nameClick(d) {
    checkboxClick(d);
}

// listener for click on experience rect
function experienceClick(d) {
    // Add event listener for opening and closing details
    //var table = $("#text_table").DataTable();
    var BSelected = 1 - $(".experience[uid=" + d.id + "][eid=" + d.eid + "]").attr("slcted");
    $(".experience[uid=" + d.id + "][eid=" + d.eid + "]").attr("slcted", BSelected);

    if (BSelected) {
        highlightExperience(d.id, d.eid);
        if ($(".focus > #checkbox" + d.id).attr("ckted") == 0)
            checkboxClick(getAsyncData(d.id));
    }  {
        removeHighlight(d.id, d.eid);
    }
}

function highlightExperience(uid, eid) {
    $(".focus > .experience[uid=" + uid + "][eid=" + eid + "]").css("stroke-width", "2pt");
}

function removeHighlight(uid, eid) {
    $(".focus > .experience[uid=" + uid + "][eid=" + eid + "]").css("stroke-width", "0.5pt");
}
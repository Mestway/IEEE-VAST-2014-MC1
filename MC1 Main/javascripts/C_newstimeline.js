/** modules for news-timeline **/
(function(){
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var num_pad = function(s) {
        var j = s.toString();
        while(j.length < 2) j = '0' + j;
        return j;
    };
    // add th,nd,rd to small integers. example: 23 to 23rd.
    var addth = function(day) {
        if(day % 100 == 11 || day % 100 == 12 || day % 100 == 13) return day + "th";
        if(day % 10 == 1) return day + "st";
        if(day % 10 == 2) return day + "nd";
        if(day % 10 == 3) return day + "rd";
        return day + "th";  
    };
    Date.prototype.getFullString = function() {
        return months[this.getMonth()] + " " + addth(this.getDate()) + ", " + this.getFullYear() + " " + num_pad(this.getHours()) + ":" + num_pad(this.getMinutes());
    };
    Date.prototype.getDayString = function() {
        return months[this.getMonth()] + " " + addth(this.getDate()) + ", " + this.getFullYear();
    };
    Date.prototype.getTimeString = function() {
        return num_pad(this.getHours()) + ":" + num_pad(this.getMinutes());
    };
    Date.prototype.getFullTimeString = function() {
        return num_pad(this.getHours()) + ":" + num_pad(this.getMinutes()) + ":" + num_pad(this.getSeconds());
    };    
    Date.prototype.getNaiveString = function() {
        return this.getFullYear() + "/" + (this.getMonth()+1) + "/" + this.getDate();
    };
    Date.prototype.getMonthString = function() {
        return months[this.getMonth()] + ", " + this.getFullYear();
    };
    Date.prototype.getLumpyString = function() {
        return this.getFullYear()+"-"+num_pad(this.getMonth()+1)+"-"+num_pad(this.getDate())+" "+num_pad(this.getHours())+":"+num_pad(this.getMinutes())+":"+num_pad(this.getSeconds());
    };//monthstring modified by csm
})();

var globalTimelineCount = {height:0,count:0};
var globalKeywordIndexs = {"people":{},"phrases":{},"keyword":{}} 
var canvasList = []
globalData = new DataManager();
var globalHeight = 0;
var globalDataSet = [];

var initOrNot = 0;

// Global data from other files:
//      -- width: from C_resume.js
//      -- 
d3.json("newsReport.json",function(data){
    globalData.loadData_News(data);
    var pos1 = {x:0,y:0,width:width,height:500,svgName:"symbol_view"};
    colorLabel = new ColorLabel("symbol_view",pos1,globalData.topicLabelsTopTen)
    colorLabel.draw();

    var maxHeight = 300;
    var unitHeight = 6;
    var height = unitHeight*globalData.data.maxCount;
    globalHeight = height;
    height = maxHeight < height ? maxHeight : height;
    var pos = {x:0,y:0,width:width,height:height,svgName:"news_timeline"};
    canvasManager2 = new CanvasManager("onContext", {x:0, y:0, width: width, height: 70, svgName: "onContext"});
    canvasManager = new CanvasManager("news_timeline",pos,"",0);
    globalTimelineCount.count++;
    globalTimelineCount.height+=pos.height;
    canvasManager2.updateData({data:globalData.data}, timeMatch, false, false);
    canvasManager.updateData({data:globalData.data},timeMatch, false, true);
    canvasList.push(canvasManager)
})

var timelineNo = 1;

function addTimeline(data, yCount, existingHeight, title, svgName){
    initOrNot ++;
    $("#barChart" + timelineNo).remove();
    //var maxHeight = $("#leftView").height()-100;
    var maxHeight = 300;
    var unitHeight = 6;
    var height = unitHeight * yCount;
    height = (maxHeight < height) ? maxHeight : height;
    var pos = {x:0, y:existingHeight * timelineNo, width:width,height:height, svgName:svgName};

    var myCanvas = new CanvasManager(svgName, pos, title, timelineNo);
    //globalTimelineCount.count ++;
    if (timelineNo == 1)
        timelineNo = 2;
    else
        timelineNo = 1;

    if(height < 10){
        height = 10;
    }

    globalTimelineCount.height += (height + 2);
    myCanvas.updateData({data:data}, timeMatch, true, true);
    canvasList.push(myCanvas);
}

function sumitFilter(d) {
    var filteredData = globalData.filterByKeyword(globalData.data,d);

    globalDataSet[timelineNo-1] = filteredData;
    addTimeline(filteredData, filteredData.maxCount, globalHeight, d, "news_timeline");
}

$("#news_filter > #submit_keyword")
    .click(function () {
        sumitFilter($("#keyword_input").val());
    });

$("#news_filter > #intersect")
    .click(function () {
        intersect();
    });

$("#news_filter > #union")
    .click(function () {
        union();
    });

$("#news_filter > #difference")
    .click(function () {
        difference();
    });


function intersect() {
    var filteredData = [];
    if (initOrNot < 2)
        return;
    //console.log(globalDataSet);

    var filteredData = globalData.intersectData(globalDataSet[0], globalDataSet[1]);
    globalDataSet[timelineNo-1] = filteredData;
    addTimeline(filteredData, filteredData.maxCount, globalHeight, "Intersect Result", "news_timeline");
}

function union() {
    var filteredData = [];
    if (initOrNot < 2)
        return;
    //console.log(globalDataSet);

    var filteredData = globalData.unionData(globalDataSet[0], globalDataSet[1]);
    globalDataSet[timelineNo-1] = filteredData;
    addTimeline(filteredData, filteredData.maxCount, globalHeight, "Union Result", "news_timeline");
}

function difference() {
    var filteredData = [];
    if (initOrNot < 2)
        return;
    //console.log(globalDataSet);

    var filteredData = globalData.differenceData(globalDataSet[0], globalDataSet[1]);
    globalDataSet[timelineNo-1] = filteredData;
    addTimeline(filteredData, filteredData.maxCount, globalHeight, "Difference Result", "news_timeline");
}
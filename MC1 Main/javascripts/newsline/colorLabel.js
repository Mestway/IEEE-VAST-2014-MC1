var ColorLabel = function(gSVGName,pos,data){
	this.svgName = gSVGName;
	//this.data = data;
	this.width = pos.width;
	this.height = pos.height;
	this.x = pos.x;
	this.y = pos.y;
	this.gColorLabel = d3.select("#"+this.svgName).append("g")
		.attr("class","colorLabel")
		.attr("transform","translate("+this.x+","+this.y+")");
	this.unitWidth = 200;
	this.unitHeight = 20;
	this.init(data);
}
//var fillColor = d3.scale.category10();
var fillColor1 = d3.scale.category10();

function fillColor(key){
	for(var i in globalTweetInfo){
		if(globalTweetInfo[i].key==key){
			return fillColor1(key);
		}
	}
	return "steel-blue";
}
var myColor = {}
//data: index,text,color,
ColorLabel.prototype = {
	init:function(tweetInfo){
		 
		globalTweetInfo = tweetInfo;
		var drawLabels = {};
		for(var i in tweetInfo){
			drawLabels[tweetInfo[i].key] = fillColor(tweetInfo[i].key);
		}
		//drawLabels["script"] = 
		// for(var j=0;j<poiInfo.features.length;j++){
		// 	var category = poiInfo.features[j].properties.Type;
		// 	if(!drawLabels[category]){
		// 		drawLabels[category] = fillColor(category);
		// 	}
		// }
		// drawLabels["Uncertain"] = fillColor("Uncertain")
		// drawLabels["Non POI"] = fillColor("Non POI")

		var drawLabelArray = []
		var count = 0;
		for(var cat in drawLabels){
			drawLabelArray.push({index:count,text:cat,color:drawLabels[cat]})
			count++;
		}
		this.data = drawLabelArray

		// this.data = [];
		// this.data.push({index:0,text:"all",color:"#ffff00"});
		// this.data.push({index:1,text:"top 20 src",color:"#"+srcColorString});
		// this.data.push({index:2,text:"top 20 dest",color:"#"+destColorString});
		// this.data.push({index:3,text:"top 20 bi-dir",color:"#3cfff7"});
	},
	draw:function(){
		var data = this.data;
		var myColorLabel = this;
		var gColorLabel = this.gColorLabel;
		var width = this.width;
		var height = this.height;
		var unitWidth = this.unitWidth;
		var unitHeight = this.unitHeight;
		var xMax = parseInt(width/unitWidth);

		var sel = gColorLabel.selectAll("g.colorBlock")
			.data(data,function(d){
				return d.text;
			});
		var enter = sel.enter()
			.append("g")
			.attr("class","colorBlock")
			.attr("transform",function(d){
				var index = d.index%xMax;
				var x = width - index*unitWidth - unitWidth;	
				index = parseInt(d.index/xMax);
				var y = index*unitHeight;
				return "translate("+x+","+y+")";
		});

		enter.append("rect");
		enter.append("text");
		sel.attr("transform",function(d){
				var index = d.index%xMax;
				var x = width - index*unitWidth - unitWidth;	
				index = parseInt(d.index/xMax);
				var y = index*unitHeight;
				return "translate("+x+","+y+")";
		})

		sel.selectAll("rect")
			.data(data,function(d){
				return d.text;
			})
/*
			.attr("x",function(d){
				var index = d.index%xMax;
				var x = index*(xMax-unitWidth);
				return x;
			})
			.attr("y",function(d){
				var index = data.length/xMax;
				var y = index*unitHeight;
				return y;
			})*/
			.attr("width",20)
			.attr("height",20)
			.style("fill",function(d){
				return d.color;
			})

		sel.selectAll("text")
			.data(data,function(d){
				return d.text;
			})
			.attr("x",22)
			.attr("y",15)			
			.text(function(d){
				return d.text;
			})
		sel.exit().remove()
	},
	setSize:function(width,height){
		this.width = width;
		this.height =height;
	}
}
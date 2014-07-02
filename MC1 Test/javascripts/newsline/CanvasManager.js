var CanvasManager = function(gSVGName,pos,titleText,id,fillColor,parent){//x,y,idlist = key,value,idList
	this.svgName = gSVGName;
	this.width = pos.width;
	this.height = pos.height;
	this.x = pos.x;
	this.y = pos.y;
	this.fillColor = fillColor;
	this.titleText = titleText;

	this.gBarChart = d3.select("#"+this.svgName).append("g")
		.attr("class","attrFilter")
		.attr("id","barChart"+id)
		.attr("transform","translate("+this.x+","+this.y+")");
	this.id = id;
	this.parent = parent;

	var period = 1000*365*60*60*24;
	this.period = period;

	this.init();
	//this.preprocessData();
}

CanvasManager.prototype = {
	init:function(){
		this.gBarChart.select(".xAxis").remove();
		this.gBarChart.select(".yAxis").remove();
		this.gBarChart.select("text").remove();

		var width = this.width;
		var height = this.height;

		//var xScale = d3.scale.ordinal().rangeBands([0,width],0.1);
		var xScale = d3.scale.linear().range([0,width]);
		var timeScale = d3.time.scale().range([0,width]);

		var yScale = d3.scale.linear()
			.range([0,height]);
		var xAxis = d3.svg.axis()
//			.scale(xScale)
			.scale(timeScale)
			.orient("top")
			//.tickValues([]);

		var yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left")
			.tickPadding(-3)
			.ticks(5);


		this.timeScale = timeScale

		this.xScale = xScale;
		this.yScale = yScale;
		this.xAxis = xAxis;
		this.yAxis = yAxis; 

		this.gBarChart.append("g")
			.attr("class","xAxis")
//			.attr("transform","translate(0,"+this.height+")");

		this.gBarChart.append("g")
			.attr("class","yAxis");

		var textYPos = 10;
		var xMovement = -(this.width/0.9)*0.05;
		var yMovement = 5;

		this.gBarChart.append("text")
			.attr("transform","translate("+-1*this.x+"," + textYPos+")")
			.text(this.titleText);
		// this.gBarChart.append("text")
		// 	.attr("transform","translate("+xMovement+","+yMovement+") rotate(-90)")
		// //	.attr("transform","translate(-5,-5)")
		// 	.text("Tweet")
		// 	.style("text-anchor","end")
		// this.gBarChart.append("text")
		// 	.attr("transform","translate("+this.width*7/10.0+","+(-30)+")")
		// 	.text("Time");
	},
	updateData:function(data,timeMatch,hideTick){
		this.data = data.data;
//		this.links = data.links;
		this.preprocessData(this.data,timeMatch);
		this.update(hideTick);
	},
	preprocessData:function(data,timeMatch){
//		var data = this.data;
		var xScale = this.timeScale;
		var yScale = this.yScale;
		var period = this.period
		xScale.domain(d3.extent(data.map(function(d){
			return d.dateTime;
		})))
		if(timeMatch){
			var width = this.width;
			var tempArray = d3.entries(timeMatch)
			var unitWidth=1;
			if(tempArray.length){
				unitWidth = 1.0*width/tempArray.length;
			}
			xScale.domain(tempArray.map(function(d){
				return d.value;
			})).range(tempArray.map(function(d){
				return unitWidth*d.key;
			}))
			this.unitWidth = unitWidth;
		}		
		// yScale.domain(d3.extent(data.map(function(d){
		// 	return d.count;
		// })))
		yScale.domain([0,d3.max(data.map(function(d){
			return d.count+1;
		}))])
		var yDistance = d3.max(data.map(function(d){
			return d.count;
		}))
		// var xMinDistance = Number.MAX_VALUE;
		// for(var i=1;i<data.length;i++){
		// 	var dis = data[i].dateTime.getTime() - data[i-1].dateTime.getTime();
		// 	if(dis!=0 && dis<xMinDistance){
		// 		xMinDistance = dis;
		// 	}
		// }

		var xUnit = xScale(new Date(xScale.domain()[0].getTime()+60*60*1000)) - xScale.range()[0];
		if(this.unitWidth){
			xUnit = this.unitWidth;
		}	
		var yUnit = this.height/(yDistance+1);
//		var yUnit = d3.min([this.height/(yDistance+1),xUnit]);
	
		for(var i=0;i<data.length;i++){
			data[i].x = xScale(data[i].binDateTime);
			//data[i].y = yScale(data[i].count);
			data[i].y = yScale(data[i].topicCount);
			data[i].width = xUnit;
			data[i].height = yUnit;
		}

	},
	drawBackground:function(){
		var xScale = this.timeScale;
		var yScale = this.yScale;
		var startY = this.yScale.range()[0];
		var height = yScale.range()[yScale.range().length-1] - startY;
		var _this = this;
		var gBarChart = this.gBarChart;
		var period = this.period;

		var distance = xScale.domain()[xScale.domain().length-1].getTime() - xScale.domain()[0];
		var bandNum = distance/period;
		var width = xScale(new Date(xScale.domain()[0].getTime()+period)) - xScale.range()[0]

		var data = [];
		var startDate = xScale.domain()[0].getTime();
		for(var i=0;i<bandNum;i++){
			data[i]= new Date(xScale.domain()[0].getTime()+period*i);
		}


		var sel = gBarChart.selectAll("rect.backgroundBand")
			.data(data,function(d){
				return d;
			})
		var enter = sel.enter()
			.append("rect")
			.attr("class","backgroundBand");
		sel.attr("x",function(d){
				return xScale(d)
			})
			.attr("y",startY)
			.attr("height",height)
			.attr("width",width)
			.style("fill",function(d,i){
				if(!(i%2)){
					return "rgba(200,200,200,0.4)";
				}else{
					return "rgba(255,255,255,1)";
				}
			})

		sel.exit().remove();

	},
	update:function(hideTick){


		var drawData = this.data;
		var drawLinks = this.links;

		var _this = this;
		var r = 8;
		var height = this.height;

		var gBarChart = this.gBarChart;
		gBarChart.select(".xAxis").call(this.xAxis);
		gBarChart.select(".yAxis").call(this.yAxis);

		if(hideTick){
			gBarChart.select(".xAxis").selectAll("text").remove();
			gBarChart.select(".yAxis").selectAll("text").remove();

		}


		var sel = gBarChart.selectAll("g.node")
			.data(drawData,function(d){
				return d.id;
			})
		var enter = sel.enter()
			.append("g")
			.attr("class","node")
		enter.append("rect")
		enter.append("title");

		var myRect = sel.selectAll("rect")
			.data(drawData,function(d){
				return d.id;
			})
			.attr("transform",function(d){
				return "translate(" + d.x + "," + d.y + ")";
			})
			.attr("width",function(d){
				return d.width;
			})
			.attr("height",function(d){
				return d.height;
			})
			.style("fill",function(d){
				return fillColor(d.topic)
				//return "steel-blue";
			})
			.style("fill-opacity",0.8)
			// .style("stroke",function(d){
			// 		return "white";
			// })
			.on("click",function(d){
				$("#news").html(d.dateTime.getFullString()+"<br><p>"+d.body+"</p>");
				d3.selectAll("g.node").selectAll("rect")
					.classed("highlighted",function(dd){
						return d.id==dd.id
					});
			})
			.on("mouseover",function(d){
				var idList = {}
				for(var i in globalKeywordIndexs){
					if(!d[i]){
						continue;
					}
					for(var k=0;k<d[i].length;k++){
						var currentIdList = globalKeywordIndexs[i][d[i][k]];
						for(var j=0;j<currentIdList.length;j++){
							if(!idList[currentIdList[j]]){
								idList[currentIdList[j]]=0;
							}
							idList[currentIdList[j]]++;
						}
					}
				}
				d3.selectAll("g.node").selectAll("rect")
					.classed("hovered",false)
				gBarChart.selectAll("g.node").selectAll("rect")
					.classed("hovered",function(dd){
						if(idList[dd.id]){
							return true;
						}
					})
			})
			;


		sel.exit().remove();

		var myTitle = sel.selectAll("title")
			.data(drawData,function(d){
				return d.id;
			})
			.text(function(d){
				return d.dateTime.getFullString() + "\n"
					+ d.body				
			})


	}
}
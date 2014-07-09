var DataManager = function(){
	this.data = []
	this.filteredData = []
}
myTime = new Date();
timeZoneOffset = myTime.getTimezoneOffset();
timeMatch = {}

function isInDateBin(binSize,d1,d2){
	var da = parseInt(d1.getTime()/binSize);
	var db = parseInt(d2.getTime()/binSize);
	//var binDate = new Date(da*binSize+timeZoneOffset);
	if(da==db){
		return true
//				return binDate;
	}
	return false;
}
DataManager.prototype = {
	loadData_News:function(rawData){
		topicLabels = {}
		//var reg = /d{4}/
		var myTime = new Date();
		var timeZoneOffset = myTime.getTimezoneOffset();
		var timeNum = 0;
		for(var i=0;i<rawData.length;i++){
			rawData[i].id = i;
			rawData[i].keyword = []
			var date = new Date(parseInt(rawData[i].timestamp)*1000 + timeZoneOffset*60000);
			var timeArray = rawData[i].body.match(/\d{4}/g);
			var timeArray1 = rawData[i].body.match(/\d+:\d+ [A-Z]M/);
			var timeArray2 = rawData[i].body.match(/\d+:\d+/);
			if(timeArray){
				for(var t=0;t<timeArray.length;t++){
					var hour = timeArray[t].substr(0,2);
					var minute = timeArray[t].substr(2,2);
					if(hour>=0&&hour<=24 && minute>=0 && minute<=60){
						date.setHours(hour);
						date.setMinutes(minute);
						timeNum++;
						break;
					}
				}
			}else if(timeArray1){
				for(var t=0;t<timeArray1.length;t++){
					var hour = timeArray1[t].substr(0,timeArray1[t].indexOf(":"));
					var minute = timeArray1[t].substr(timeArray1[t].indexOf(":")+1,2);
					var isAMorPM = timeArray1[t].substr(timeArray1[t].indexOf("M")-1,2);
					if(hour>=0&&hour<=24 && minute>=0 && minute<=60){
						hour = isAMorPM=="AM"?hour:(hour+12);
						date.setHours(hour);
						date.setMinutes(minute);
						timeNum++;
						break;
					}
				}
			}else if(timeArray2){
				for(var t=0;t<timeArray2.length;t++){
					var hour = timeArray2[t].substr(0,timeArray2[t].indexOf(":"));
					var minute = timeArray2[t].substr(timeArray2[t].indexOf(":")+1,2);
					if(hour>=0&&hour<=24 && minute>=0 && minute<=60){
						date.setHours(hour);
						date.setMinutes(minute);
						timeNum++;
						break;
					}
				}				
			}		
			rawData[i].dateTime = date;
			rawData[i].topic = rawData[i].source;
			if(rawData[i].topic){
				if(!topicLabels[rawData[i].topic]){
					topicLabels[rawData[i].topic] = 0;
				}
				topicLabels[rawData[i].topic]++
			}
			for(var j=0;j<rawData[i].people.length;j++){
				var people = rawData[i].people[j];
				if(!globalKeywordIndexs["people"][people]){
					globalKeywordIndexs["people"][people] = []
				}
				globalKeywordIndexs["people"][people].push(rawData[i].id)
			}			
			for(var j=0;j<rawData[i].phrases.length;j++){
				var phrases = rawData[i].phrases[j];
				if(!globalKeywordIndexs["phrases"][phrases]){
					globalKeywordIndexs["phrases"][phrases] = []
				}
				globalKeywordIndexs["phrases"][phrases].push(rawData[i].id)
			}			

		}
		//console.log("timenum",timeNum)
		rawData.sort(function(a,b){
			return a.dateTime.getTime()-b.dateTime.getTime()
		})
		this.processBins(rawData,60*60*1000)
		this.binSize = 60*60*1000;

	},
	loadData_Tweet:function(rawData){

		topicLabels = {}
		for(var i=0;i<rawData.length;i++){
			rawData[i].id = i;
			var timeStr = rawData[i].date;
			timeStr = timeStr.toString();
			var year = parseInt(timeStr.substr(0,4));
			var month = parseInt(timeStr.substr(4,2));
			var day = parseInt(timeStr.substr(6,2));
			var hour = parseInt(timeStr.substr(8,2));
			var minute = parseInt(timeStr.substr(10,2));
			var second = parseInt(timeStr.substr(12,2));
			var message = rawData[i].message;
			rawData[i].topic = message.match(/#\w*/);
			if(rawData[i].topic){
				rawData[i].topic = rawData[i].topic[0];
				if(!topicLabels[rawData[i].topic]){
					topicLabels[rawData[i].topic] = 0;
				}
				topicLabels[rawData[i].topic]++
			}
			rawData[i].dateTime = new Date(year,month-1,day,hour,minute,second);
		}
		rawData.sort(function(a,b){
			return a.dateTime.getTime()-b.dateTime.getTime()
		})
		this.processBins(rawData,60)

		//this.topicLabels = topicLabels
	},
	processBins:function(rawData,binSize){
		var maxCount = 0;
		var lastDate = new Date(0);		
		var dateIndex = {}


		var aggXCount = 0;
		
		for(var i=0;i<rawData.length;i++){
			rawData[i].binDateTime = new Date(parseInt(rawData[i].dateTime.getTime()/binSize)*binSize+timeZoneOffset);
			//if(lastDate.getMinutes()==rawData[i].dateTime.getMinutes() && (rawData[i].dateTime.getTime()-lastDate.getTime())<60*1000){
			if(isInDateBin(binSize,lastDate,rawData[i].dateTime)){
				rawData[i].count = rawData[i-1].count+1;
			}else{
				rawData[i].count = 0;
			}
			if(rawData[i].count>maxCount){
				maxCount = rawData[i].count;
			}
			// rawData[i].binDateTime = new Date(rawData[i].dateTime.getTime())
			// rawData[i].binDateTime.setSeconds(0)
			var timeStr = rawData[i].binDateTime.toString()
			if(!dateIndex[timeStr]){
				timeMatch[aggXCount] = rawData[i].binDateTime;
				dateIndex[timeStr] = []
				dateIndex[timeStr].aggXCount = aggXCount++;
			}
			rawData[i].aggXCount = dateIndex[timeStr].aggXCount;
			dateIndex[rawData[i].binDateTime.toString()].push(rawData[i]);
			lastDate = rawData[i].dateTime;			
		}
		//console.log("max count",maxCount)
		this.data = rawData;
		var threshold = 10;
		var entries = d3.map(topicLabels).entries();
		entries.sort(function(a,b){
			return -a.value + b.value;
		})
		this.topicLabelsTopTen = entries.slice(0,threshold)
		this.data.maxCount = maxCount
		for(date in dateIndex){
			dateIndex[date].sort(function(a,b){
				var countA,countB;
				countA = 0;
				countB = 0;
				if(a.topic){
					countA = topicLabels[a.topic]
				}
				if(b.topic){
					countB = topicLabels[b.topic]
				}
				// if(!a.author){
				// 	countA = -1;
				// }
				// if(!b.author){
				// 	countB = -1;
				// }
				return countB - countA;
			})
			for(var i=0;i<dateIndex[date].length;i++){
				dateIndex[date][i].topicCount = i;
			}
		}
	},
	filterByKeyword:function(data,keyword){
		var binSize = this.binSize;
		var filteredData = []
		for(var i=0;i<data.length;i++){
			var content = data[i].body;
			if(content.search(keyword)!=-1){
				filteredData.push({binDateTime:data[i].binDateTime,dateTime:data[i].dateTime,id:data[i].id,topic:data[i].topic,
							body:data[i].body,people:data[i].people,phrases:data[i].phrases,title:data[i].title,
							source:data[i].source,aggXCount:data[i].aggXCount,keyword:data[i].keyword});				
			}
		}
		var maxCount = 0;
		var lastDate = new Date(0);		
		var dateIndex = {}
		var aggXCount = 0;
		var rawData = filteredData
		
		for(var i=0;i<rawData.length;i++){
			// rawData[i].binDateTime = new Date(parseInt(rawData[i].dateTime.getTime()/binSize)*binSize+timeZoneOffset);
			// //if(lastDate.getMinutes()==rawData[i].dateTime.getMinutes() && (rawData[i].dateTime.getTime()-lastDate.getTime())<60*1000){
			if(isInDateBin(binSize,lastDate,rawData[i].dateTime)){
				rawData[i].count = rawData[i-1].count+1;
			}else{
				rawData[i].count = 0;
			}
			if(rawData[i].count>maxCount){
				maxCount = rawData[i].count;
			}
			// rawData[i].binDateTime = new Date(rawData[i].dateTime.getTime())
			// rawData[i].binDateTime.setSeconds(0)
			var timeStr = rawData[i].binDateTime.toString()
			if(!dateIndex[timeStr]){
//				timeMatch[aggXCount] = rawData[i].binDateTime;
				dateIndex[timeStr] = []
//				dateIndex[timeStr].aggXCount = aggXCount++;
			}
//			rawData[i].aggXCount = dateIndex[timeStr].aggXCount;
			dateIndex[rawData[i].binDateTime.toString()].push(rawData[i]);
			lastDate = rawData[i].dateTime;			
		}
		//console.log("max count",maxCount)
		this.filteredData.push(filteredData);

		for(date in dateIndex){
			dateIndex[date].sort(function(a,b){
				var countA,countB;
				countA = 0;
				countB = 0;
				if(a.topic){
					countA = topicLabels[a.topic]
				}
				if(b.topic){
					countB = topicLabels[b.topic]
				}
				// if(!a.author){
				// 	countA = -1;
				// }
				// if(!b.author){
				// 	countB = -1;
				// }
				return countB - countA;
			})
			for(var i=0;i<dateIndex[date].length;i++){
				dateIndex[date][i].topicCount = i;
			}
		}
		
		globalKeywordIndexs["keyword"][keyword] = []
		for(var i=0;i<filteredData.length;i++){
			filteredData[i].keyword.push(keyword);
			globalKeywordIndexs["keyword"][keyword].push(filteredData[i].id);
		}
		filteredData.maxCount = maxCount
		return filteredData;
	},
	intersectData: function(data, data2) {

		var binSize = this.binSize;
		var filteredData = []
		for(var i=0;i<data.length;i++){
			for (j = 0; j < data2.length; j ++) {
				//var content = data[i].body;
				if(data[i].id == data2[j].id){
					filteredData.push({binDateTime:data[i].binDateTime,dateTime:data[i].dateTime,id:data[i].id,topic:data[i].topic,
								body:data[i].body,people:data[i].people,phrases:data[i].phrases,title:data[i].title,
								source:data[i].source,aggXCount:data[i].aggXCount,keyword:data[i].keyword});				
				}
			}
		}
		var maxCount = 0;
		var lastDate = new Date(0);		
		var dateIndex = {}
		var aggXCount = 0;
		var rawData = filteredData
		
		for(var i=0;i<rawData.length;i++){
			// rawData[i].binDateTime = new Date(parseInt(rawData[i].dateTime.getTime()/binSize)*binSize+timeZoneOffset);
			// //if(lastDate.getMinutes()==rawData[i].dateTime.getMinutes() && (rawData[i].dateTime.getTime()-lastDate.getTime())<60*1000){
			if(isInDateBin(binSize,lastDate,rawData[i].dateTime)){
				rawData[i].count = rawData[i-1].count+1;
			}else{
				rawData[i].count = 0;
			}
			if(rawData[i].count>maxCount){
				maxCount = rawData[i].count;
			}
			// rawData[i].binDateTime = new Date(rawData[i].dateTime.getTime())
			// rawData[i].binDateTime.setSeconds(0)
			var timeStr = rawData[i].binDateTime.toString()
			if(!dateIndex[timeStr]){
//				timeMatch[aggXCount] = rawData[i].binDateTime;
				dateIndex[timeStr] = []
//				dateIndex[timeStr].aggXCount = aggXCount++;
			}
//			rawData[i].aggXCount = dateIndex[timeStr].aggXCount;
			dateIndex[rawData[i].binDateTime.toString()].push(rawData[i]);
			lastDate = rawData[i].dateTime;			
		}
		//console.log("max count",maxCount)
		this.filteredData.push(filteredData);

		for(date in dateIndex){
			dateIndex[date].sort(function(a,b){
				var countA,countB;
				countA = 0;
				countB = 0;
				if(a.topic){
					countA = topicLabels[a.topic]
				}
				if(b.topic){
					countB = topicLabels[b.topic]
				}
				// if(!a.author){
				// 	countA = -1;
				// }
				// if(!b.author){
				// 	countB = -1;
				// }
				return countB - countA;
			})
			for(var i=0;i<dateIndex[date].length;i++){
				dateIndex[date][i].topicCount = i;
			}
		}
		
		/*globalKeywordIndexs["keyword"][keyword] = []
		for(var i=0;i<filteredData.length;i++){
			filteredData[i].keyword.push(keyword);
			globalKeywordIndexs["keyword"][keyword].push(filteredData[i].id);
		}*/
		filteredData.maxCount = maxCount
		return filteredData;
	},
	unionData: function(data, data2) {

		var binSize = this.binSize;
		var filteredData = []
		for (var i = 0; i < data2.length; i ++) {
			filteredData.push({binDateTime:data2[i].binDateTime,dateTime:data2[i].dateTime,id:data2[i].id,topic:data2[i].topic,
								body:data2[i].body,people:data2[i].people,phrases:data2[i].phrases,title:data2[i].title,
								source:data2[i].source,aggXCount:data2[i].aggXCount,keyword:data2[i].keyword});				
		}

		for(var i=0;i<data.length;i++){
			for (j = 0; j < data2.length; j ++) {
				//var content = data[i].body;
				if(data[i].id == data2[j].id)
					continue;
				else {
					filteredData.push({binDateTime:data[i].binDateTime,dateTime:data[i].dateTime,id:data[i].id,topic:data[i].topic,
								body:data[i].body,people:data[i].people,phrases:data[i].phrases,title:data[i].title,
								source:data[i].source,aggXCount:data[i].aggXCount,keyword:data[i].keyword});				
				}
			}
		}

		var maxCount = 0;
		var lastDate = new Date(0);		
		var dateIndex = {}
		var aggXCount = 0;
		var rawData = filteredData
		
		for(var i=0;i<rawData.length;i++){
			// rawData[i].binDateTime = new Date(parseInt(rawData[i].dateTime.getTime()/binSize)*binSize+timeZoneOffset);
			// //if(lastDate.getMinutes()==rawData[i].dateTime.getMinutes() && (rawData[i].dateTime.getTime()-lastDate.getTime())<60*1000){
			if(isInDateBin(binSize,lastDate,rawData[i].dateTime)){
				rawData[i].count = rawData[i-1].count+1;
			}else{
				rawData[i].count = 0;
			}
			if(rawData[i].count>maxCount){
				maxCount = rawData[i].count;
			}
			// rawData[i].binDateTime = new Date(rawData[i].dateTime.getTime())
			// rawData[i].binDateTime.setSeconds(0)
			var timeStr = rawData[i].binDateTime.toString()
			if(!dateIndex[timeStr]){
//				timeMatch[aggXCount] = rawData[i].binDateTime;
				dateIndex[timeStr] = []
//				dateIndex[timeStr].aggXCount = aggXCount++;
			}
//			rawData[i].aggXCount = dateIndex[timeStr].aggXCount;
			dateIndex[rawData[i].binDateTime.toString()].push(rawData[i]);
			lastDate = rawData[i].dateTime;			
		}
		//console.log("max count",maxCount)
		this.filteredData.push(filteredData);

		for(date in dateIndex){
			dateIndex[date].sort(function(a,b){
				var countA,countB;
				countA = 0;
				countB = 0;
				if(a.topic){
					countA = topicLabels[a.topic]
				}
				if(b.topic){
					countB = topicLabels[b.topic]
				}
				// if(!a.author){
				// 	countA = -1;
				// }
				// if(!b.author){
				// 	countB = -1;
				// }
				return countB - countA;
			})
			for(var i=0;i<dateIndex[date].length;i++){
				dateIndex[date][i].topicCount = i;
			}
		}
		
		/*globalKeywordIndexs["keyword"][keyword] = []
		for(var i=0;i<filteredData.length;i++){
			filteredData[i].keyword.push(keyword);
			globalKeywordIndexs["keyword"][keyword].push(filteredData[i].id);
		}*/
		filteredData.maxCount = maxCount
		return filteredData;
	},
	differenceData: function(data, data2) {

		var binSize = this.binSize;
		var filteredData = []

		for(var i=0;i<data.length;i++){
			var flag = false;
			for (j = 0; j < data2.length; j ++) {
				//var content = data[i].body;
				if(data[i].id == data2[j].id) {
					flag = true;
					break;
				}
			}
			if (flag == false) {
				filteredData.push({binDateTime:data[i].binDateTime,dateTime:data[i].dateTime,id:data[i].id,topic:data[i].topic,
							body:data[i].body,people:data[i].people,phrases:data[i].phrases,title:data[i].title,
							source:data[i].source,aggXCount:data[i].aggXCount,keyword:data[i].keyword});				
			}
		}
		
		var maxCount = 0;
		var lastDate = new Date(0);		
		var dateIndex = {}
		var aggXCount = 0;
		var rawData = filteredData
		
		for(var i=0;i<rawData.length;i++){
			// rawData[i].binDateTime = new Date(parseInt(rawData[i].dateTime.getTime()/binSize)*binSize+timeZoneOffset);
			// //if(lastDate.getMinutes()==rawData[i].dateTime.getMinutes() && (rawData[i].dateTime.getTime()-lastDate.getTime())<60*1000){
			if(isInDateBin(binSize,lastDate,rawData[i].dateTime)){
				rawData[i].count = rawData[i-1].count+1;
			}else{
				rawData[i].count = 0;
			}
			if(rawData[i].count>maxCount){
				maxCount = rawData[i].count;
			}
			// rawData[i].binDateTime = new Date(rawData[i].dateTime.getTime())
			// rawData[i].binDateTime.setSeconds(0)
			var timeStr = rawData[i].binDateTime.toString()
			if(!dateIndex[timeStr]){
//				timeMatch[aggXCount] = rawData[i].binDateTime;
				dateIndex[timeStr] = []
//				dateIndex[timeStr].aggXCount = aggXCount++;
			}
//			rawData[i].aggXCount = dateIndex[timeStr].aggXCount;
			dateIndex[rawData[i].binDateTime.toString()].push(rawData[i]);
			lastDate = rawData[i].dateTime;			
		}
		//console.log("max count",maxCount)
		this.filteredData.push(filteredData);

		for(date in dateIndex){
			dateIndex[date].sort(function(a,b){
				var countA,countB;
				countA = 0;
				countB = 0;
				if(a.topic){
					countA = topicLabels[a.topic]
				}
				if(b.topic){
					countB = topicLabels[b.topic]
				}
				// if(!a.author){
				// 	countA = -1;
				// }
				// if(!b.author){
				// 	countB = -1;
				// }
				return countB - countA;
			})
			for(var i=0;i<dateIndex[date].length;i++){
				dateIndex[date][i].topicCount = i;
			}
		}
		
		/*globalKeywordIndexs["keyword"][keyword] = []
		for(var i=0;i<filteredData.length;i++){
			filteredData[i].keyword.push(keyword);
			globalKeywordIndexs["keyword"][keyword].push(filteredData[i].id);
		}*/
		filteredData.maxCount = maxCount
		return filteredData;
	}
}
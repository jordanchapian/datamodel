define('util/set', [],
{
	values:function(obj){
		var output = [];
		for (var key in obj) {
		    if (Object.prototype.hasOwnProperty.call(obj, key)) {
		        output.push(obj[key]);
		    }
		}

		return output;
	},
	argsToArray:function(argumentObject){
		var outputArray = [];

		for(var i = 0; i < argumentObject.length; i++){
			outputArray.push(argumentObject[i]);
		}

		return outputArray;
	}
});
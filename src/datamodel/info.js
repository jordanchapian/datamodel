define('info',
['util/is', 'option/info'],
function(is, infoOptions){
	var info = {};

	info.warn = function(message){
		if(!canSendLog(message))return;
		//carry through with request, appending prefix to message
		console.warn( infoOptions.logPrefix + '  ' + message );
	};

	info.error = function(message){
		if(!canSendLog(message))return;
		//carry through with request, appending prefix to message
		console.error( infoOptions.logPrefix + '  ' + message );
	};

	info.log = function(message){
		if(!canSendLog(message))return;
		//carry through with request, appending prefix to message
		console.log( infoOptions.logPrefix + '  ' + message );
	};

	function canSendLog(message){
		//Check if we have logging enabled
		if(infoOptions.logEnabled === false) return false;
		//check to see if this is a valid message
		else if(!is.String(message)) return false;
		else return true;
	}

	return info;
});
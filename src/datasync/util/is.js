(function(is){

	is.Integer = function(val) {
		return (isNumber(val) && Math.floor(val) == val);
	};

	is.Undefined = function(obj){
		return obj === void 0;
	};

	is.Number = function(val) {
		return (typeof val == "number");
	};

	is.String = function(obj){
		return (typeof obj == "string");
	};

	is.Boolean = function(obj) {
		return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
	};

	is.Object = function(obj) {
		var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
	};

	is.Array = function(val) {
		return (val instanceof Array);
	};

	is.Function = function(val) {
		return (typeof val == "function");
	};

	is.Date = function(val) {
		return (Object.prototype.toString.call(val) === "[object Date]");
	};

})(_private('util.is'));
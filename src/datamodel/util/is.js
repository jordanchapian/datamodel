define('util/is', [],
{
	Integer : function(val) {
		return (isNumber(val) && Math.floor(val) == val);
	},

	Undefined : function(obj){
		return obj === void 0;
	},

	Number : function(val) {
		return (typeof val == "number");
	},

	String : function(obj){
		return (typeof obj == "string");
	},

	Boolean : function(obj) {
		return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
	},

	Object : function(obj) {
		var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
	},

	Array : function(val) {
		return (val instanceof Array);
	},

	Function : function(val) {
		return (typeof val == "function");
	},

	Date : function(val) {
		return (Object.prototype.toString.call(val) === "[object Date]");
	}
});

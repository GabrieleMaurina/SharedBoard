var Mongoose = require('mongoose');

var UpdateSchema = new Mongoose.Schema({
	room : {type : String, index : true},
	type : String,
	date : {type: Date, default: Date.now},
	data : Mongoose.Schema.Types.Mixed
});

module.exports = Mongoose.model('Update', UpdateSchema);
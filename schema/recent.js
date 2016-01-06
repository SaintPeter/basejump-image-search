var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var recentSchema = new Schema({
  term: String,
  date: {type:Date, default:Date.now},
  page: Number,
  cache: []
});

module.exports = mongoose.model('recent', recentSchema);
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

require('mongoose-currency').loadType(mongoose);

var clientSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    address: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      required: true
    }
  },
  {
    usePushEach: true,
    timestamps: true
  }
);

var Clients = mongoose.model('Client', clientSchema);

module.exports = Clients;

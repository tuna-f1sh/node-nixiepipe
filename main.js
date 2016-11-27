// Built-in Dependencies
var Emitter = require("events").EventEmitter;
// External Dependancies
var SerialPort = require('serialport');
// var Queue = require('queue');

// Nixie Pipe commands
var COMMANDS = {
  SETNUMBER : 0x40,
  SETPIPENUMBER : 0x41,
  SETCOLOUR : 0x42,
  SETPIPECOLOUR : 0x43,
  BRIGHTNESS : 0x44,
  CLEAR : 0x45,
  CLEARPIPE : 0x46,
  GETNUMBER : 0x47,
  CONNECT : 0x48,
  SETNUMBERUNITS : 0x49,
  SHOW : 0x50,
};

/**
 * NIXIE_RES contains functions to be called when we receive a packet back from Nixie Pipe.
 * used as a switch object as seen here http://james.padolsey.com/javascript/how-to-avoid-switch-case-syndrome/
 * @private
 */

var NIXIE_RES = {};

/**
 * Handles connect handshake, retrieving version from reply.
 * @param {NixiePipe} The current Nixie Pipe Master.
 */

NIXIE_RES[COMMANDS.CONNECT] = function(pipe) {
  if (pipe.packet.size == 2) {
    major = pipe.packet.message[1];
    minor = pipe.packet.message[0];
    version = major + '.' + minor;
    console.log('Connected to Nixie Pipe version: ' + version);
    pipe.emit('connected');
    pipe.connected = true;
  } else {
    pipe.emit('error', new Error('Invalid connection handshake!!'));
  }
};

/**
 * Handles `getNumber` reply, updating ''number'' property and emits event to signal update.
 * @param {NixiePipe} The current Nixie Pipe Master.
 */

NIXIE_RES[COMMANDS.GETNUMBER] = function(pipe) {
  if (pipe.packet.size == 4) {
    pipe.number = pipe.messageToValue(pipe.packet.message);
    pipe.emit('updated');
  }
};

/**
 * Auto detect serial port connected to Nixie Pipe Master if port has not been defined.
 * @param {string} port Serial port if defined returns callback immediately
 */

function autoSerial(port, callback) {
  if (typeof port === "undefined") {
    SerialPort.list( function(err, ports) {
      ports.forEach(function(x) {
        if (typeof x.manufacturer !== "undefined") {
          if (x.manufacturer.match('JBR Engineering')) {
            return callback(x.comName);
          }
        }
      });
    });
  } else {
    return callback(port);
  }
}

/**
 * @class NixiePipe is a Nixie Pipe Master connected via USB
 * @augments EventEmitter.
 * @param {string} port Serial port Nixie Pipe Master connected to. If not passed, will auto-detect using device descriptor.
 * @param {function} callback Function to be called once handshake connection is confirmed.
 *
 * @property _queue Packet buffer to maintain syncronous serial communication.
 * @property _busy If queue is active.
 * @property debug Output debugging logs.
 * @property connected Status of connection.
 * @property version Version of Nixie Pipe firmware.
 * @property number Current display number (must be updated using `getNumber`).
 * @property packet Last data packet recieved.
 * @property {SerialPort} Serial object used by class.
 */

function NixiePipe(port, callback) {
  if (typeof port === "function" || typeof port === "undefined") {
    callback = port;
  }

  Emitter.call(this);

  // Default values for connection
  var defaults = {
    connectTimeout : 5000,
    portSettings : {
      baudRate : 57600,
      autoOpen : true,
    },
  };

  // Properties
  this._queue = [];
  this._busy = false;
  this.debug = true;
  this.connected = false;
  this.version = -1;
  this.number = 0;
  this.packet = {
    size : 0,
    header : 0,
    message : [],
  };
  
  var pipe = this;

  autoSerial(port, function(port) {
    if (typeof port === "object") {
      this.serial = port;
    } else {
      this.serial = new SerialPort(port, defaults.portSettings);
    }

    // Open port and connect to pipe when open
    this.serial.on('open', function() {
      if (this.debug) console.log('Serial port open @: ' + defaults.portSettings.baudRate);
      this.emit("open");

      connect();
    }.bind(this));

    // Act on data recieved and send queue'd data if there is some
    this.serial.on('data', function(data) {
      if (this.debug) console.log('Data:' + data.toString('hex'));

      // Check for valid packet length
      if (data.length > 2) {
        this.packet.size = data[0];
        this.packet.command = data[1];

        for (var i = 2; i < data.length; i++) {
          this.packet.message[i-2] = data[i];
        }
      }

      // Get response handler
      var handler = NIXIE_RES[this.packet.command];

      // Call handler if there is one
      if (handler) {
        handler(this);
      }

      // Get next packet
      var next = this._queue.shift();

      // Send next command if there is one
      if (next) {
        this.serial.write(next);
      } else {
        // if not, disable the queue
        this._busy = false;
      }

    }.bind(this));
    

    this.serial.on("close", function() {
      this.emit("close");
    }.bind(this));

    this.serial.on("disconnect", function() {
      this.emit("disconnect");
    }.bind(this));

    this.serial.on("error", function(error) {
      if (!this.connected && typeof callback === "function") {
        callback(error);
      } else {
        if (this.debug) console.log('Error: ' + error);
        this.emit("error", error);
      }
    }.bind(this));
  }.bind(this));

  // Send connection query
  connect = function() {
    pipe.sendcommand(COMMANDS.CONNECT, new Buffer([0x4E, 0x50]), 2);
  };

}

NixiePipe.prototype = Object.create(Emitter.prototype, {
  constructor: {
    value: NixiePipe,
  },
});

NixiePipe.prototype.sendcommand = function(command, message, size) {
  // packet is size of message plus two bytes for header
  var packet = new Buffer(2 + size);

  packet[0] = size & 0xFF;
  packet[1] = command & 0xFF;

  for (var i = 0; i < size; i++) {
    packet[2+i] = message[i] & 0xFF;
  }

  if (this._busy) {
    if (this.debug) console.log("Queing serial data: " + packet.toString('hex'));
    this._queue.push(packet);
  } else {
    this._busy = true;
    if (this.debug) console.log("Writing serial data: " + packet.toString('hex'));
    this.serial.write(packet);
  }
};

NixiePipe.prototype.valueToMessage = function(value) {
  var message = new Buffer(4);
  for (var i = 0;i < 4; i++) {
    message[i] = (value >> (8 * i)) & 0xFF;
  }

  return message;
};

NixiePipe.prototype.messageToValue = function(message) {
    var value = 0;

    for (var i = 0; i < message.length; i++) {
      value += (message[i] & 0xFF) << (8 * i);
    }

    return value;
};

/**
 * Set new number to Nixie Pipe array.
 * @param {int} value New value to be displayed.
 */

NixiePipe.prototype.setNumber = function(value) {
  this.sendcommand(COMMANDS.SETNUMBER, this.valueToMessage(value), 4);
};

/**
 * Set new individual pipe number.
 * @param {int} pipe Index of Nixie Pipe to set.
 * @param {int} value New value to be displayed (0-9).
 */

NixiePipe.prototype.setPipeNumber = function(pipe, value) {
  this.sendcommand(COMMANDS.SETPIPENUMBER, new Buffer([pipe, value]), 2);
};

/**
 * Set new Nixie Pipe array RGB colour.
 * @param {int} r Red colour saturation.
 * @param {int} g Green colour saturation.
 * @param {int} b Blue colour saturation.
 */

NixiePipe.prototype.setColour = function(r, g, b) {
  this.sendcommand(COMMANDS.SETCOLOUR, new Buffer([r, g, b]), 3);
};

/**
 * Set individual Nixie Pipe RGB colour
 * @param {int} pipe Index of Nixie Pipe to set.
 * @param {int} r Red colour saturation.
 * @param {int} g Green colour saturation.
 * @param {int} b Blue colour saturation.
 */

NixiePipe.prototype.setPipeColour = function(pipe, r, g, b) {
  this.sendcommand(COMMANDS.SETPIPECOLOUR, new Buffer([pipe, r, g, b]), 4);
};

/**
 * Write and show display changes.
 *  Changes to the display are not visable until this is called. Firmware must disable ISR to write LED updates so serial transmission will be disabled. Syncronous serial buffer will manage this by enforcing a wait until Nixie Pipe indicats LED update is complete
 */

NixiePipe.prototype.show = function() {
  this.sendcommand(COMMANDS.SHOW, new Buffer([1]), 1);
};

/**
 * Clear Nixie Pipe array (set black)
 */

NixiePipe.prototype.clear = function() {
  this.sendcommand(COMMANDS.CLEAR, new Buffer([1]), 1);
};

/**
 * Clear single Nixie Pipe in array (set black)
 */

NixiePipe.prototype.clearPipe = function(pipe) {
  this.sendcommand(COMMANDS.CLEARPIPE, new Buffer([pipe]), 1);
};

/**
 * Set array brightness.
 * @param {int} value 0-255 intensity - 0 off/255 full
 */

NixiePipe.prototype.setBrightness = function(value) {
  this.sendcommand(COMMANDS.BRIGHTNESS, new Buffer([value]), 1);
};

/**
 * Update this.number with value reported by firmware.
 * @param {function} callback Function to call when firmware replies with value.
 * @return {int} Number being displated on Nixie Pipe array.
 */

NixiePipe.prototype.getNumber = function(callback) {
  this.sendcommand(COMMANDS.GETNUMBER, new Buffer([1]), 1);
  this.once("updated", callback);
};

var pipes = new NixiePipe();

pipes.once("connected", function() {
  pipes.setNumber(990);
  pipes.show();
  pipes.setNumber(991);
  pipes.show();
  pipes.setNumber(992);
  pipes.show();
  pipes.setColour(0,0,255);
  pipes.show();
  for (var x = 0; x < 9999; x++) {
    pipes.setNumber(x);
    pipes.show();
  }
});


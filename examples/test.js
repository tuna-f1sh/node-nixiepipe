var NixiePipe = require('../nixiepipe.js');

var pipes = new NixiePipe();

pipes.once("connected", function() {
  pipes.setNumber(9999);
  pipes.show();
  pipes.setColour(0,0,255);
  pipes.show();
  pipes.setPipeColour(1,128,128,0);
  pipes.setPipeColour(2,0,128,128);
  pipes.setPipeColour(3,255,128,0);
  pipes.show();
  pipes.show();
  pipes.getNumber( function() { console.log(pipes.number); });

  for (var x = 0; x < 9999; x++) {
    pipes.setNumber(x);
    pipes.show();
  }
});

Module for control of the Nixie Pipe Master over USB

# Install

`npm install nixiepipe`

# Usage

```javascript
var NixiePipe = require('nixiepipe');

var pipes = new NixiePipe();

pipes.once("connected", function() {
  pipes.setNumber(9999); // Set array number 9999
  pipes.setColour(0,0,255); // Set blue
  pipes.show(); // Write and set new settings
  pipes.getNumber( function() { console.log(pipes.number); }); // Return display number
});
```
---

## Classes

<dl>
<dt><a href="#NixiePipe">NixiePipe</a> ⇐ <code>EventEmitter.</code></dt>
<dd><p>NixiePipe is a Nixie Pipe Master connected via USB</p>
</dd>
</dl>

<a name="NixiePipe"></a>

## NixiePipe ⇐ <code>EventEmitter.</code>
NixiePipe is a Nixie Pipe Master connected via USB

**Kind**: global class  
**Extends:** <code>EventEmitter.</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| _queue |  | Packet buffer to maintain syncronous serial communication. |
| _busy |  | If queue is active. |
| debug |  | Output debugging logs. |
| connected |  | Status of connection. |
| version |  | Version of Nixie Pipe firmware. |
| number |  | Current display number (must be updated using `getNumber`). |
| packet |  | Last data packet recieved. |
| Serial | <code>SerialPort</code> | object used by class. |


* [NixiePipe](#NixiePipe) ⇐ <code>EventEmitter.</code>
    * [new NixiePipe(port, callback)](#new_NixiePipe_new)
    * [.setNumber(value)](#NixiePipe+setNumber)
    * [.setPipeNumber(pipe, value)](#NixiePipe+setPipeNumber)
    * [.setColour(r, g, b)](#NixiePipe+setColour)
    * [.setPipeColour(pipe, r, g, b)](#NixiePipe+setPipeColour)
    * [.show()](#NixiePipe+show)
    * [.clear()](#NixiePipe+clear)
    * [.clearPipe()](#NixiePipe+clearPipe)
    * [.setBrightness(value)](#NixiePipe+setBrightness)
    * [.getNumber(callback)](#NixiePipe+getNumber) ⇒ <code>int</code>

<a name="new_NixiePipe_new"></a>

### new NixiePipe(port, callback)

| Param | Type | Description |
| --- | --- | --- |
| port | <code>string</code> | Serial port Nixie Pipe Master connected to. If not passed, will auto-detect using device descriptor. |
| callback | <code>function</code> | Function to be called once handshake connection is confirmed. |

<a name="NixiePipe+setNumber"></a>

### nixiePipe.setNumber(value)
Set new number to Nixie Pipe array.

**Kind**: instance method of <code>[NixiePipe](#NixiePipe)</code>  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>int</code> | New value to be displayed. |

<a name="NixiePipe+setPipeNumber"></a>

### nixiePipe.setPipeNumber(pipe, value)
Set new individual pipe number.

**Kind**: instance method of <code>[NixiePipe](#NixiePipe)</code>  

| Param | Type | Description |
| --- | --- | --- |
| pipe | <code>int</code> | Index of Nixie Pipe to set. |
| value | <code>int</code> | New value to be displayed (0-9). |

<a name="NixiePipe+setColour"></a>

### nixiePipe.setColour(r, g, b)
Set new Nixie Pipe array RGB colour.

**Kind**: instance method of <code>[NixiePipe](#NixiePipe)</code>  

| Param | Type | Description |
| --- | --- | --- |
| r | <code>int</code> | Red colour saturation. |
| g | <code>int</code> | Green colour saturation. |
| b | <code>int</code> | Blue colour saturation. |

<a name="NixiePipe+setPipeColour"></a>

### nixiePipe.setPipeColour(pipe, r, g, b)
Set individual Nixie Pipe RGB colour

**Kind**: instance method of <code>[NixiePipe](#NixiePipe)</code>  

| Param | Type | Description |
| --- | --- | --- |
| pipe | <code>int</code> | Index of Nixie Pipe to set. |
| r | <code>int</code> | Red colour saturation. |
| g | <code>int</code> | Green colour saturation. |
| b | <code>int</code> | Blue colour saturation. |

<a name="NixiePipe+show"></a>

### nixiePipe.show()
Write and show display changes.
 Changes to the display are not visable until this is called. Firmware must disable ISR to write LED updates so serial transmission will be disabled. Syncronous serial buffer will manage this by enforcing a wait until Nixie Pipe indicats LED update is complete

**Kind**: instance method of <code>[NixiePipe](#NixiePipe)</code>  
<a name="NixiePipe+clear"></a>

### nixiePipe.clear()
Clear Nixie Pipe array (set black)

**Kind**: instance method of <code>[NixiePipe](#NixiePipe)</code>  
<a name="NixiePipe+clearPipe"></a>

### nixiePipe.clearPipe()
Clear single Nixie Pipe in array (set black)

**Kind**: instance method of <code>[NixiePipe](#NixiePipe)</code>  
<a name="NixiePipe+setBrightness"></a>

### nixiePipe.setBrightness(value)
Set array brightness.

**Kind**: instance method of <code>[NixiePipe](#NixiePipe)</code>  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>int</code> | 0-255 intensity - 0 off/255 full |

<a name="NixiePipe+getNumber"></a>

### nixiePipe.getNumber(callback) ⇒ <code>int</code>
Update this.number with value reported by firmware.

**Kind**: instance method of <code>[NixiePipe](#NixiePipe)</code>  
**Returns**: <code>int</code> - Number being displated on Nixie Pipe array.  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | Function to call when firmware replies with value. |


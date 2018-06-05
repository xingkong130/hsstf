
var logger = require('../../../../../util/logger')
var log = logger.createLogger('device:plugins:audio:util:frameparser')

function FrameParser() {
  this.readFrameBytes = 0
  this.frameBodyLength = 0
  this.frameBody = null
  this.cursor = 0
  this.chunk = null
}

FrameParser.prototype.push = function(chunk) {
  if (this.chunk) {
    throw new Error('Must consume pending frames before pushing more chunks')
  }

  this.chunk = chunk
}

FrameParser.prototype.nextFrame = function() {
  if (!this.chunk) {
    return null
  }

  // log.info('%%%%%%%%%%%%%%: [' + this.readFrameBytes + "] 222222: [" + this.chunk + '] len:[' + this.chunk.length + ']')

  for (var len = this.chunk.length; this.cursor < len;) {
    if (this.readFrameBytes < 4) {
      this.frameBodyLength += 12
        // (this.chunk[this.cursor] << (this.readFrameBytes * 8)) >>> 0
      this.cursor += 1
      this.readFrameBytes += 1
      
      // log.info('%%%%%%%%%%%%%%: 0]')
    }
    else {
      var bytesLeft = len - this.cursor
        
      // log.info('%%%%%%%%%%%%%%: 1]' + bytesLeft + ':' + len + ':' + this.cursor + ':' + this.frameBodyLength )
      if (bytesLeft >= this.frameBodyLength) {
        var completeBody
        if (this.frameBody) {
          completeBody = this.chunk
          // completeBody = Buffer.concat([
          //   this.frameBody
          //   , this.chunk.slice(this.cursor, this.cursor + this.frameBodyLength)
          // ])
          
          // log.info('%%%%%%%%%%%%%%: 2]')
        }
        else {
          completeBody = this.chunk
          // completeBody = this.chunk.slice(this.cursor,
          //   this.cursor + this.frameBodyLength)
            
          // log.info('%%%%%%%%%%%%%%: 3]')
        }

        this.cursor += this.frameBodyLength
        this.frameBodyLength = this.readFrameBytes = 0
        this.frameBody = null
        
        // log.info('%%%%%%%%%%%%%%: 4]')
        return completeBody
      }
      else {
        // @todo Consider/benchmark continuation frames to prevent
        // potential Buffer thrashing.
        if (this.frameBody) {
          
          // log.info('%%%%%%%%%%%%%%: 5]')
          this.frameBody =
            Buffer.concat([this.frameBody, this.chunk.slice(this.cursor, len)])
        }
        else {
          
        // log.info('%%%%%%%%%%%%%%: 6]')
          this.frameBody = this.chunk.slice(this.cursor, len)
        }
        
        // log.info('%%%%%%%%%%%%%%: 7]')
        this.frameBodyLength -= bytesLeft
        this.readFrameBytes += bytesLeft
        this.cursor = len
      }
    }
  }

  
  // log.info('%%%%%%%%%%%%%%: 8]')
  // return this.chunk
  this.cursor = 0
  this.chunk = null

  return null
}

module.exports = FrameParser

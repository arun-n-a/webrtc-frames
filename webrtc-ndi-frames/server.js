const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 8000;
const { createCanvas, Image } = require('canvas');
const addon = require('bindings')('ndi');
app.use('/static', express.static('public'))

var i=0;
// expose module API
ndi = addon.ndi;

const width = 300, height = 200;

var canvas = createCanvas(width, height);
var context = canvas.getContext('2d');
var image = new Image()
var videoFrameIs = new Uint8Array(width*height*4)

image.onload = function() {
	context.drawImage(image, 0, 0);
  videoFrameIs = context.getImageData(0, 0, width, height).data  
  processFrame();
  };


function processFrame() {
  ndi('sync',videoProperties, videoFrameIs.buffer, success) ;

}

function success(err, id, type) {
  // console.log(`successfully send ${type} frame - [${id}]`) ;
}
function success2(err, id, type) {
  // console.log(`successfully send ${type} frame - [${id}]`) ;
}

const audioProperties = {
  id:'a001',
  type:'audio',
  channelName:'test',
  sampleRate:'48100',
noOfChannels:'2',
noOfSamples:'512',
channelStride:'512'
};


var videoProperties = {
    id:'b001',
    type:'video',
    channelName:'testVideo',
	xres:'300',
	yres:'200',
	frameRate:(1000/10)+''
};

var videoProperties2 = {
  id:'b002',
  type:'video',
  channelName:'testVideo2',
xres:'480',
yres:'320',
frameRate:(1000/30)+''
};

console.log(videoProperties);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/server.html');
});


io.on('connection', (socket) => {

  socket.on('video frames', imageBitmap => {
    image.src = imageBitmap

	//socket.emit("rec", videoFrameIs);
    //console.log(videoFrameIs);
  });
});


http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});


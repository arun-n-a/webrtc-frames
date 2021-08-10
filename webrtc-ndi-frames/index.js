const express = require('express');
const app = express();
const http = require('http').Server(app);
// const io = require('socket.io')(http);
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
  }
});
const port = process.env.PORT || 8000;

const addon = require('bindings')('ndi');
app.use('/static', express.static('public'))

var i=0;
// expose module API
ndi = addon.ndi;

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
	xres:'480',
	yres:'320',
	frameRate:(1000/30)+''
};

var videoProperties2 = {
  id:'b002',
  type:'video',
  channelName:'testVideo2',
xres:'480',
yres:'480',
frameRate:(1000/30)+''
};

// console.log(videoProperties);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/audio', (req, res) => {
  res.sendFile(__dirname + '/audio.html');
});

app.get('/jayettan', (req, res) => {
  res.sendFile(__dirname + '/jayettan.html');
});


io.on('connection', (socket) => {
  socket.on('audio_buffer', function (msg){
    // console.log("audio received", msg);
    socket.emit('client_aud_buf', msg)
  });

  socket.on('audio frames', msg => {
    var audioFrameIs = new Uint8Array(msg);
    //console.log(audioFrameIs);
    ndi('sync',audioProperties, audioFrameIs.buffer, success) ;
  });
  socket.on('video frames', obj => {
    videoProperties.id = obj.id
    videoProperties.channelName = obj.channelName
    videoProperties.xres = obj.width
    videoProperties.yres = obj.height
    videoProperties.frameRate = obj.frameRate
    var videoFrameIs = new Uint8ClampedArray(obj.data);
    // var videoFrameIs2 = new Uint8ClampedArray(msg);

	  // socket.emit("rec", videoProperties);
    //console.log(videoFrameIs);
    ndi('sync',videoProperties, videoFrameIs.buffer, success) ;
    // ndi('sync',videoProperties2, videoFrameIs2.buffer, success2) ;
  });
});


http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});


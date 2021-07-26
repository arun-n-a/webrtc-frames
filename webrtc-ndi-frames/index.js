const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 8000;

const addon = require('bindings')('ndi');
var i=0;
// expose module API
ndi = addon.ndi;

function success(err, id, type) {
  // console.log(`successfully send ${type} frame - [${id}]`) ;
}

const audioProperties = {
    id:'a001',
    type:'audio',
    channelName:'testAudio',
    sampleRate:'48000',
	noOfChannels:'1',
	noOfSamples:'1920',
	channelStride:'1920'
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
xres:'600',
yres:'400',
frameRate:(1000/30)+''
};

console.log(videoProperties);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.on('audio frames', msg => {
    var audioFrameIs = new Uint8Array(msg);
    //console.log(audioFrameIs);
    // ndi('sync',audioProperties, audioFrameIs.buffer, success) ;
  });
  socket.on('video frames', msg => {
    var videoFrameIs = new Uint8ClampedArray(msg);
	//socket.emit("rec", videoFrameIs);
    //console.log(videoFrameIs);
    ndi('sync',videoProperties, videoFrameIs.buffer, success) ;
    // ndi('sync',videoProperties2, videoFrameIs.buffer, success) ;
  });
});


http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});


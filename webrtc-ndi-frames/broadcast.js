const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: '*',
  }
});
const addon = require('bindings')('ndi');
app.use('/static', express.static('public'))
ndi = addon.ndi;

const audioProperties = {
  id: 'a001',
  type: 'audio',
  channelName: 'test',
  sampleRate: '48100',
  noOfChannels: '2',
  noOfSamples: '512',
  channelStride: '512'
};

var videoProperties = {
  id: 'b001',
  type: 'video',
  channelName: 'testVideo',
  xres: '480',
  yres: '320',
  frameRate: (1000 / 30) + ''
};

let broadcaster;
const port = process.env.PORT || 80;

function success(err, id, type) {
  // console.log(`successfully send ${type} frame - [${id}]`) ;
}

// API URLS
app.get("/meeting", function(req, res) {
    res.sendFile(__dirname + "/public/broadcast.html");
});
app.get("/panel", function(req, res) {
    res.sendFile(__dirname + "/public/watch.html");
});

// SOCKET URLS
io.sockets.on("error", e => console.log(e));
io.sockets.on("connection", socket => {
  // ########### NDI sockets ###########
  socket.on('audio_buffer', function(msg) {
    // console.log("audio received", msg);
    socket.emit('client_aud_buf', msg)
  });
  socket.on('audio frames', msg => {
    var audioFrameIs = new Uint8Array(msg);
    //console.log(audioFrameIs);
    ndi('sync', audioProperties, audioFrameIs.buffer, success);
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
    ndi('sync', videoProperties, videoFrameIs.buffer, success);
    // ndi('sync',videoProperties2, videoFrameIs2.buffer, success2) ;
  });

  // ########### Webrtc Sockets ##########
  socket.on("broadcaster", () => {
    broadcaster = socket.id;
    socket.broadcast.emit("broadcaster");
  });
  socket.on("watcher", () => {
    socket.to(broadcaster).emit("watcher", socket.id);
  });
  socket.on("offer", (id, message) => {
    socket.to(id).emit("offer", socket.id, message);
  });
  socket.on("answer", (id, message) => {
    socket.to(id).emit("answer", socket.id, message);
  });
  socket.on("candidate", (id, message) => {
    socket.to(id).emit("candidate", socket.id, message);
  });
  socket.on("disconnect", () => {
    socket.to(broadcaster).emit("disconnectPeer", socket.id);
  });
});
server.listen(port, () => console.log(`Server is running on port ${port}`));

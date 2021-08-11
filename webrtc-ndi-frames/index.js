const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
  }
});
const port = process.env.PORT || 8000;
const addon = require('bindings')('ndi');
app.use('/static', express.static('public'))
// expose module API
ndi = addon.ndi;

var i = 0;

function success(err, id, type) {
  // console.log(`successfully send ${type} frame - [${id}]`) ;
}

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

// API URLS
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/audio', (req, res) => {
  res.sendFile(__dirname + '/audio.html');
});

app.get('/jayettan', (req, res) => {
  res.sendFile(__dirname + '/jayettan.html');
});
app.get('/webrtc', (req, res) => {
  res.sendFile(__dirname + '/webrtc.html');
});


// SOCKET URLS
io.on('connection', (socket) => {
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
  // Convenience function to log server messages on the client.
  // Arguments is an array like object which contains all the arguments of log().
  // To push all the arguments of log() in array, we have to use apply().
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }
  //Defining Socket Connections
  socket.on('message', function(message, room) {
    log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    socket.in(room).emit('message', message, room);
  });

  socket.on('create or join', function(room) {
    log('Received request to create or join room ' + room);

    var clientsInRoom = io.sockets.adapter.rooms[room];
    console.log(clientsInRoom);
    var numClients = clientsInRoom ? Object.keys(clientsInRoom).length : 0;
    log('Room ' + room + ' now has ' + numClients + ' client(s)');

    if (numClients === 0) {
      socket.join(room);
      log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', room, socket.id);

    } else if (numClients <= 4) {
      log('Client ID ' + socket.id + ' joined room ' + room);
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('ready');
    } else { // max two clients
      socket.emit('full', room);
    }
  });

  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

  socket.on('bye', function() {
    console.log('received bye');
  });
});


// SERVER
http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});

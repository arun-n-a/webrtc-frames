const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 8000;
var count = 0

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.on('audio frames', msg => {
    var audioFrameIs = new Uint8Array(msg);
    console.log(audioFrameIs);
    // call socekt emit here
  });
  socket.on('video frames', msg => {
    // console.log("Videooooo*****: ", msg)
    count += 1
    if (count>=10) {
      var videoFrameIs = new Uint8ClampedArray(msg);
      socket.emit("rec", videoFrameIs);
      console.log(videoFrameIs);
      count = 0
    }
  });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});

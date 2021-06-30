const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 8000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.on('audio frames', msg => {
    var audioFrameIs = new Uint8Array(msg);
    console.log(audioFrameIs);
  });
  socket.on('video frames', msg => {
    console.log("Videooooo*****: ", msg)
    var videoFrameIs = new Uint8ClampedArray(msg);
    socket.emit("rec", videoFrameIs);
    console.log(videoFrameIs);
  });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});

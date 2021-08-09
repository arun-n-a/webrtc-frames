var meetingCanvas = document.getElementById('meetingCanvas');
var meetingCtx = meetingCanvas.getContext('2d');
var localStreamTrack, localStreamEmit, localStream;
var video1Track, video2Track, video3Track;
var video1TrackEmit, video2TrackEmit, video3TrackEmit, emitCanvas;

let videoDrawConfig = [{
  'x': 0,
  'y': 0,
  'width': 300,
  'height': 200
}, {
  'x': 300,
  'y': 0,
  'width': 300,
  'height': 200
}, {
  'x': 0,
  'y': 200,
  'width': 300,
  'height': 200
}, {
  'x': 300,
  'y': 200,
  'width': 300,
  'height': 200
}]

let canvasOptions = {
  'height': meetingCanvas.height,
  'width': meetingCanvas.width,
  'canvas': meetingCanvas,
  'ctx': meetingCtx,
  'videoOptions': videoDrawConfig
}


// GET Local Video Source and add it to Meeting Canvas
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then((stream) => {
  localStream = stream
  localStreamTrack = stream.getVideoTracks()[0];
  localStreamEmit = setInterval(() => {
    drawVideoOnMeetingCanvas(localStreamTrack, canvasOptions, 1)
  }, frameRate);


  localStream.clone().getVideoTracks().forEach(track => {
    // console.log("Local track:::", track);
    video1Track = track
  });
  localStream.clone().getVideoTracks().forEach(track => {
    // console.log("Local track:::", track);
    video2Track = track
  });
  localStream.clone().getVideoTracks().forEach(track => {
    // console.log("Local track:::", track);
    video3Track = track
  });
  // console.log(localStreamTrack);
})

// Remote Video Tracks initialize
// localStream.clone().getTracks().forEach(track => {
//   console.log("Local track:::", track);
//   video1Track.addTrack(track)
// });
// localStream.clone().getTracks().forEach(track => {
//   console.log("Local track:::", track);
//   video2Track.addTrack(track)
// });
// localStream.clone().getTracks().forEach(track => {
//   console.log("Local track:::", track);
//   video3Track.addTrack(track)
// });

video1TrackEmit = setInterval(() => {
  drawVideoOnMeetingCanvas(video1Track, canvasOptions, 2)
}, frameRate);

video2TrackEmit = setInterval(() => {
  drawVideoOnMeetingCanvas(video2Track, canvasOptions, 3)
}, frameRate);

video3TrackEmit = setInterval(() => {
  drawVideoOnMeetingCanvas(video3Track, canvasOptions, 4)
}, frameRate);

function drawVideoOnMeetingCanvas(stream, canvasOptions, vIndex) {
  let imageCapture = new ImageCapture(stream);
  let width = canvasOptions.videoOptions[vIndex - 1]['width'];
  let height = canvasOptions.videoOptions[vIndex - 1].height;
  let x = canvasOptions.videoOptions[vIndex - 1].x;
  let y = canvasOptions.videoOptions[vIndex - 1].y;

  imageCapture.grabFrame()
    .then((imageBitmap) => {
      canvasOptions.ctx.drawImage(imageBitmap, x, y, width, height);
    })
}

function drawGrid() {
  var cnv = document.getElementById("meetingCanvas");

  var gridOptions = {
    minorLines: {
      widthSeparation: 1,
      heighSeparation: 1,
      color: '#000000'
    },
    majorLines: {
      widthSeparation: 300,
      heighSeparation: 200,
      color: '#FF0000'
    }
  };

  drawGridLines(cnv, gridOptions.minorLines);
  drawGridLines(cnv, gridOptions.majorLines);

  return;
}

function drawGridLines(cnv, lineOptions) {


  var iWidth = cnv.width;
  var iHeight = cnv.height;

  var ctx = cnv.getContext('2d');

  ctx.strokeStyle = lineOptions.color;
  ctx.strokeWidth = 1;

  ctx.beginPath();

  var iCount = null;
  var i = null;
  var x = null;
  var y = null;

  iCount = Math.floor(iWidth / lineOptions.widthSeparation);

  for (i = 1; i <= iCount; i++) {
    x = (i * lineOptions.widthSeparation);
    ctx.moveTo(x, 0);
    ctx.lineTo(x, iHeight);
    ctx.stroke();
  }


  iCount = Math.floor(iHeight / lineOptions.heighSeparation);

  for (i = 1; i <= iCount; i++) {
    y = (i * lineOptions.heighSeparation);
    ctx.moveTo(0, y);
    ctx.lineTo(iWidth, y);
    ctx.stroke();
  }

  ctx.closePath();

  return;
}

function sendMeetingCanvas() {
  const canvas = document.getElementById('meetingCanvas');
  const ctx = canvas.getContext('2d');
  var frame = ctx.getImageData(0, 0, meetingCanvas.width, meetingCanvas.height);
  socket.emit('video frames', {
    'id': 'meetingCanvas'.concat(meetingCanvas.width),
    'channelName': 'meetingCanvas'.concat(meetingCanvas.width),
    'height': meetingCanvas.height,
    'width': meetingCanvas.width,
    'frameRate': frameRate,
    'data': frame.data
  });
}

// Event Listeners
document.getElementById('frameRate').addEventListener('change', () => {
  frameRate = 1000 / document.getElementById('frameRate').value
  clearInterval(localStreamEmit);
  clearInterval(video1TrackEmit);
  clearInterval(video2TrackEmit);
  clearInterval(video3TrackEmit);
  localStreamEmit = setInterval(function() {
    drawVideoOnMeetingCanvas(localStreamTrack, canvasOptions, 1);
  }, frameRate);
  video1TrackEmit = setInterval(function() {
    drawVideoOnMeetingCanvas(video1Track, canvasOptions, 2);
  }, frameRate);
  video2TrackEmit = setInterval(function() {
    drawVideoOnMeetingCanvas(video2Track, canvasOptions, 3);
  }, frameRate);
  video3TrackEmit = setInterval(function() {
    drawVideoOnMeetingCanvas(video3Track, canvasOptions, 4);
  }, frameRate);

  if (document.getElementById('meetingCanvasBroadcast').value) {
    emitCanvas = setInterval(sendMeetingCanvas, frameRate)
  }
  // console.log(frameRate);
})


document.getElementById('meetingCanvasBroadcast').addEventListener('change', () => {
  if (document.getElementById('meetingCanvasBroadcast').value) {
    emitCanvas = setInterval(sendMeetingCanvas, frameRate)
  } else {
    clearInterval(emitCanvas)
  }
})

window.addEventListener('load', drawGrid);

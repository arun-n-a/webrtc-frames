'use strict';
var width = 120;
var height = 80;
var frameRate = 1000 / 1;


//Defining some global utility variables
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var recordedStream = new MediaStream();
var turnReady;
var currentVTrackNo = 1;

let peerConnection;
const config = turnConfig;

const socket = io.connect(window.location.origin);
var streamSocket;

const video = document.querySelector("video");
const enableAudioButton = document.querySelector("#enable-audio");

let silence = () => {
  let ctx = new AudioContext(),
    oscillator = ctx.createOscillator();
  let dst = oscillator.connect(ctx.createMediaStreamDestination());
  oscillator.start();
  return Object.assign(dst.stream.getAudioTracks()[0], {
    enabled: false
  });
}
let black = ({
  width = 640,
  height = 480
} = {}) => {
  let canvas = Object.assign(document.createElement("canvas"), {
    width,
    height
  });
  canvas.getContext('2d').fillRect(0, 0, width, height);
  let stream = canvas.captureStream();
  return Object.assign(stream.getVideoTracks()[0], {
    enabled: false
  });
}
let blackSilence = () => new MediaStream([black(), silence()]);
var dummyStream = blackSilence();

//Displaying Local Stream and Remote Stream on webpage
var localVideo = document.querySelector('#localVideo');
var remoteVideo1 = document.querySelector('#remoteVideo1');
var remoteVideo2 = document.querySelector('#remoteVideo2');
var remoteVideo3 = document.querySelector('#remoteVideo3');
// Video Tracks
var localTrack, video1Track, video2Track, video3Track;
// Meeting canvas emit variables
var localTrackEmit, video1TrackEmit, video2TrackEmit, video3TrackEmit, localTrackEmitCanvas;
// Individual video streams on canvas
var streamEmit1, streamEmit2, streamEmit3, emitCanvas;
// Boolean variables to identify valid streams
var localCast, streamCast1, streamCast2, streamCast3, isStreamCast = false;
// variable to send Individual canvas videos
var localCanvasEmit, streamCanvasEmit1, streamCanvasEmit2, streamCanvasEmit3;
var meetingCanvas = document.getElementById('meetingCanvas');
var meetingCtx = meetingCanvas.getContext('2d');
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

InitializeStreams(dummyStream);

socket.on("offer", (id, description) => {
  // if (peerConnection === undefined){
  peerConnection = new RTCPeerConnection(config);
  // }

  peerConnection
    .setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("answer", id, peerConnection.localDescription);
    });
  peerConnection.ontrack = handleRemoteStreamAdded
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };
});

socket.on("candidate", (id, candidate) => {
  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
});

socket.on("connect", () => {
  socket.emit("watcher");
});

socket.on("broadcaster", () => {
  socket.emit("watcher");
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
  peerConnection.close();
};


function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  var newStream = event.streams[0];
  console.log("Details of newly added Stream ::::", newStream);
  switch (currentVTrackNo) {
    case 1:
      localVideo.srcObject = newStream;
      newStream.getVideoTracks().forEach(track => {
        localTrack = track
      });
      clearInterval(localTrackEmit);
      localTrackEmit = setInterval(() => {
        drawVideoOnMeetingCanvas(localTrack, canvasOptions, 1)
      }, frameRate);
      displayStreamOnCanvas(localTrack, 'Bot', localTrackEmit, 1);
      currentVTrackNo += 1;
      break;
    case 2:
      remoteVideo1.srcObject = newStream;
      newStream.getVideoTracks().forEach(track => {
        video1Track = track
      });
      clearInterval(video1TrackEmit);
      video1TrackEmit = setInterval(() => {
        drawVideoOnMeetingCanvas(video1Track, canvasOptions, 2)
      }, frameRate);
      displayStreamOnCanvas(video1Track, 'Alpha', streamEmit1, 2);
      currentVTrackNo += 1;
      break;
    case 3:
      remoteVideo2.srcObject = newStream;
      newStream.getVideoTracks().forEach(track => {
        video2Track = track
      });
      clearInterval(video2TrackEmit);
      video2TrackEmit = setInterval(() => {
        drawVideoOnMeetingCanvas(video2Track, canvasOptions, 3)
      }, frameRate);
      displayStreamOnCanvas(video2Track, 'Beta', streamEmit2, 3);
      currentVTrackNo += 1;
      break;
    case 4:
      remoteVideo2.srcObject = newStream;

      newStream.getVideoTracks().forEach(track => {
        video3Track = track
      });
      clearInterval(video3TrackEmit);
      video3TrackEmit = setInterval(() => {
        drawVideoOnMeetingCanvas(video3Track, canvasOptions, 4)
      }, frameRate);
      displayStreamOnCanvas(video3Track, 'Gamma', streamEmit3, 4);
      currentVTrackNo = 1;
      break;

    default:
      currentVTrackNo = 1;
      break;
  }
}

function InitializeStreams(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
  remoteVideo1.srcObject = dummyStream.clone();
  remoteVideo2.srcObject = dummyStream.clone();
  remoteVideo3.srcObject = dummyStream.clone();

  localStream.getVideoTracks().forEach(track => {
    localTrack = track;
    console.log("Local track:::", localTrack);
  });

  displayStreamOnCanvas(localTrack, 'Bot', localTrackEmit, 1);
  localCast = true;

  dummyStream.clone().getVideoTracks().forEach(track => {
    video1Track = track
    streamCast1 = true;
  });
  dummyStream.clone().getVideoTracks().forEach(track => {
    video2Track = track
    streamCast2 = true;
  });
  dummyStream.clone().getVideoTracks().forEach(track => {
    video3Track = track
    streamCast3 = true;
  });

  localTrackEmitCanvas = setInterval(() => {
    drawVideoOnMeetingCanvas(localTrack, canvasOptions, 1)
  }, frameRate);

  video1TrackEmit = setInterval(() => {
    drawVideoOnMeetingCanvas(video1Track, canvasOptions, 2)
  }, frameRate);
  displayStreamOnCanvas(video1Track, 'Alpha', streamEmit1, 2);

  video2TrackEmit = setInterval(() => {
    drawVideoOnMeetingCanvas(video2Track, canvasOptions, 3)
  }, frameRate);
  displayStreamOnCanvas(video2Track, 'Beta', streamEmit2, 3);

  video3TrackEmit = setInterval(() => {
    drawVideoOnMeetingCanvas(video3Track, canvasOptions, 4)
  }, frameRate);
  displayStreamOnCanvas(video3Track, 'Gamma', streamEmit3, 4);

}

function drawVideoOnMeetingCanvas(stream, canvasOptions, vIndex) {
  try {
    let imageCapture = new ImageCapture(stream);
    let width = canvasOptions.videoOptions[vIndex - 1].width;
    let height = canvasOptions.videoOptions[vIndex - 1].height;
    let x = canvasOptions.videoOptions[vIndex - 1].x;
    let y = canvasOptions.videoOptions[vIndex - 1].y;
    imageCapture.grabFrame()
      .then((imageBitmap) => {
        canvasOptions.ctx.drawImage(imageBitmap, x, y, width, height);
      })
      .catch(() => {
        canvasOptions.ctx.drawImage(dummyStream.clone().getVideoTracks()[0].canvas, x, y, width, height);
      })
  } catch (e) {
    let imageCapture = new ImageCapture(dummyStream.clone().getVideoTracks()[0]);
    let width = canvasOptions.videoOptions[vIndex - 1].width;
    let height = canvasOptions.videoOptions[vIndex - 1].height;
    let x = canvasOptions.videoOptions[vIndex - 1].x;
    let y = canvasOptions.videoOptions[vIndex - 1].y;
    imageCapture.grabFrame()
      .then((imageBitmap) => {
        canvasOptions.ctx.drawImage(imageBitmap, x, y, width, height);
      })
      .catch(() => {
        canvasOptions.ctx.drawImage(dummyStream.clone().getVideoTracks()[0].canvas, x, y, width, height);
      })
  }
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

// ############## Displaying Local Camera Source on canvas
function displayStreamOnCanvas(stream, canvasName, trackEmit, trackNumber) {
  var canvas = document.getElementById(canvasName);
  var ctx = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;

  let canvasOptions = {
    'name': canvasName,
    'height': canvas.height,
    'width': canvas.width,
    'canvas': canvas,
    'ctx': ctx,
    'videoOptions': [{
      'x': 0,
      'y': 0,
      'width': width,
      'height': height
    }]
  }

  switch (trackNumber) {
    case 1:
      clearInterval(localTrackEmit)
      localTrackEmit = setInterval(() => {
        drawVideoOnMeetingCanvas(stream, canvasOptions, 1);
      }, frameRate);

      if (isStreamCast) {
        clearInterval(localCanvasEmit);
        localCanvasEmit = setInterval(() => {
          sendStream(stream, canvasOptions, 1);
        }, frameRate);
      } else {

        clearInterval(localCanvasEmit);
      }

      break;
    case 2:
      clearInterval(streamEmit1)
      streamEmit1 = setInterval(() => {
        drawVideoOnMeetingCanvas(stream, canvasOptions, 1);
      }, frameRate);
      if (isStreamCast) {
        clearInterval(streamCanvasEmit1);
        streamCanvasEmit1 = setInterval(() => {
          sendStream(stream, canvasOptions, 2);
        }, frameRate);
      } else {

        clearInterval(streamCanvasEmit1);
      }

      break;
    case 3:
      clearInterval(streamEmit2)
      streamEmit2 = setInterval(() => {
        drawVideoOnMeetingCanvas(stream, canvasOptions, 1);
      }, frameRate);

      if (isStreamCast) {
        clearInterval(streamCanvasEmit2);
        streamCanvasEmit2 = setInterval(() => {
          sendStream(stream, canvasOptions, 3);
        }, frameRate);
      } else {
        clearInterval(streamCanvasEmit2);

      }
      case 4:
        clearInterval(streamEmit3)
        streamEmit3 = setInterval(() => {
          drawVideoOnMeetingCanvas(stream, canvasOptions, 1);
        }, frameRate);

        if (isStreamCast) {
          clearInterval(streamCanvasEmit3);
          streamCanvasEmit3 = setInterval(() => {
            sendStream(stream, canvasOptions, 4);
          }, frameRate);
        } else {
          clearInterval(streamCanvasEmit3);

        }
        break;


      default:
        break;

  }

}

function sendMeetingCanvas() {
  const canvas = document.getElementById('meetingCanvas');
  const ctx = canvas.getContext('2d');
  var frame = ctx.getImageData(0, 0, meetingCanvas.width, meetingCanvas.height);
  streamSocket.emit('video frames', {
    'id': 'meetingCanvas'.concat(meetingCanvas.width),
    'channelName': 'meetingCanvas'.concat(meetingCanvas.width),
    'height': meetingCanvas.height,
    'width': meetingCanvas.width,
    'frameRate': frameRate,
    'data': frame.data
  });
}

function sendStream(stream, canvasOptions, trackNumber) {
  let imageCapture = new ImageCapture(stream);
  const canvas = canvasOptions.canvas
  const ctx = canvasOptions.ctx
  var frame = ctx.getImageData(0, 0, canvasOptions.width, canvasOptions.height);
  streamSocket.emit('video frames', {
    'id': (canvasOptions.name).concat(canvasOptions.width),
    'channelName': (canvasOptions.name).concat(canvasOptions.width),
    'height': canvasOptions.height,
    'width': canvasOptions.width,
    'frameRate': frameRate,
    'data': frame.data
  });
}



document.getElementById('frameRate').addEventListener('change', () => {
  frameRate = 1000 / document.getElementById('frameRate').value
  clearInterval(localTrackEmit)
  clearInterval(video1TrackEmit)
  clearInterval(video2TrackEmit)
  clearInterval(video3TrackEmit)
  clearInterval(localTrackEmit)
  clearInterval(streamEmit1)
  clearInterval(streamEmit2)
  clearInterval(streamEmit3)

  localTrackEmitCanvas = setInterval(() => {
    drawVideoOnMeetingCanvas(localTrack, canvasOptions, 1)
  }, frameRate);
  displayStreamOnCanvas(localTrack, 'Bot', localTrackEmit, 1);

  video1TrackEmit = setInterval(() => {
    drawVideoOnMeetingCanvas(video1Track, canvasOptions, 2)
  }, frameRate);
  displayStreamOnCanvas(video1Track, 'Alpha', streamEmit1, 2);

  video2TrackEmit = setInterval(() => {
    drawVideoOnMeetingCanvas(video2Track, canvasOptions, 3)
  }, frameRate);
  displayStreamOnCanvas(video2Track, 'Beta', streamEmit2, 3);

  video3TrackEmit = setInterval(() => {
    drawVideoOnMeetingCanvas(video3Track, canvasOptions, 4)
  }, frameRate);
  displayStreamOnCanvas(video3Track, 'Gamma', streamEmit3, 4);
  // console.log(frameRate);

  if (parseInt(document.getElementById('meetingCanvasBroadcast').value)) {
    clearInterval(emitCanvas)
    emitCanvas = setInterval(sendMeetingCanvas, frameRate)
  } else {
    clearInterval(emitCanvas)
  }
})

document.getElementById('videoResolution').addEventListener("change", () => {
  width = document.getElementById('videoResolution').value
  height = (width * 2) / 3;
  clearInterval(localTrackEmit)
  clearInterval(streamEmit1)
  clearInterval(streamEmit2)
  clearInterval(streamEmit3)
  displayStreamOnCanvas(localTrack, 'Bot', localTrackEmit, 1);
  displayStreamOnCanvas(video1Track, 'Alpha', streamEmit1, 2);
  displayStreamOnCanvas(video2Track, 'Beta', streamEmit2, 3);
  displayStreamOnCanvas(video3Track, 'Gamma', streamEmit3, 4);
});

document.getElementById('meetingCanvasBroadcast').addEventListener('change', () => {

  if (parseInt(document.getElementById('meetingCanvasBroadcast').value)) {
    streamSocket = io("ws://localhost:80");
    clearInterval(emitCanvas)
    emitCanvas = setInterval(sendMeetingCanvas, frameRate)
  } else {
    clearInterval(emitCanvas)
  }
})

document.getElementById('StreamsBroadcast').addEventListener('change', () => {
  if (parseInt(document.getElementById('StreamsBroadcast').value)) {
    streamSocket = io("ws://localhost:80");
    isStreamCast = true;
    displayStreamOnCanvas(localTrack, 'Bot', localTrackEmit, 1);
    displayStreamOnCanvas(video1Track, 'Alpha', streamEmit1, 2);
    displayStreamOnCanvas(video2Track, 'Beta', streamEmit2, 3);
    displayStreamOnCanvas(video3Track, 'Gamma', streamEmit3, 4);
  } else {
    isStreamCast = false;
    clearInterval(localCanvasEmit)
    clearInterval(streamCanvasEmit1)
    clearInterval(streamCanvasEmit2)
    clearInterval(streamCanvasEmit3)
  }
})

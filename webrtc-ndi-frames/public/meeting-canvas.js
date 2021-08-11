'use strict';

//Defining some global utility variables
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var isBroadcaster =false;
var localStream;
var pc;
var remoteStream;
var turnReady;

var meetingCanvas = document.getElementById('meetingCanvas');
var meetingCtx = meetingCanvas.getContext('2d');
var localStreamTrack, localStreamEmit, localStream;
var video1Track, video2Track, video3Track;
var video1TrackEmit, video2TrackEmit, video3TrackEmit, emitCanvas;
var currentVTrackNo = 1;
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

//Set local stream constraints
var localStreamConstraints = {
  audio: false,
  video: true
};

//Initialize turn/stun server here
//turnconfig will be defined in public/js/config.js
var pcConfig = turnConfig;

// Prompting for room name:
var room = prompt('Enter Room name:');

//Ask server to add in the room if room name is provided by the user
if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or join room', room);
}

// GET Local Video Source and add it to Meeting Canvas
navigator.mediaDevices.getUserMedia(localStreamConstraints)
.then((stream) => {
  console.log('Adding local stream.');
  localStream = stream
  localStreamTrack = stream.getVideoTracks()[0];
  localStreamEmit = setInterval(() => {
    drawVideoOnMeetingCanvas(localStreamTrack, canvasOptions, 1)
  }, frameRate);

  sendMessage('got user media', room);
  if (isInitiator) {
    maybeStart();
  }

  localStream.clone().getVideoTracks().forEach(track => {
    video1Track = track
  });
  localStream.clone().getVideoTracks().forEach(track => {
    video2Track = track
  });
  localStream.clone().getVideoTracks().forEach(track => {
    video3Track = track
  });
})
.catch(function(e) {
  alert('getUserMedia() error: ' + e.name);
});

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

//Function to send message in a room
function sendMessage(message, room) {
  console.log('Client sending message: ', message, room);
  socket.emit('message', message, room);
}

//Sending bye if user closes the window
window.onbeforeunload = function() {
  sendMessage('bye', room);
};


//If initiator, create the peer connection
function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      doCall();
    }
  }
}


//Creating peer connection
function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}


function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

//Function to create offer
function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

//Function to create answer for the received offer
function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

//Function to set description of local media
function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription, room);
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

//Function to play remote stream as soon as this client receives it
function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteStream = event.stream;
  switch (currentVTrackNo) {
    case 1:
      remoteStream.getVideoTracks().forEach(track => {
      video1Track = track
      });
      clearInterval(video1TrackEmit);
      video1TrackEmit = setInterval(() => {
        drawVideoOnMeetingCanvas(video1Track, canvasOptions, 2)
      }, frameRate);
      break;
    case 2:
      remoteStream.getVideoTracks().forEach(track => {
        video2Track = track
      });
      clearInterval(video2TrackEmit);
      video2TrackEmit = setInterval(() => {
        drawVideoOnMeetingCanvas(video2Track, canvasOptions, 3)
      }, frameRate);
      break;
    case 3:
      remoteStream.getVideoTracks().forEach(track => {
        video3Track = track
      });
      clearInterval(video3TrackEmit);
      video3TrackEmit = setInterval(() => {
        drawVideoOnMeetingCanvas(video3Track, canvasOptions, 4)
      }, frameRate);
      break;
  
    default:
      currentVTrackNo=1;
      break;
  }
  currentVTrackNo++;
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye',room);
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}

// ########################   Event Listeners   ##################################
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

  if (parseInt(document.getElementById('meetingCanvasBroadcast').value)) {
    emitCanvas = setInterval(sendMeetingCanvas, frameRate)
  }
  // console.log(frameRate);
})


document.getElementById('meetingCanvasBroadcast').addEventListener('change', () => {
  if (parseInt(document.getElementById('meetingCanvasBroadcast').value)) {
    emitCanvas = setInterval(sendMeetingCanvas, frameRate)
  } else {
    clearInterval(emitCanvas)
  }
})

window.addEventListener('load', drawGrid);
// ####################### End Event Listener ####################################



//#######################    Defining socket events   ##############################
//Event - Client has created the room i.e. is the first member of the room
socket.on('created', function(room) {
  console.log('Created room ' + room);
  isInitiator = true;
});

//Event - Room is full
socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
});

//Event - Another client tries to join room
socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});

//Event - Client has joined the room
socket.on('joined', function(room) {
  console.log('joined: ' + room);
  isChannelReady = true;
});

//Event - server asks to log a message
socket.on('log', function(array) {
  console.log.apply(console, array);
});


//Event - for sending meta for establishing a direct connection using WebRTC The Driver code
socket.on('message', function(message, room) {
    console.log('Client received message:', message,  room);
    if (message === 'got user media') {
      maybeStart();
    } else if (message.type === 'offer') {
      if (!isInitiator && !isStarted) {
        maybeStart();
      }
      pc.setRemoteDescription(new RTCSessionDescription(message));
      doAnswer();
    } else if (message.type === 'answer' && isStarted) {
      pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'candidate' && isStarted) {
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: message.label,
        candidate: message.candidate
      });
      pc.addIceCandidate(candidate);
    } else if (message === 'bye' && isStarted) {
      handleRemoteHangup();
    }
});
//####################### End Defining socket events ################################

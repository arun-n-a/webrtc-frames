'use strict';



//Defining some global utility variables
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var recordedStream = new MediaStream();
var turnReady;

//Initialize turn/stun server here
//turnconfig will be defined in public/js/config.js
var pcConfig = turnConfig;

//Set local stream constraints
var localStreamConstraints = {
    audio: false,
    video: true
  };

// Prompting for room name:
var room = prompt('Enter your username:');

//Initializing socket.io
var socket = io.connect();

//Ask server to add in the room if room name is provided by the user
if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);
}

//Defining socket events

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


//Event - for sending meta for establishing a direct connection using WebRTC
//The Driver code
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


var testFrame ;
// Event - for receving I420Frame data
socket.on('i420Frame', function (rgbaFrame, room) {
  // console.log("Frame Received::::" , rgbaFrame);
  // testFrame = new ImageData(rgbaFrame.data, 640, 480);

  handlecanvas2(rgbaFrame)
})


socket.on('broadcaster', function (data) {
  // console.log("Frame Received::::" , rgbaFrame);
  // testFrame = new ImageData(rgbaFrame.data, 640, 480);

  handlecanvas1(data)
})


//Function to send message in a room
function sendMessage(message, room) {
  console.log('Client sending message: ', message, room);
  socket.emit('message', message, room);
}




//Displaying Local Stream and Remote Stream on webpage
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');
// var recordedVideo1 = document.querySelector('#recordedVideo1');
// var recordedVideo2 = document.querySelector('#recordedVideo2');
var recordedVideo3 = document.querySelector('#recordedVideo3');


console.log("Going to find Local media");
navigator.mediaDevices.getUserMedia(localStreamConstraints)
.then(gotStream)
.catch(function(e) {
  alert('getUserMedia() error: ' + e.name);
});

//If found local stream
function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;

  console.log("Local Stream Tracks", localStream.getTracks());
  localStream.getTracks().forEach(track => {
    console.log("Local track:::", track);
    recordedStream.addTrack(track)
  });
  localStream.clone().getTracks().forEach(track => {
    console.log("Local track:::", track);
    recordedStream.addTrack(track)
  });
  console.log("Recorded Stream ::::", recordedStream.getTracks());
  // recordedVideo1.srcObject = recordedStream
  // recordedVideo2.srcObject = recordedStream
  recordedVideo3.srcObject = recordedStream

  sendMessage('got user media', room);
  if (isInitiator) {
    maybeStart();
  }
}


console.log('Getting user media with constraints', localStreamConstraints);

//If initiator, create the peer connection
function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    pc.addStream(localStream);
    // pc.addStream(recordedStream)
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      doCall();
    }
  }
}

//Sending bye if user closes the window
window.onbeforeunload = function() {
  sendMessage('bye', room);
};


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

//Function to handle Ice candidates generated by the browser
function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    }, room);
  } else {
    console.log('End of candidates.');
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
  remoteVideo.srcObject = remoteStream;
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


var canvas = document.getElementById('test');
var ctx = canvas.getContext('2d');
var canvasWidth = canvas.width
var canvasHeight = canvas.height
var canvas2 = document.getElementById('test2');
var ctx2 = canvas2.getContext('2d');
// recordedVideo1.addEventListener('play',function () {
//   (function loop() {

//     if (!recordedVideo1.paused || !recordedVideo1.ended) {
//       ctx.drawImage(recordedVideo1, 0,15, 480, 240);
//       setTimeout(loop, 1000 / 30); // drawing at 30fps
//   }
// })();
// },0);

// recordedVideo2.addEventListener('play',function () {
//   (function loop() {

//     if (!recordedVideo2.paused || !recordedVideo2.ended) {
//       ctx.drawImage(recordedVideo2, 370, 15, 480, 240);
//       setTimeout(loop, 1000 / 30); // drawing at 30fps
//   }
// })();
// },0);






var imageCapture , rgbaFrame;
var pixels8BitsRGBA , pixels8BitsARGB, pixelsAs32Bits, pixelCount, pixelsARGBPacked;

recordedVideo3.addEventListener('play',function () {
  imageCapture = new ImageCapture(recordedStream.getVideoTracks()[0]);

  (function loop() {
    if (!recordedVideo3.paused || !recordedVideo3.ended) {
      imageCapture.grabFrame()
      .then(function (imageBitmap) {
        ctx.drawImage(imageBitmap, 0, 0, 480, 360);
        // pixels8BitsRGBA = ctx.getImageData(0, 0, 480, 360).data
        // pixelCount = pixels8BitsRGBA.length / 4;
        // pixelsARGBPacked = new Array(2 + pixelCount);
        // pixelsARGBPacked[0] = 480;
        // pixelsARGBPacked[1] = 360;

        // for(var i = 0 ; i < pixelCount ; i++) {
        //   pixelsARGBPacked[i+2] = parseInt(
        //         pixels8BitsRGBA[i * 4 + 3].toString(16)
        //       + pixels8BitsRGBA[i * 4    ].toString(16)
        //       + pixels8BitsRGBA[i * 4 + 1].toString(16)
        //       + pixels8BitsRGBA[i * 4 + 2].toString(16)
        //   , 16);
        // }
        if (imageBitmap !== null || imageBitmap !== undefined){
          // console.log("Before sending",canvas.toDataURL());
          socket.emit('libyuv', canvas.toDataURL(), room)
        }


      })

      setTimeout(loop, 1000 / 24); // drawing at 25fps

  }})();
},0);

var pixCount, receivedFrame, receivedImageData;

function handlecanvas2(ImageFrame) {
  pixCount = (ImageFrame.width * ImageFrame.height *4)
  receivedFrame = new Uint8ClampedArray(pixCount);
  for( var i = 0; i < pixCount;i+=4){
    receivedFrame[i+0]=ImageFrame.data[i+0]
    receivedFrame[i+1]=ImageFrame.data[i+1]
    receivedFrame[i+2]=ImageFrame.data[i+2]
    receivedFrame[i+3]=ImageFrame.data[i+3]

  }
  console.log( ImageFrame.width , ImageFrame.height);
  receivedImageData = new ImageData(receivedFrame, ImageFrame.width , ImageFrame.height);
  ctx2.putImageData(receivedImageData, 0,0)
}

function handlecanvas1(ImageBitmap) {
  // console.log("Received:: ",ImageBitmap);
  ctx2.drawImage(ImageBitmap, 0, 0);
  // image.src = ImageBitmap;
}


var image = new Image();
image.onload = function() {
  ctx2.drawImage(image, 0, 0);
};

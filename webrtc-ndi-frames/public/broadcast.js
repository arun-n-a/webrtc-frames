const peerConnections = {};
const config = turnConfig;

const socket = io.connect(window.location.origin);

socket.on("answer", (id, description) => {
  peerConnections[id].setRemoteDescription(description);
});

socket.on("watcher", id => {
  const peerConnection = new RTCPeerConnection(config);
  peerConnections[id] = peerConnection;

  let stream = videoElement.srcObject;
  stream.getVideoTracks().forEach(track => peerConnection.addTrack(track, stream));

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };

  peerConnection
    .createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("offer", id, peerConnection.localDescription);
    });
});

socket.on("candidate", (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", id => {
  peerConnections[id].close();
  delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
};

// Get camera and microphone
const videoElement = document.querySelector("video");
const audioSelect = document.querySelector("select#audioSource");
const videoSelect = document.querySelector("select#videoSource");

audioSelect.onchange = getStream;
videoSelect.onchange = getStream;

getStream()
  .then(getDevices)
  .then(gotDevices);

function getDevices() {
  return navigator.mediaDevices.enumerateDevices();
}

function gotDevices(deviceInfos) {
  window.deviceInfos = deviceInfos;
  for (const deviceInfo of deviceInfos) {
    const option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === "audioinput") {
      option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
      audioSelect.appendChild(option);
    } else if (deviceInfo.kind === "videoinput") {
      option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    }
  }
}

function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const audioSource = audioSelect.value;
  const videoSource = videoSelect.value;
  const constraints = {
    audio: {
      deviceId: audioSource ? {
        exact: audioSource
      } : undefined,

    },
    video: {
      deviceId: videoSource ? {
        exact: videoSource
      } : undefined,
      width: {
        min: 960,
        max: 1920
      },
      height: {
        min: 540,
        max: 1080
      },
      frameRate: {
        min: 16,
        max: 30
      }
    }
  };
  return navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .catch(handleError);
}

function gotStream(stream) {
  window.stream = stream;
  audioSelect.selectedIndex = [...audioSelect.options].findIndex(
    option => option.text === stream.getAudioTracks()[0].label
  );
  videoSelect.selectedIndex = [...videoSelect.options].findIndex(
    option => option.text === stream.getVideoTracks()[0].label
  );
  videoElement.srcObject = stream;
  // videoElement.muted = false;
  socket.emit("broadcaster");
}

function handleError(error) {
  console.error("Error: ", error);
}

// 
// function record() {
//   initializeMainAudio()
//   var audioCtx = new AudioContext();
//   var source = audioCtx.createMediaStreamSource(window.stream);
//   var audio_frame = new Float32Array(128)
//   var customAudioProcessor;
//   audioCtx.audioWorklet.addModule("/static/custom_audio_processor.js")
//     .then(() => {
//       customAudioProcessor = new AudioWorkletNode(audioCtx, "custom-audio-processor");
//       source.connect(customAudioProcessor);
//       // customAudioProcessor.connect(audioCtx.destination);
//       customAudioProcessor.port.onmessage = event => {
//         if (event.data.audio_left && event.data.audio_right) {
//           // console.log("message from browser Audio :::: ", event.data.audio_left[0], event.data.audio_right[0]);
//           // audio_frame.set(event.data.audio_left)
//           // mainAudioProcessor.port.postMessage({
//           //   audio_left: event.data.audio_left,
//           //   audio_right: event.data.audio_right
//           // });
//           // playSound([event.data.audio_left, event.data.audio_right])
//           // audio_frame.set(event.data.audio_right, event.data.audio_left.length)
//         }
//
//         if (event.data.input && event.data.output) {
//           mainAudioProcessor.port.postMessage({
//             input: event.data.input,
//             output: event.data.ouput
//           });
//         }
//       }
//       // customAudioProcessor.port.postMessage({
//       //   flag: true
//       // })
//     })
//   // setInterval(() => {
//   //   // var data = [0.1012118509039282799,-0.1012118509039282799]
//   //   // var audio_frame_demo = Float32Array.from(data)
//   //   // audio_frame = audio_frame_demo
//   //   // console.log({
//   //   //   id: 'a001',
//   //   //   type: 'audio',
//   //   //   channelName: 'test',
//   //   //   sampleRate: audioCtx.sampleRate,
//   //   //   noOfChannels: 1,
//   //   //   noOfSamples: '512',
//   //   //   channelStride: '512',
//   //   //   data: new Int8Array(audio_frame.buffer).buffer //Float32Array
//   //   // });
//   //   // socket.emit('audio frames', {
//   //   //   id: 'a001',
//   //   //   type: 'audio',
//   //   //   channelName: 'test',
//   //   //   sampleRate: audioCtx.sampleRate,
//   //   //   noOfChannels: 1,
//   //   //   noOfSamples: '512',
//   //   //   channelStride: '512',
//   //   //   data: new Int8Array(audio_frame.buffer).buffer //Float32Array
//   //   // });
//   //   customAudioProcessor.port.postMessage({
//   //     flag: true
//   //   })
//   // });
// };
//

var audioCtx, channels, frameCount, myAudioBuffer, source, mainAudioProcessor;

function initializeMainAudio() {
  let blackSilence = () => new MediaStream([black(), silence()]);
  var dummyStream = blackSilence();

  audioCtx = new(window.AudioContext || window.webkitAudioContext)();
  channels = 2;
  frameCount = audioCtx.sampleRate * 2.0;
  myAudioBuffer = audioCtx.createBuffer(channels, frameCount, audioCtx.sampleRate);
  console.log("myAudioBuffer:::::", channels, frameCount, audioCtx.sampleRate);
  source = audioCtx.createMediaStreamSource(dummyStream);
  console.log("source:::::::", source);
  audioCtx.audioWorklet.addModule("/static/main_audio_processor.js")
    .then(() => {
      mainAudioProcessor = new AudioWorkletNode(audioCtx, "main-audio-processor");
      source.connect(mainAudioProcessor);
      mainAudioProcessor.connect(audioCtx.destination);
    })

}


function playSound(channelData) {
  // console.log(channelData);
  mainAudioProcessor.port.postMessage({
    audio_left: channelData[0],
    audio_right: channelData[1]
  });
}

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
  width = 300,
  height = 200
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

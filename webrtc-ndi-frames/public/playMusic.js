// const myMusic = document.querySelector('audio');
// var frameInterval ;
// const audioFramesArray = [];
// document.getElementById('playButton').addEventListener('click', () => {
//     const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//     const analyser = audioContext.createAnalyser();
//     const times = new Uint8Array(analyser.frequencyBinCount);
//     analyser.getByteTimeDomainData(times);

//     var myMusicSource = audioContext.createMediaElementSource(myMusic);
//     myMusicSource.connect(analyser);
//     analyser.connect(audioContext.destination);
//     myMusic.play();
    
    
//     frameInterval = setInterval(()=>{
//         analyser.getByteTimeDomainData(times);
//         audioFramesArray.push(times)
//         console.log(times);
//     }, 1000/audioContext.sampleRate)

// });

// myMusic.addEventListener("ended", function(){
//     myMusic.currentTime = 0;
//     clearInterval(frameInterval);
//     console.log("ended");
//     console.log(audioFramesArray.length);
// });

var socket = io();

var source , dataArray, analyser;
function getData(){
    var audioContext =  new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    var bufferLength = analyser.frequencyBinCount;
    dataArray = new Float32Array(bufferLength);
    if (navigator.mediaDevices) {
        console.log('getUserMedia supported.');
        navigator.mediaDevices.getUserMedia ({audio: true, video: false
        }).then(function(stream) {
            source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser)

        }).catch(function(err) {
            console.log('The following gUM error occurred: ' + err);
        });;
    } else {
        console.log('getUserMedia not supported on your browser!');
     }
     

    // var myRequest = new Request('static/file_example_WAV_1MG.wav')

    // fetch(myRequest).then(function(response){
    //     return response.arrayBuffer();
    // }).then(function(buffer){
    //     audioContext.decodeAudioData(buffer, function(decodedData){
    //         source.buffer = decodedData;
    //         source.connect(audioContext.destination);
    //         // var aud = emitAudio(source.buffer.getChannelData(1));
    //         var aud = new Float32Array(2);
    //         aud[0] = (0.0007975610205903649);
    //         aud[1] = (-0.0007781385211274028);


    //         console.log("Send::::", aud);
            
    //         socket.emit('audio_buffer', aud.buffer);
        


    //     })
    // })
};


document.getElementById('playButton').addEventListener('click',()=>{

    getData();
    document.getElementById('playButton').setAttribute('disabled','disabled');
    setInterval(emit,100)
    // emit16BitFlpData();
/* <source src="static/file_example_WAV_1MG.wav" type="audio/wav"> */

})

function emit16BitFlpData(channelData) {
    const PCM16iSamples = [];

    for (let i = 0; i < channelData.length; i++)
    {
    let val = Math.floor(32767 * channelData[i]);
    val = Math.min(32767, val);
    val = Math.max(-32768, val);
    
    PCM16iSamples.push(val);
    }
    return PCM16iSamples;
}


function emit() {
    analyser.getFloatTimeDomainData(dataArray);
    console.log(dataArray);
    socket.emit('audio_buffer', dataArray.buffer);
}

socket.on('client_aud_buf', function (data) {
    var x = new Float32Array(data)
    console.log("Received from Node App:::", x);
    console.log(x.BYTES_PER_ELEMENT); 
    console.log(x.length); 

})







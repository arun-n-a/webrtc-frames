
document.getElementById('cnvplayButton').addEventListener('click', () => {
    console.log(audioFramesArray.length);
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    var bitCount = 0;
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 1, audioContext.sampleRate);
    const channelData = buffer.getChannelData(0);

    audioFramesArray.forEach(audio_frame => {
        getBuffer(audio_frame);
    });
   
    playAudio();

    function getBuffer(audio_frame) {
        const uint8Frame = new Uint8Array(audio_frame)
        const fl32Frame = Float32Array.from(uint8Frame)
        console.log("buffe length", buffer.length);
    
        for (let i = 0; ((i < (buffer.length - bitCount)) && (i < audio_frame.length)); i++) {
            channelData[bitCount] = parseInt(fl32Frame[i]);
            bitCount++;
            // channelData[i] = Math.random() * 2 -1;
            console.log(bitCount);
        }
        return buffer
    
    }


    function playAudio() {
        const someAudioSource = audioContext.createBufferSource();
        someAudioSource.buffer = buffer;
        someAudioSource.connect(audioContext.destination);
        someAudioSource.start()
    
    }

});





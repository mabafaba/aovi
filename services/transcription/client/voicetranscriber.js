console.log('voice-transcriber.js loaded');
class LiveTranscription extends HTMLElement {

    constructor() {
        super();
        this.vad = null;
        this.audioContext = null;
        this.stream = null;
        this.recording = false;
        this.audioChunks = [];
        this.mediaRecorder = null;
        this.audioBlob = null;
        this.transcriptionContainer = null;
        this.recordingStartTime = 0;
        this.transcriptionCounter = 0;
    }

    connectedCallback() {
        console.log('connected voice-transcriber');   
        this.render();
        this.addEventListeners();
    }

    render() {
        this.innerHTML = `
            <button id="toggleTranscription">Start Transcription</button>
            <select id="languageSelect">
                <option value="en">English</option>
                <option value="de">German</option>
                <option value="fr">French</option>
                <option value="pt">Portuguese</option>
            </select>
            <div id="transcriptionContainer"></div>
            <style>
                #toggleTranscription.recording {
                    animation: pulse 1s infinite;
                }

                @keyframes pulse {
                    0% {
                        transform: scale(1);
                        background-color: red;
                    }
                    50% {
                        transform: scale(1.1);
                        background-color: darkred;
                    }
                    100% {
                        transform: scale(1);
                        background-color: red;
                    }
                }

                .transcriptionLoading::after {
                    content: '...';
                    display: inline-block;
                    animation: ellipsis 1.5s infinite;
                }

                @keyframes ellipsis {
                    0% {
                        content: '...';
                    }
                    33% {
                        content: '.';
                    }
                    66% {
                        content: '..';
                    }
                    100% {
                        content: '...';
                    }
                }
            </style>
        `;
        this.transcriptionContainer = this.querySelector('#transcriptionContainer');
    }

    addEventListeners() {
        this.querySelector('#toggleTranscription')?.addEventListener('click', this.toggleTranscription.bind(this));
    }

    toggleTranscription() {
        console.log('toggleTranscription');
        if (this.recording) {
            this.stopListening();
        } else {
            this.startListening();
            this.startRecording();
        }
    }

    startListening() {
        console.log('startListening');
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                this.audioContext = new AudioContext();
                const source = this.audioContext.createMediaStreamSource(stream);
                this.stream = stream;
                this.vad = new VAD({
                    source: source,
                    voice_start: () => {
                        
                        const timeSinceRecordingStart = Date.now() - this.recordingStartTime;
                        if (timeSinceRecordingStart === 0) {
                            this.timeSinceRecordingStart = Date.now();
                            this.startRecording();
                            console.log('voice_start - effectiive');
                            return;
                        }
                        console.log('voice_start - ineffective');
                        
                    },
                    voice_stop: () => {
                        const timeSinceRecordingStart = Date.now() - this.recordingStartTime;
                        if (timeSinceRecordingStart > 1000 * 2) {
                            this.recordingStartTime = 0;
                            this.stopRecording();
                            this.startRecording();
                            console.log('voice_stop - effective');
                            return;
                        }
                        console.log('voice_stop - ineffective');
                        
                    }
                });
                this.recording = true;
                this.querySelector('#toggleTranscription').textContent = 'Stop Transcription';
                // set class for transcription button
                this.querySelector('#toggleTranscription').classList.add('recording');

            });
    }

    stopListening() {
        console.log('stopListening');
        if (this.vad) {
            this.vad.destroy();
            this.vad = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.recording = false;
        this.querySelector('#toggleTranscription').textContent = 'Start Transcription';
        this.querySelector('#toggleTranscription').classList.remove('recording');

        this.stopRecording();
    }

    startRecording() {
        console.log('startRecording');
        this.recordingStartTime = Date.now();
        this.audioChunks = [];
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                this.mediaRecorder = new MediaRecorder(stream);
                this.mediaRecorder.ondataavailable = event => {
                    this.audioChunks.push(event.data);
                };
                this.mediaRecorder.onstop = () => {
                    this.audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                    this.transcribeAudioBlob(this.audioBlob);
                    // reset audioChunks
                    this.audioChunks = [];
                };
                this.mediaRecorder.start();
            });
    }

    stopRecording() {
        console.log('stopRecording');
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
        }
    }

    async transcribeAudioBlob(audioBlob) {

        const transcriptionDiv = document.createElement('div');
        transcriptionDiv.innerText = "";
        transcriptionDiv.id = `transcription-${this.transcriptionCounter}`;
        this.transcriptionCounter++;
        transcriptionDiv.classList.add('transcription');
        transcriptionDiv.classList.add('transcriptionLoading');
        this.transcriptionContainer?.prepend(transcriptionDiv);


        const language = this.querySelector('#languageSelect').value;       
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');
        formData.append('language', language);

        const transcriptionStartTimestamp = Date.now();

        const response = await fetch('/aovi/transcription', {
            method: 'POST',
            body: formData
        });



        // in seconds
        console.log('transcription took', (Date.now() - transcriptionStartTimestamp) / 1000, 's');

        if (response.ok) {
            console.log('...transcribed');
            
            transcriptionDiv.classList.remove('transcriptionLoading');
            transcriptionDiv.innerText = await response.text();
           
        } else {
            console.error('Transcription failed');
        }
    }
}

customElements.define('voice-transcriber', LiveTranscription);

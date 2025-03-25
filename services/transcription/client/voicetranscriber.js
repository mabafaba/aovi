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
        this.showButton = true;
        this.showLanguageSelect = true;
    }

    connectedCallback() {
        console.log('connected voice-transcriber');   
        this.render();
        this.addEventListeners();
        // get show-button attribute
        if (this.getAttribute('show-button') === 'false') {
            this.showButton = false;
        } else {
            this.showButton = true;
        }
        // get show-language-select attribute
        if (this.getAttribute('show-language-select') === 'false') {
            this.showLanguageSelect = false;
        } else {
            this.showLanguageSelect = true;
        }
        if (!this.showButton) {
            this.querySelector('#toggleTranscription').style.display = 'none';
        }
        if (!this.showLanguageSelect) {
            this.querySelector('#languageSelect').style.display = 'none';
        }
    }

    render() {
        this.innerHTML = `
            <link rel="stylesheet" href="https://unpkg.com/sakura.css/css/sakura.css">
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
        this.querySelector('#toggleTranscription')?.addEventListener('click', this.toggleListening.bind(this));
    }

    toggleListening() {
        if (this.recording) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    async startListening() {
        if(this.recording){
            console.warn('already recording');
            // return rejected promise
            return Promise.reject();
        }
        this.recording = true;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // start recording audio data into audiochunks
            this.recordingStartTime = Date.now();
            this.audioChunks = [];
            this.mediaRecorder = new MediaRecorder(stream);
            this.mediaRecorder.ondataavailable = event => {
                this.audioChunks.push(event.data);
            };
            this.mediaRecorder.onstop = () => {
                console.log('recording stopped, transcribing...');
                this.audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.transcribeAudioBlob(this.audioBlob);
                // reset audioChunks
                this.audioChunks = [];
            };
            this.mediaRecorder.start();

            // listen for pauses in speech to split transcription into chunks
            this.audioContext = new AudioContext();
            const source = this.audioContext.createMediaStreamSource(stream);
            this.stream = stream;
            this.vad = new VAD({
                source: source,
                voice_start: () => {
                    if (this.vad) {
                        const event = new CustomEvent('voiceStart', { detail: { timestamp: Date.now() } });
                        document.dispatchEvent(event);
                    }
                },
                voice_stop: () => {
                    if (this.vad) {
                        const event = new CustomEvent('voiceStop', { detail: { timestamp: Date.now() } });
                        document.dispatchEvent(event);

                        const timeSinceRecordingStart = Date.now() - this.recordingStartTime;
                        if (timeSinceRecordingStart > 1000 * 15) {
                            this.stopListening();
                            this.startListening();
                            console.log('new transcription chunk');
                            return;
                        }
                    }
                }
            });
            this.querySelector('#toggleTranscription').textContent = 'Stop Transcription';
            // set class for transcription button
            this.querySelector('#toggleTranscription').classList.add('recording');
        } catch (error) {
            console.error('Error accessing media devices.', error);
            this.recording = false;
        }
    }

    stopListening() {

        this.recording = false;

        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
        }

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

        this.querySelector('#toggleTranscription').textContent = 'Start Transcription';
        this.querySelector('#toggleTranscription').classList.remove('recording');
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
            const text = await response.text();

            // emit event with transcription
            const event = new CustomEvent('transcription', { detail: {text:text, requestedAt: transcriptionStartTimestamp} });
            document.dispatchEvent(event);

            if(text.length > 0) {
                transcriptionDiv.innerText = text;
            }
            else {
                // remove div
                transcriptionDiv.remove();
            }
            
           
        } else {
            console.error('Transcription failed');
        }
    }
}

customElements.define('voice-transcriber', LiveTranscription);

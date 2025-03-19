class AudioRecorder extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.audioChunks = [];
        this.recording = false;
        this.playing = false;
        this.audio = new Audio();
        this.visualisation = null;
        this.stopRecordingCallback = () => {console.log('onStopRecording not set')};
    }

    onStopRecording(fun) {
        this.stopRecordingCallback = fun;
    }
    
    connectedCallback() {
        this.render();
        this.addEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `\
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
        <i class="fas fa-record-vinyl"></i>
            <style>
            .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            }

            .button-container {
            display: flex;
            gap: 10px;
            }

            button {
            padding: 10px;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            border-radius: 50%;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            width: 50px;
            height: 50px;
            }

            button:hover {
            background-color: lightgray;
            transform: translateY(2px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            #waveformvisualisation {
            width: 100%;
            height: 100px;
            display: none;
            }

            button.recording {
            background-color: red;
            color: white;
            animation: pulsate 1s infinite;
            }

            @keyframes pulsate {
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

            i {
            font-size: 24px;
            }
            button#record {
            background-color: #ff4d4d;
            color: white;
            }

            button#play {
            background-color: #4caf50;
            color: white;
            display: none;
            }

            button#delete {
            background-color: #f44336;
            color: white;
            display: none;
            
            }
            
            </style>
            <div class="container">
            <div class="button-container">
            <button id="record"><i class="fas fa-microphone"></i></button>
            <button id="play" style="display: none;"><i class="fas fa-play"></i></button>
            <button id="delete" style="display: none;"><i class="fas fa-trash"></i></button>
            </div>
            <div id="waveformvisualisation"></div>
            </div>
        `;
    }

    addEventListeners() {
        this.shadowRoot.querySelector('#record').addEventListener('click', this.toggleRecording.bind(this));
        this.shadowRoot.querySelector('#play').addEventListener('click', this.togglePlaying.bind(this));
        this.shadowRoot.querySelector('#delete').addEventListener('click', this.deleteRecording.bind(this));
    }

    toggleRecording() {
        if (this.recording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        this.audioChunks = [];
        this.recording = true;
        this.audioBlob = null;
        this.audio.src = '';
        if (this.visualisation) {
            this.visualisation.destroy();
        }

        this.shadowRoot.querySelector('#record').innerHTML = '<i class="fas fa-stop"></i>';
        this.shadowRoot.querySelector('#play').style.display = 'none';
        this.shadowRoot.querySelector('#delete').style.display = 'none';
        this.shadowRoot.querySelector('#record').classList.add('recording');

        navigator.mediaDevices.getUserMedia({audio: true})
            .then(stream => {
                this.mediaRecorder = new MediaRecorder(stream);
                this.mediaRecorder.ondataavailable = event => {
                    this.audioChunks.push(event.data);
                };
                this.mediaRecorder.onstop = () => {
                    this.audioBlob = new Blob(this.audioChunks, {type: 'audio/wav'});
                    this.audio.src = URL.createObjectURL(this.audioBlob);
                    this.shadowRoot.querySelector('#play').style.display = 'block';
                    // this.shadowRoot.querySelector('#delete').style.display = 'block';
                    this.visualizeWaveform();
                    this.stopRecordingCallback();
                };
                this.mediaRecorder.start();
            });
    }

    stopRecording() {

        this.recording = false;
        this.shadowRoot.querySelector('#record').innerHTML = '<i class="fas fa-microphone"></i>';
        this.shadowRoot.querySelector('#record').classList.remove('recording');
        this.mediaRecorder.stop();

    }

    togglePlaying() {
        if (this.playing) {
            this.pausePlaying();
        } else {
            this.startPlaying();
        }
    }

    startPlaying() {
        this.playing = true;
        this.shadowRoot.querySelector('#play').innerHTML = '<i class="fas fa-pause"></i>';
        this.visualisation.play();
        this.visualisation.on('finish', () => {
            this.playing = false;
            this.shadowRoot.querySelector('#play').innerHTML = '<i class="fas fa-play"></i>';
        });
    }

    pausePlaying() {
        this.playing = false;
        this.shadowRoot.querySelector('#play').innerHTML = '<i class="fas fa-play"></i>';
        this.visualisation.pause();
    }

    deleteRecording() {
        this.audioChunks = [];
        this.audioBlob = null;
        this.audio.src = '';
        if (this.visualisation) {
            this.visualisation.destroy();
        }
        this.shadowRoot.querySelector('#play').style.display = 'none';
        this.shadowRoot.querySelector('#delete').style.display = 'none';
    }

    visualizeWaveform() {
        if (this.visualisation) {
            this.visualisation.destroy();
        }

        this.visualisation = WaveSurfer.create({
            container: this.shadowRoot.querySelector('#waveformvisualisation'),
            waveColor: '#999999',
            progressColor: '#CCCCCC',
            barWidth: 5,
            mediaControls: false
        });

        this.visualisation.loadBlob(this.audioBlob);

        this.visualisation.on('ready', () => {
            this.visualisation.zoom(0);
        });
    }

    getAudioBlob() {
        console.log(this.audioBlob);
        return this.audioBlob;
    }

}

customElements.define('audio-recorder', AudioRecorder);

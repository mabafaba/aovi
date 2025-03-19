class VoiceListener extends HTMLElement {

    constructor() {
        super();
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
                this.audioContext = new AudioContext();
                this.stream = stream;
                const source = this.audioContext.createMediaStreamSource(stream);
            
            }
        }

    connectedCallback() {
        // this.startListening();
    }

    startListening() {
        navigator.mediaDevices.getUserMedia({audio: true})
            .then(stream => {
                const audioContext = new AudioContext();
                const source = audioContext.createMediaStreamSource(stream);
                this.vad = new VAD({
                    source: source,
                    voice_start: () => {
                        console.log('voice start');
                        this.dispatchEvent(new CustomEvent('voiceStart', {composed: true}));
                    },
                    voice_stop: () => {
                        console.log('voice stop');
                        this.dispatchEvent(new CustomEvent('voiceStop', {composed: true}));
                    }
                });
            });
    }

    stopListening() {
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
        }
    }
}

customElements.define('voice-listener', VoiceListener);
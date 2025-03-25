const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const multer = require("multer");


const transcriptionRouter = function(io){
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.use('/static', express.static(path.join(__dirname, 'client')));

router.post('/', upload.single('audio'), (req, res) => {
    console.log('received audio file');
    const audio = req.file;
    const language = req.body.language;
    console.log('language:', language);

    const validLanguages = ['en', 'de', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 'ru', 'zh'];

    if (!audio) {
        return res.status(400).send('No audio file uploaded');
    }

    if (!language) {
        return res.status(400).send('No language specified');
    }
    if (!validLanguages.includes(language)) {
        return res.status(400).send('Invalid language specified');
    }

    console.log("audio file length", audio.size);
    // Process the audio buffer as needed
    console.log('Audio buffer received successfully');

    const form = new FormData();
    form.append('audio_file', audio.buffer, {
        filename: 'audio.wav',
        contentType: 'audio/wav'
    });
    form.append('language', language);

    console.log('Sending transcription request to whisper.unitac-hamburg.com');

    axios.post('https://whisper.unitac-hamburg.com/asr?output=json', form, {
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
        headers: {
            ...form.getHeaders()
        }
    })
    .then(response => {
        console.log('Transcription response:', response.data);
        res.send(response.data.text);
    })
    .catch(error => {
        console.error('Error during transcription:', error);
        res.status(500).send('Error during transcription');
    });
});

var speakers = []; // {id: 'socket.id', name: 'name'}
var managerSocketIds = [];

io.on('connection', (socket) => {

    socket.on('transcription: speaker connected', (data) => {
        // broadcast to all connected managers
        console.log('Speaker connected:', data.id);
        speakers.push({id:data.id, name: data.name});
        // broadcast to all connected managers
        managerSocketIds.forEach(managerSocketId => {
            console.log('Emitting speaker connected to manager:', managerSocketId);
            io.to(managerSocketId).emit('transcription: speaker connected', data);
        });
    });


    socket.on('transcription: manager connected', (data) => {
        console.log('Manager connected:', data.id);
        managerSocketIds.push(data.id);

        // send all connected speakers to the manager
        speakers.forEach(speaker => {
            io.to(data.id).emit('transcription: speaker connected', speaker);
        });
    });



    socket.on('transcription: speaker started speaking', (data) => {
        console.log('Speaker started speaking:', data.id);
        managerSocketIds.forEach(managerSocketId => {
            io.to(managerSocketId).emit('transcription: speaker started speaking', data);
        });
    });

    socket.on('transcription: speaker stopped speaking', (data) => {
        console.log('Speaker stopped speaking:', data.id);
        managerSocketIds.forEach(managerSocketId => {
            io.to(managerSocketId).emit('transcription: speaker stopped speaking', data);
        });
    });

    socket.on('transcription: speaker name changed', (data) => {
        console.log('Speaker name changed:', socket.id, data.name);
        // update speaker name in list
        const speaker = speakers.find(speaker => speaker.id === socket.id);
        if (speaker) {
            speaker.name = data.name;
        }
        // broadcast to all connected managers
        managerSocketIds.forEach(managerSocketId => {
            console.log('Emitting speaker name changed to manager:', managerSocketId);
            io.to(managerSocketId).emit('transcription: speaker name changed', {id: socket.id, name: data.name});
        });
    });

    socket.on('disconnect', () => {
        // remove speaker from list
        console.log('someone disconnected', socket.id);
        const index = speakers.findIndex(speaker => speaker.id === socket.id);
        if (index > -1) {
            console.log('speaker disconnected:', socket.id);
            speakers.splice(index, 1);
            // let all managers know that this speaker has disconnected
            managerSocketIds.forEach(managerSocketId => {
                console.log('Emitting speaker disconnected to manager:', managerSocketId);
                io.to(managerSocketId).emit('transcription: speaker disconnected', {id: socket.id});
            });
        }
        // remove manager from list
        const managerIndex = managerSocketIds.indexOf(socket.id);
        if (managerIndex > -1) {
            managerSocketIds.splice(managerIndex, 1);
        }
        console.log('user disconnected:', socket.id);
    });

    socket.on('transcription: start transcribing', (data) => {
        // let that specific speaker know that they should start recording
        console.log('Transcribe speaker:', data.id);
        // let everyone know that they should stop transcription
        io.emit('transcription: stop transcribing');
        // let all speakers know who is transcribing
        io.emit('transcription: start transcribing', data);
    });
    socket.on('transcription: stop transcribing', (data) => {
        // let that specific speaker know that they should stop recording
        console.log('Stop transcribing all speakers');
        io.emit('transcription: stop transcribing');
    });


    socket.on('transcription: speaker transcribed', (data) => {
        console.log('Speaker transcribed:', data.id, data.transcription);
        managerSocketIds.forEach(managerSocketId => {
            io.to(managerSocketId).emit('transcription: speaker transcribed', data);
        });
    });


});



return router;
}

module.exports = transcriptionRouter;

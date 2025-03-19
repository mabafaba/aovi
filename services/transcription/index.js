const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const multer = require("multer");

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

module.exports = router;

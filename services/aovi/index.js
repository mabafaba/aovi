
const aoviService = function(io){
    const express = require('express');
    const path = require('path');
    const qr = require('qr-image');
    const userService = require('../users');
    const router = express.Router();

    router.use(express.json());
    router.use(express.urlencoded({ extended: true }));

    router.use('/static', express.static(path.join(__dirname, 'client')));



    // Serve static files
    router.use('/static', express.static('client'));

    router.get('/views/login', (req, res) => {
        res.sendFile(__dirname + '/client/login.html');
    });
    
    router.get('/views/events', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
        res.setHeader('Content-Type', 'text/html');
        res.sendFile(__dirname + '/client/eventlist.html');
    });

    router.get('/views/events/create', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
        res.sendFile(__dirname + '/client/createEvent.html');
    });
    
    router.get('/views/events/:event', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
        res.sendFile(__dirname + '/client/event.html');
    });

    router.get('/views/events/:event/registration', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
        res.sendFile(__dirname + '/client/eventregistration.html');
    });
   
   
    router.get('/views/events/:event/room/:room', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
        res.sendFile(__dirname + '/client/room.html');
    });
     
    router.get('/views/events/:event/overview', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
        res.sendFile(__dirname + '/client/overview.html');
    });
    
    router.get('/views/events/:event/timeline', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
        res.sendFile(__dirname + '/client/timeline.html');
    });
    
    // evententry/:event
    router.get('/views/events/:event/entry', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
        res.sendFile(__dirname + '/client/evententry.html');
    });
    


    router.get('/events/:event/qr', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
        // generate qr code for url
        console.log("reached qr code generation");
        const url = req.params.url;
    
        const protocol = req.protocol;
        const host = req.get('host');
        const originalUrl = req.originalUrl;
    
        const completeUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    
        // log all the above:
        console.log('protocol', protocol);
        console.log('host', host);
        console.log('originalUrl', originalUrl);
        console.log('completeUrl', completeUrl);
    
        const targetLink = protocol + '://' + host + '/aovi/events/' + req.params.event;
    
        const code = qr.image(targetLink, { type: 'png' });
        res.setHeader('Content-type', 'image/png');
        code.pipe(res);
    });

    return router;

}

module.exports = aoviService;

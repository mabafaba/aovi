
const aoviService = function(io){
    const express = require('express');
    const path = require('path');
    const qr = require('qr-image');
    const userService = require('../users');
    const router = express.Router();
    const { Comments } = require('../comments');
    const { Rooms } = require('../rooms');

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
        res.sendFile(__dirname + '/client/createevent.html');
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
    

    // evententry/:event
    router.get('/views/events/:event/network', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
        res.sendFile(__dirname + '/client/network.html');
    });
    

    router.get('/eventjson/:event', userService.authorizeBasic, redirectUnauthorized, async (req, res) => {
        console.log("getting event comments json")
       try{ 
        
        const event = await Rooms.findById(req.params.id);
        // populate event.containsRooms
        const rooms = await Rooms.find({ _id: { $in: event.containsRooms } });

        comments = [];

        rooms.forEach(async (room) => {
            Comments.find({ room: room._id }, (err, roomComments) => {
                comments = comments.concat(roomComments);
            }
            );
        });

        console.log('comments', comments);

        // send comments as json
        res.status(200).send(comments);
        } catch(error){
         
        res.status(404).json({ message: 'Event not found' });

        }


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
    
        const targetLink = protocol + '://' + host + '/aovi/views/events/' + req.params.event + "/registration";
    
        const code = qr.image(targetLink, { type: 'png' });
        res.setHeader('Content-type', 'image/png');
        code.pipe(res);
    });


    // root should go to event list
    router.get('/', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
        res.redirect('/aovi/views/events');
    });

    return router;

}

module.exports = aoviService;

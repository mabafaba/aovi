const mongoose = require('mongoose');
const router = require('express').Router();
const express = require('express');
const sanitizeHtml = require('sanitize-html');
// Define the Mongoose schema
const roomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    data: { type: Object },
    title: { type: String },
    containsRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
});

// Create the Mongoose model
const Room = mongoose.model('Room', roomSchema);


publicRoomData = function(room, recipientUserId){
    // turn room into editable object
    room = room.toObject();
    const publicRoom =  {
        _id: room._id,
        name: room.name,
        createdAt: room.createdAt,
        title: room.title,
        containsRooms: room.containsRooms,
        userIsCreator: room.createdBy.toString() === recipientUserId.toString(),
        data: room.data || {}
    }
    return publicRoom;
}

router.use('/static', express.static('./services/rooms/client'));


// expect json
router.use(express.json());

// Delete all rooms
// log in red to console
console.log('\x1b[31m%s\x1b[0m', 'WARNING: ROUTE TO DELETE ROOMS OPEN');
router.get('/wipe', async (req, res) => {
    try {
        await Room.deleteMany();
        res.status(200).send({ message: 'All rooms deleted' });
    } catch (error) {
        res.status(500).send(error);
    }
});


// Create a new room
router.post('/', async (req, res) => {

    // sanitize text
    sanitizeOptions = {
        allowedTags: [],
        allowedAttributes: [],
        disallowedTagsMode: 'escape'
    }
    if(req.body.name){
    req.body.name = sanitizeHtml(req.body.name.toString(), sanitizeOptions);
    }
    if(req.body.title){
    req.body.title = sanitizeHtml(req.body.title.toString(), sanitizeOptions);
    }

    console.log('creating room', req.body);
    
    
    
        try {
            const roomData = {
                name: req.body.name,
                createdBy: req.body.user.id,
                title: req.body.title,
                data: req.body.data ? req.body.data : {},
                containsRooms: req.body.containsRooms ? req.body.containsRooms :
                []
            }

            console.log('trying roomData', roomData);
            const room = new Room(roomData);
            console.log('as room ob ject', room);
            await room.save();
            console.log('room saved', room);

            if(req.body.parent){
                const parentRoom = await Room.findById(req.body.parent.toString());
                parentRoom.containsRooms.push(room._id);
                await parentRoom.save();
            }
            // emit to all other clients
            const publicRoom = publicRoomData(room, req.body.user.id)
            res.status(201).send(publicRoom);
            
        } catch (error) {

            res.status(400).send(error);
        }
    });
    
    // Read all rooms
    router.get('/', async (req, res) => {

        try {
            const rooms = await Room.find();
            const publicRooms = rooms.map(room => publicRoomData(room, req.body.user.id));
            res.status(200).send(publicRooms);
        } catch (error) {
            res.status(500).send(error);
        }
    });
    
    
    
    // Read a single room by ID
    router.get('/id/:id', async (req, res) => {

        try {
            const room = await Room.findById(req.params.id.toString());
            // populate containsRooms
            if(room.containsRooms){
                await room.populate('containsRooms')
            }
            
            if (!room) {
                return res.status(404).send();
            }
            const publicRoom = room ? publicRoomData(room, req.body.user.id) : null;
            res.status(200).send(room);
        } catch (error) {
            res.status(500).send(error);
        }
    });
    
    
    
    // Upvote a room by ID
    router.post('/reaction/:id', async (req, res) => {
        // possible reactions: agree, disagree, neutral
        const reaction = req.body.reaction;
        if (!['agree', 'disagree', 'neutral'].includes(reaction)) {
            return res.status(400).send({ message: 'Invalid reaction' });
        }
        // try {
            const room = await Room.findById(req.params.id);
            if (!room) {
                return res.status(404).send();
            }
            const requestUserId = req.body.user.id.toString();
            room.usersAgree = room.usersAgree.filter(user => user.toString() !== requestUserId);
            room.usersDisagree = room.usersDisagree.filter(user => user.toString() !== requestUserId);
            room.usersNeutral = room.usersNeutral.filter(user => user.toString() !== requestUserId);
            if (reaction === 'agree') {
                room.usersAgree.push(req.body.user.id);
            }
            if (reaction === 'disagree') {
                room.usersDisagree.push(req.body.user.id);
            }
            if (reaction === 'neutral') {
                room.usersNeutral.push(req.body.user.id);
            }
            // make unique
            room.usersAgree = [...new Set(room.usersAgree)];
            room.usersDisagree = [...new Set(room.usersDisagree)];
            room.usersNeutral = [...new Set(room.usersNeutral)];
            await room.save();
            // emit to all other clients
            const publicRoom = room ? publicRoomData(room, req.body.user.id) : null;
            res.status(200).send(room);
        // } catch (error) {
            // res.status(500).send(error);
        // }
    });
        
    
    
    // Export the service
    module.exports = {router, Room};
    
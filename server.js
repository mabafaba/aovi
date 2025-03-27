const express = require('express');
const userService = require("./services/users");
const commentService = require("./services/comments"); // Import the commentService correctly
const cookieParser = require('cookie-parser');
const roomService = require("./services/rooms");
const transcriptionService = require("./services/transcription");
const aoviService = require("./services/aovi");
const geodataService = require("./services/geodata");
const qr = require('qr-image');
const port = 3000;

const { exec } = require('child_process');
const fs = require('fs');
const app = express();
const server = require('http').createServer(app);


app.use(cookieParser());
app.use(express.json());

// Use the user service
app.use('/aovi/user', userService.app);

userService.connectDB()
    .catch((err) => {
        console.error('Error connecting to database', err);
        })


const io = require('socket.io')(server,
    {
        path: "/aovi-socket-io",
        maxHttpBufferSize: 1 * 1024 * 1024 // 1 MB
        }
);
        


io.on('connection', (socket) => {
    console.log('a user connected with id', socket.id);
    socket.on('disconnect', () => {
        console.log('user disconnected with id', socket.id);
    });

    socket.on('join', (msg) => {
        // if data is array, join all rooms
        if (Array.isArray(msg)) {
            msg.forEach(room => {
                socket.join(room);
            });
        } else {
            socket.join(msg);
        }
    }
    );
}
);



redirectUnauthorized = (req, res, next) => {
    if (req.body.authorized) {
        next();
    } else {
        originalTarget = req.originalUrl;
        res.redirect('/aovi/views/login?targeturl=' + originalTarget);
    }
}

sendUnauthorizedStatus = (req, res, next) => {
    if(!req.body.authorized){
        res.status(401).send('Unauthorized');
        return;
    }else{
        next();

    }
}

app.use('/aovi/comments', userService.authorizeBasic, sendUnauthorizedStatus, commentService.router(io));
app.use('/aovi/rooms', userService.authorizeBasic, redirectUnauthorized, roomService.router);
app.use('/aovi/transcription', transcriptionService(io));
app.use('/aovi/geodata', geodataService.router);



app.use('/aovi', aoviService(io));



// // catch stray requests & redirect to eventlist
// app.use((req, res) => {
//     // if request is not looking for a static file, redirect to eventlist
//     if (!req.originalUrl.includes('/static')) {
//         res.redirect('/aovi/views/events');
//     }
// }
// );


app.get('/aovi/network/:eventid', async (req, res) => {
    const eventid = req.params.eventid
    console.log('EVENT ID', eventid);
    let event = await roomService.Room.findById(eventid);
    // event to objec
    event = event.toObject();
    const containedRooms = event.containsRooms;
    event.containsRooms = [];
    
    for(let room of containedRooms){
        let roomObj = await roomService.Room.findById(room);
        event.containsRooms.push(roomObj);
    }

    let comments = await commentService.Comment.find({ room: eventid });
    for(let room of event.containsRooms){
        let roomComments = await commentService.Comment.find({ room: room._id });
        comments = comments.concat(roomComments);
    }

    links = [];

    // for each pair of comments, count the number of common users that agree / neutral / disagree on both
    for(let i = 0; i < comments.length; i++){
        for(let j = i+1; j < comments.length; j++){
            const edge = {
                source: comments[i]._id,
                target: comments[j]._id,
                sharedagree: 0,
                shareddisagree: 0,
                sharedneutral: 0,
            }
            let comment1 = comments[i];
            let comment2 = comments[j];
        
            let commonUsersAgree = comment1.usersAgree.filter(value => comment2.usersAgree.includes(value)).length;
            let commonUsersDisagree = comment1.usersDisagree.filter(value => comment2.usersDisagree.includes(value)).length;
            let commonUsersNeutral = comment1.usersNeutral.filter(value => comment2.usersNeutral.includes(value)).length;

            edge.sharedagree = commonUsersAgree;
            edge.shareddisagree = commonUsersDisagree;
            edge.sharedneutral = commonUsersNeutral;
            edge.value = commonUsersAgree + commonUsersDisagree + commonUsersNeutral;
            if(edge.value>=1){links.push(edge);}
        }
    }

    // limit to 1000 edges (highest value)
    links.sort((a, b) => b.value - a.value);
    links = links.slice(0, 1000);


    nodes = comments.map(comment => {
        return {
            id: comment._id,
            text: comment.text.substring(0, 150),
            usersAgree: comment.usersAgree,
            usersDisagree: comment.usersDisagree,
            usersNeutral: comment.usersNeutral
        }
    });


    res.json({nodes, links});
    // console.log('event', event);
    // res.json(event);
});





server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    
});
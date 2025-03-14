const express = require('express');
const userService = require("./services/users");
const commentService = require("./services/comments"); // Import the commentService correctly
const cookieParser = require('cookie-parser');
const roomService = require("./services/rooms");
const port = 3000;


const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server,
    {
        path: "/aovi-socket-io",
        maxHttpBufferSize: 25 * 1024 * 1024 // 25 MB
      }
);

// where is io listening?
console.log('io listening on', io.path());

app.use(cookieParser());
app.use(express.json());

// Use the user service
app.use('/aovi/user', userService.app);

userService.connectDB()
    .then(() => {
        console.log('connected db');
    });


io.on('connection', (socket) => {
    console.log('a user connected with id', socket.id);
    socket.on('disconnect', () => {
        console.log('user disconnected wiht id', socket.id);
    });

    socket.on('join', (msg) => {
        // if data is array, join all rooms
        if (Array.isArray(msg)) {
            msg.forEach(room => {
                console.log('joining room', room);
                socket.join(room);
            });
        } else {
            console.log('joining room', msg);
            socket.join(msg);
        }
    }
    );
}
);


function addToBody(req, res, next) {
    req.body = req.body || {};
    req.body.test = 'test';
    next();
}

app.use('/aovi/comments', userService.authorizeBasic, commentService(io));
app.use('/aovi/rooms', userService.authorizeBasic, roomService);

// Serve static files
app.use('/aovi', express.static('client'));

// serve login.html
app.get('/aovi', (req, res) => {
    res.sendFile(__dirname + '/client/login.html');
});

app.get('/aovi/event/:event/room/:room', (req, res) => {
    res.sendFile(__dirname + '/client/room.html');
});

app.get('/aovi/event/id/:event', (req, res) => {
    res.sendFile(__dirname + '/client/event.html');
});

app.get('/aovi/overview/event/:event', (req, res) => {
    res.sendFile(__dirname + '/client/overview.html');
});

// timeline/event/...
app.get('/aovi/timeline/event/:event', (req, res) => {
    res.sendFile(__dirname + '/client/timeline.html');
});

app.get('/aovi/event/create', (req, res) => {
    res.sendFile(__dirname + '/client/createEvent.html');
});



server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
}
);
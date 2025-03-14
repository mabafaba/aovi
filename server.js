const express = require('express');
const userService = require("./services/users");
const commentService = require("./services/comments"); // Import the commentService correctly
const cookieParser = require('cookie-parser');
const roomService = require("./services/rooms");
const qr = require('qr-image');
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

redirectUnauthorized = (req, res, next) => {
    if (req.body.authorized) {
        next();
    } else {
        originalTarget = req.originalUrl;
        res.redirect('/aovi/login?targeturl=' + originalTarget);
    }
}

app.use('/aovi/comments', userService.authorizeBasic, redirectUnauthorized, commentService(io));
app.use('/aovi/rooms', userService.authorizeBasic, redirectUnauthorized, roomService);

// Serve static files
app.use('/aovi', express.static('client'));

// serve login.html
app.get('/aovi/login', (req, res) => {
    res.sendFile(__dirname + '/client/login.html');
});

app.get('/aovi/event/:event/room/:room', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
    res.sendFile(__dirname + '/client/room.html');
});

app.get('/aovi/event/id/:event', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
    res.sendFile(__dirname + '/client/event.html');
});

app.get('/aovi/eventregistration/id/:event', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
    res.sendFile(__dirname + '/client/eventregistration.html');
});


app.get('/aovi/overview/event/:event', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
    res.sendFile(__dirname + '/client/overview.html');
});

// timeline/event/...
app.get('/aovi/timeline/event/:event', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
    res.sendFile(__dirname + '/client/timeline.html');
});

app.get('/aovi/event/create', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
    res.sendFile(__dirname + '/client/createEvent.html');
});


app.get('/aovi/eventlist', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
    res.sendFile(__dirname + '/client/eventlist.html');
});



app.get('/aovi/eventqr/:event', userService.authorizeBasic, redirectUnauthorized, (req, res) => {
    // generate qr code for url
    const url = req.params.url;

    // get the complete url that was called i.e. hhtp://localhost:3000/aovi/qr/https://www.google.com
    const protocol = req.protocol;
    const host = req.get('host');
    const originalUrl = req.originalUrl;

    const completeUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

    // log all the above:
    console.log('protocol', protocol);
    console.log('host', host);
    console.log('originalUrl', originalUrl);
    console.log('completeUrl', completeUrl);

    const targetLink = protocol + '://' + host + '/aovi/event/id/' + req.params.event;

    const code = qr.image(targetLink, { type: 'png' });
    res.setHeader('Content-type', 'image/png');
    code.pipe(res);
});


server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
}
);
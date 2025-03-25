const express = require('express');
const userService = require("./services/users");
const commentService = require("./services/comments"); // Import the commentService correctly
const cookieParser = require('cookie-parser');
const roomService = require("./services/rooms");
const transcriptionService = require("./services/transcription");
const aoviService = require("./services/aovi");
const browserSync = require("browser-sync").create();

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

app.use('/aovi/comments', userService.authorizeBasic, redirectUnauthorized, commentService(io));
app.use('/aovi/rooms', userService.authorizeBasic, redirectUnauthorized, roomService.router);
// console.log('transcriptionService', transcriptionService);
app.use('/aovi/transcription', transcriptionService(io));

app.use('/aovi', aoviService(io));

// // catch stray requests & redirect to eventlist
// app.use((req, res) => {
//     // if request is not looking for a static file, redirect to eventlist
//     if (!req.originalUrl.includes('/static')) {
//         res.redirect('/aovi/views/events');
//     }
// }
// );





server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    browserSync.init({
        proxy: "http://localhost:3000",
        files: ["**/*"],  // Files to watch
        reloadDelay: 0,  // Optional: add delay to prevent multiple reloads
      });
}
);
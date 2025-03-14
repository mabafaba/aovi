const mongoose = require('mongoose');
const router = require('express').Router();
const express = require('express');
const sanitizeHtml = require('sanitize-html');
// Define the Mongoose schema
const commentSchema = new mongoose.Schema({
    text: { type: String, required: true },
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    data: { type: Object },
    room: { type: String },
    usersAgree: { type: Array },
    usersDisagree: { type: Array },
    usersNeutral: { type: Array },
});

// Create the Mongoose model
const Comment = mongoose.model('Comment', commentSchema);


publicCommentData = function(comment, recipientUserId){
    // turn comment into editable object
    comment = comment.toObject();
    console.log('agree',comment.usersAgree);
    console.log('disagree',comment.usersDisagree);
    console.log('neutral',comment.usersNeutral);
    console.log('recipientUserId',recipientUserId);
    const userId = recipientUserId.toString();
    // convert usersAgree, usersDisagree, usersNeutral to strings
    const usersAgree = comment.usersAgree.map(user => user.toString());
    const usersDisagree = comment.usersDisagree.map(user => user.toString());
    const usersNeutral = comment.usersNeutral.map(user => user.toString());
   
    const myReaction = usersAgree.includes(userId) ? "agree" : usersDisagree.includes(userId) ? "disagree" : usersNeutral.includes(userId) ? "neutral" : "none";

    console.log('myReaction', myReaction);

    
    const pc =  {
        _id: comment._id,
        text: comment.text,
        createdAt: comment.createdAt,
        author: comment.author===recipientUserId ? "me" : "others",
        room: comment.room,
        usersAgree: comment.usersAgree.length,
        usersDisagree: comment.usersDisagree.length,
        usersNeutral: comment.usersNeutral.length,
        myReaction: myReaction

}
console.log('publicComment', pc);
return pc;
}

function commentService(io) {
// static files from client folder
router.use('/static', express.static('./services/comments/client'));


// expect json
router.use(express.json());

// Delete all comments
router.get('/wipe', async (req, res) => {
    try {
        await Comment.deleteMany();
        // emit to all other clients
        io.emit('all comments deleted');
        res.status(200).send({ message: 'All comments deleted' });
    } catch (error) {
        res.status(500).send(error);
    }
});


// Create a new comment
router.post('/', async (req, res) => {

    console.log('req.body PRESAN', req.body);
    // sanitize text
    sanitizeOptions = {
        allowedTags: [],
        allowedAttributes: [],
        disallowedTagsMode: 'escape'
    }
    if(req.body.text){
    req.body.text = sanitizeHtml(req.body.text.toString(), sanitizeOptions);
    }
    if(req.body.room){
    req.body.room = sanitizeHtml(req.body.room.toString(), sanitizeOptions);
    }
    if(req.body.user && req.body.user.id){
    req.body.user.id = sanitizeHtml(req.body.user.id.toString(), sanitizeOptions);
    }
    

    try {
        const commentData = {
            text: req.body.text,
            author: req.body.user.id,
            room: req.body.room
        }
        const comment = new Comment(commentData);
        await comment.save();
        // emit to all other clients
        const publicComment = publicCommentData(comment, req.body.user.id)
        console.log('publicComment', publicComment);
        io.to(comment.room).emit('comment created', publicComment);
        res.status(201).send(publicComment);
        
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});

// Read all comments
router.get('/', async (req, res) => {
    console.log('get all comments');
    try {
        const comments = await Comment.find();

    const publicComments = comments.map(comment => publicCommentData(comment, req.body.user.id));

        res.status(200).send(publicComments);
    } catch (error) {
        res.status(500).send(error);
    }
});


// Read comments by room name
router.get('/room/:name', async (req, res) => {
    console.log('get comments by room', req.params.name);
    try {
        const comments = await Comment.find({ room: req.params.name });
        if (!comments.length) {
            res.status(200).send([]);
            return;
        }
        const publicComments = comments.map(comment => publicCommentData(comment, req.body.user.id));
        res.status(200).send(publicComments);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Read a single comment by ID
router.get('/:id', async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        
        if (!comment) {
            return res.status(404).send();
        }
        const publicComment = comment ? publicCommentData(comment, req.body.user.id) : null;
        res.status(200).send(comment);
    } catch (error) {
        res.status(500).send(error);
    }
});



// Upvote a comment by ID
router.post('/reaction/:id', async (req, res) => {
    // possible reactions: agree, disagree, neutral
    const reaction = req.body.reaction;
    if (!['agree', 'disagree', 'neutral'].includes(reaction)) {
        return res.status(400).send({ message: 'Invalid reaction' });
    }
    // try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).send();
        }
        const requestUserId = req.body.user.id.toString();
        comment.usersAgree = comment.usersAgree.filter(user => user.toString() !== requestUserId);
        comment.usersDisagree = comment.usersDisagree.filter(user => user.toString() !== requestUserId);
        comment.usersNeutral = comment.usersNeutral.filter(user => user.toString() !== requestUserId);
        if (reaction === 'agree') {
            comment.usersAgree.push(req.body.user.id);
        }
        if (reaction === 'disagree') {
            comment.usersDisagree.push(req.body.user.id);
        }
        if (reaction === 'neutral') {
            comment.usersNeutral.push(req.body.user.id);
        }
        // make unique
        comment.usersAgree = [...new Set(comment.usersAgree)];
        comment.usersDisagree = [...new Set(comment.usersDisagree)];
        comment.usersNeutral = [...new Set(comment.usersNeutral)];
        await comment.save();
        // emit to all other clients
        const publicComment = comment ? publicCommentData(comment, req.body.user.id) : null;
        io.to(publicComment.room).emit('comment reacted', publicComment);
        res.status(200).send(comment);
    // } catch (error) {
        // res.status(500).send(error);
    // }
}
);


return router;
}



// Export the service
module.exports = commentService;

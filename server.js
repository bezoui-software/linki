//Create our express and socket.io servers
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const {v4: uuidV4} = require('uuid')

app.set('view engine', 'ejs') // Tell Express we are using EJS
app.use(express.static('public')) // Tell express to pull the client script from the public folder

// If they join the base link, generate a random UUID and send them to a new room with said UUID
app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`)
})

const PORT = 3000;

app.get("/:roomID", (req, res) => {
    res.render('room', { roomID: req.params.roomID });
})

io.on("connection", socket => {
    socket.on("join-room", (roomId, userId) => {
        console.log("[+] user", userId, "connected to", roomId);
        socket.join(roomId);
        socket.broadcast.to(roomId).emit("user-connected", userId);
        socket.on("disconnect", () => {
            console.log("[-] user", userId, "disconnected from", roomId);
            socket.broadcast.to(roomId).emit("user-disconnected", userId);
        })    
        socket.on("user-exist", (msg) => {
            console.log("[!] user exist", userId);
            socket.broadcast.to(roomId).emit("user-exist", userId);
        })    
        socket.on("message", (msg, userName) => {
            console.log("[!] user", userId, "sent a message", msg);
            socket.broadcast.to(roomId).emit("message",  msg, userId, userName);
        })
    })
})

server.listen(PORT, () => console.log('Listening on port', PORT));
//peerServer.listen(peerPort, () => console.log("Peer server listening on port", peerPort));


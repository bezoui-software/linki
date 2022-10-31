const express = require("express");
const app = express();

const { ExpressPeerServer } = require('peer');

const http = require('http');

const server = http.createServer(app);
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerjs'
});

const { Server } = require("socket.io");
const io = new Server(server);

const path = require("path");
const { v4: uuidV4 } = require("uuid");
const PORT = process.env.PORT || 3000;

app.use('/', peerServer);
app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.redirect(`/${uuidv4()}`);
})

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

server.listen(process.env.PORT || 3000, () => console.log('Listening on port 3000'));
//peerServer.listen(peerPort, () => console.log("Peer server listening on port", peerPort));


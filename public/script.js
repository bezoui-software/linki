let my_call, my_video, my_video_stream, peer, videos_grid, socket, peers, USER_ID, USERNAME;

function setup() {
    $("body").append("<div id='username_popup'><input placeholder='Username' id='username_input'><button id='set_username_btn'>Start</btn></div>");
    $("#set_username_btn").on("click", () => {
        let username = $("#username_input").val();
        if (checkUsername(username)) {
            USERNAME = username;
            $("#username_popup").remove();
            run();
        }
    })
}

function run() {
    var origin = window.location.origin;
    socket = io("/")
    peers = {};

    videos_grid = document.getElementById("videos-grid")
    my_video = document.createElement("video");
    my_video.muted = true;

    peer = new Peer(undefined, {
        path: '/peerjs',
        host: window.location.hostname,
        port: '443'
      });

    peer.on("open", userID => {
            USER_ID = userID;
            socket.emit("join-room", ROOM_ID, userID, USERNAME)
            $("#send_btn").on("click", () => {
                let msg = $("#chat_message").val();
                if (checkMessage(msg)) {
                    addMessageToChat(msg, userID);
                    socket.emit("message", msg, USERNAME);
                    $("#chat_message").val("");
                }
            })
    })

    socket.on("user-disconnected", userId => {
        if (peers[userId])  {
            peers[userId].call.close();
            peers[userId].video.remove();
        }
    })

    socket.on("message", (msg, userId, userName) => {
        addMessageToChat(msg, userId, userName);
    })

    setupMyVideoStream();
}

function checkMessage(msg) {
    return msg.length > 0 && msg.length <= 60; 
}

function checkUsername(username) {
    return username.length > 0 && username.length <= 20;
}

function addMessageToChat(msg, userId, userName) {
    if (userId == USER_ID) userName = "You";
    let className = (userId == USER_ID) ? "message-container my_message-container" : "message-container";
    $("#messages").append(`<div class="${className}"><div class="username">${userName}</div><div class="message">${msg}</div></div>`);
    scrollChatToBottom();
}

function setupMyVideoStream() {
    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    }).then(stream => {
        my_video_stream = stream;
        setupControls();
        addVideoStream(stream, my_video)
        setupHandlers();
    })
}

function setupHandlers() {
    peer.on("call", call => {
        const video = document.createElement("video");
        call.answer(my_video_stream);
        call.on("stream", userVideoStream  => {
            addVideoStream(userVideoStream, video);
        })
        call.on("close", () => {
            video.remove();
        })
        peers[call.peer] = {call, video};
    })

    socket.on("user-connected", userId => {
        connectToNewUser(userId, my_video_stream)
    })

    socket.on("user-disconnected", userId => {
        if (peers[userId])  {
            console.log(peers[userId]);
            peers[userId].call.close();
            peers[userId].video.remove();
        }
    })
}

function setupControls() {
    $("#mute_button").on("click", () => {
        muteUnmuteMyAudio();
    })

    $("#hide_button").on("click", () => {
        hideUnhideVideo();
    })

    $("#chat_button").on("click", () => {
        hideUnhideChat();
    })

    $("#leave_button").on("click", () => {
        leaveMeeting();
    })
}

function leaveMeeting() {
    window.location.href = "";
}

function scrollChatToBottom() {
    let chat =$("#main__chat__window");
    chat.scrollTop(chat.prop("scrollHeight"));
}

function connectToNewUser(userId, stream) {
    const call = peer.call(userId, stream);
    const video = document.createElement("video");
    call.on("stream", userVideoStream => {
        addVideoStream(userVideoStream, video);
    })
    call.on("close", () => {
        video.remove();
    })

    peers[userId] = {};
    peers[userId] = {call, video};
}

function addVideoStream(stream, video) {
    video = (video) ? video : document.createElement("video");
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
        videos_grid.appendChild(video);
    })
}

function setUnmuteButton() {
    const html = `
        <i class="fa fa-microphone-slash unmute"></i>
        <span>Unmute</span>
    `;
   
    $("#mute_button").html(html);
}

function setMuteButton() {
    const html = `
    <i class="fa fa-microphone"></i>
    <span>Mute</span>
    `;
 
    $("#mute_button").html(html);
}

function muteUnmuteMyAudio() {
    const enabled = my_video_stream.getAudioTracks()[0].enabled;
    if (enabled) {
        my_video_stream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        my_video_stream.getAudioTracks()[0].enabled = true;
        setMuteButton();
    }
}

function setUnhideVideoButton() {
    const html = `
        <i class="fas fa-video-slash unhide"></i>
        <span>Unhide</span>
    `;

    $("#hide_button").html(html);
}

function setHideVideoButton() {
    const html = `
    <i class="fa fa-video-camera"></i>
    <span>Hide</span>
    `;

    $("#hide_button").html(html);
}

function hideUnhideVideo() {
    const enabled = my_video_stream.getVideoTracks()[0].enabled;
    if (enabled) {
        my_video_stream.getVideoTracks()[0].enabled = false;
        setUnhideVideoButton();
    } else {
        my_video_stream.getVideoTracks()[0].enabled = true;
        setHideVideoButton();
    }
}

function hideUnhideChat() {
    const enabled = ($("#main__right").css('display') != "none");
    if (enabled) {
        $("#main__right").css('display', "none")
        $("#main__left").css('flex', "1")
    } else {
        $("#main__right").css('display', "flex")
        $("#main__left").css('flex', "0.8")
    }
}

setup();
const ip = 'localhost';
const myHomeIp = '192.168.100.8';
const ipTurnServer = 'turn:0.0.0.0';
const ipStunServer = 'stun:0.0.0.0:3478';
const webSocket = new WebSocket(`ws://${myHomeIp}:8080`);
webSocket.onmessage = (e) => {
    console.log(JSON.parse(e.data));
    handleSignallingData(JSON.parse(e.data))
}
function handleSignallingData(data) {
    switch (data.type) {
        case "offer":
            peerConn.setRemoteDescription(data.offer)
            createAndSendAnswer()
            break;
        case "candidate":
            peerConn.addIceCandidate(data.candidate)
    }
}

function createAndSendAnswer() {
    peerConn.createAnswer((answer) => {
        peerConn.setLocalDescription(answer)
        sendData({
            type: "send_answer",
            answer: answer
        })
        console.log("send answer");
    }, error => console.log(error))
}

function sendData(data) {
    data.username = username
    webSocket.send(JSON.stringify(data))
}

let localStream
let username
let peerConn

async function joinCall() {
    username = document.getElementById('username-input').value
    document.getElementById("video-div").style.display = "inline"
    navigator.getUserMedia({
        video: {
            frameRate: 24,
            width: {
                min: 480, ideal: 720, max: 1280
            },
            aspectRatio: 1.33333
        },
        audio: true
    }, (stream) => {
        localStream = stream
        document.getElementById("local-video").srcObject = localStream
        let configuration = {
            iceServers: [
                {
                    "url": ipTurnServer,
                    "username": "ninefingers",
                    "credential": "youhavetoberealistic"
                }
            ]
        }
        // let configuration = {
        //     iceServers: [
        //         {
        //             "urls": ["stun:stun.l.google.com:19302",
        //                 "stun:stun1.l.google.com:19302",
        //                 "stun:stun2.l.google.com:19302"]
        //         }
        //     ]
        // }
        // let configuration = {
        //     iceServers: [
        //         {
        //             "urls": [ipStunServer]
        //         }
        //     ]
        // }
        peerConn = new RTCPeerConnection(configuration)
        // stream.getTracks().forEach(function (track) {
        //     peerConn.addTrack(track, stream);
        //     console.log("add track");
        // })
        // let inboundStream = null;

        // peerConn.ontrack = (e) => {
        //     if (e.streams && e.streams[0]) {
        //         document.getElementById("remote-video").srcObject = e.streams[0]

        //     } else {
        //         // if (!inboundStream) {
        //         //     inboundStream = new MediaStream();
        //         //     document.getElementById("remote-video").srcObject = inboundStream;
        //         // }
        //         // inboundStream.addTrack(e.track);
        //     }

        // }
        peerConn.addStream(localStream)

        peerConn.onaddstream = (e) => {
            document.getElementById("remote-video")
                .srcObject = e.stream
        }
        peerConn.onicecandidate = ((e) => {
            console.log(e, 'ice candidate');
            if (e.candidate == null) {
                console.log("can not send");
                return

            }
            sendData({
                type: "send_candidate",
                candidate: e.candidate
            })
            console.log("send data");
        })

        sendData({
            type: "join_call"
        })
    }, (error) => {
        console.log(error)
    })
}



let isAudio = true
function muteAudio() {
    isAudio = !isAudio

    localStream.getAudioTracks()[0].enabled = isAudio
}

let isVideo = true
function muteVideo() {
    isVideo = !isVideo
    localStream.getVideoTracks()[0].enabled = isVideo
}
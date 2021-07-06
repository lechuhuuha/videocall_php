const ip = 'localhost';
const ipTurnServer = 'turn:0.0.0.0';
const ipStunServer = 'stun:0.0.0.0:3478';
const myHomeIp = '192.168.100.8';
const webSocket = new WebSocket(`ws://${myHomeIp}:8080`);
webSocket.onmessage = (e) => {
    console.log(JSON.parse(e.data));
    handleSignallingData(JSON.parse(e.data))
}
function handleSignallingData(data) {
    switch (data.type) {
        case "answer":
            peerConn.setRemoteDescription(data.answer)
            break;
        case "candidate":
            peerConn.addIceCandidate(data.candidate)
    }
}
let username
function sendUsername() {
    username = document.getElementById('username-input').value;
    sendData({
        type: "store_user"
    })
}
function sendData(data) {
    data.username = username
    webSocket.send(JSON.stringify(data))
}

let localStream
let peerConn
function startCall() {
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
        // day la su dung stun server 0.0.0.0:3478
        // tiep theo t su dung turn server 
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
        peerConn = new RTCPeerConnection(configuration);
        // console.log(peerConn);
        // stream.getTracks().forEach(function (track) {
        //     peerConn.addTrack(track, stream);
        //     console.log("add track");
        // })
        // // if (peerConn.addStream(localStream)) {
        // //     console.log("add stream");
        // // } else {
        // //     console.log("can not add stream");
        // // }
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

        peerConn.onicecandidate = (async (e) => {
            console.log(e), 'ice candidate';
            if (e.candidate == null) {
                console.log("can not send");
                return

            }
            sendData({
                type: "store_candidate",
                candidate: e.candidate
            })
            console.log("send data");
        })
        createAndSendOffer()
    }, (error) => {
        console.log(error)
    })
}

function createAndSendOffer() {
    peerConn.createOffer((offer) => {
        sendData({
            type: "store_offer",
            offer: offer
        })
        console.log('send offer');
        peerConn.setLocalDescription(offer)

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
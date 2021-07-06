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
                    "urls": [ipTurnServer],
                    "username": "ninefingers",
                    "credential": "youhavetoberealistic"
                }
            ]
        }
        peerConn = new RTCPeerConnection(configuration)
        peerConn.addStream(localStream);
        peerConn.onaddstream = (e) => {
            document.getElementById("remote-video").srcObject = e.stream
        }
        peerConn.onicecandidate = ((e) => {
            if (e.candidate == null) {
                return

            }
            sendData({
                type: "store_candidate",
                candidate: e.candidate
            })
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
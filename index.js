let express = require('express');
let io = require('socket.io');
var path = require('path');

const PORT = 8080;

let rooms = [];
let app = express();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

let server = app.listen(PORT, () => {
    let address = server.address();
    console.log('Listening on: ' + address.address + ":" + address.port);
});

let socketServer = new io(server);

socketServer.on('connection', socket => {
    console.log("User Connected: " + socket.id);

    socket.on('create room', (callback) => {
        let roomID = createRoomID();

        console.log('room created: ' + roomID);
        rooms.push({ roomID: roomID, admin: socket });
        callback({ roomID: roomID });
    });

    socket.on('join room', data => {
        if(data.hasOwnProperty("roomID")) {
            let roomID = data.roomID;

            for(let i = 0; i < rooms.length; i++) {
                if(rooms[i].roomID === roomID) {
                    socket.join(roomID, () => {
                        console.log("User " + socket.id + " has joined room " + roomID);
                        socketServer.in(roomID).emit('user joined', "User " + socket.id + " has joined room " + roomID);
                    });
                } else {
                    //TODO: Return error
                    console.log("Room doesn't exist.");
                }
            }
        }
    });

    socket.on('admin clicked', () => {
        for(let i = 0; i < rooms.length; i++) {
            if(rooms[i].admin === socket) {
                console.log("Admin Clicked");
                socket.to(rooms[i].roomID).emit('flash');
            }
        }
    });

    socket.on('disconnect', () => {
        /*Handle disconnect*/
        console.log("User Disconnected: " + socket.id);
        for(let i = 0; i < rooms.length; i++) {
            if(rooms[i].admin === socket) {
                //TOOD: The admin has left the room, kick everyone out and close the room
                rooms.splice(i, 1);
            }
        }
    });
});

function createRoomID() {
    let text = "";
    let possible = "abcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 5; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}
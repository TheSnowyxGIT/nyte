const { sessionMiddleware } = require("../app");

/**
 * Load the library for the sockets between server and clients
 */
 const socketio = require("socket.io");

 /**
 *  Services
 */
const serverService = require("../../services/ServerService");

module.exports = (server) => {
    const io = socketio(server);
    io.use((socket, next) => {
        sessionMiddleware(socket.request, socket.request.res || {}, next);
    });
    io.on('connection', socket => {
        if (serverService.is_connected(socket.request)){
            serverService.data.AddUser(socket.request.session, socket);
        }
    
        socket.on("disconnect", ()=>{
            if (serverService.is_connected(socket.request)){
                serverService.data.RemoveUser(socket.request.session, socket);
            }
        });

        require("./GradeListener")(socket);

    })
}

const Error = require("../../services/entities/Error")

/**
 * Service
 */
const gradeService = require("../../services/GradeService")
const syntaxService = require("../../services/SyntaxService")
const serverService = require("../../services/ServerService")

module.exports = function(socket) {


    socket.on('set_grade', (data) => {
        if (!serverService.is_connected(socket.request)) {
            return socket.emit("error", Error.get(Error.types.Disconnected))
        }
        const user_data = socket.request.session.user_data;
        const userId = user_data.id;
        
        /**
         * The data needed :
         * controlId and value
         */
        if (!data) {
            return socket.emit("error", Error.get_syntax("_socket_data_"));
        }
        if (!syntaxService.id(data.controlId)){
            return socket.emit("error", Error.get_syntax("controlId"));
        }
        if (!syntaxService.object(data.value)){
            return socket.emit("error", Error.get_syntax("value"));
        }
        if (!syntaxService.id(userId)){
            return socket.emit("error", Error.get_syntax_session("userId"))
        }

        const controlId = data.controlId;
        const value = data.value;


        gradeService.set_grade(userId, controlId, value).catch(err => {
            if (!err || !err.status){
                throw err
            }
            return socket.emit("error", err);
        });
    })

    socket.on('reset_grade', (data) => {
        if (!serverService.is_connected(socket.request)) {
            return socket.emit("error", Error.get(Error.types.Disconnected))
        }
        const user_data = socket.request.session.user_data;
        const userId = user_data.id;
        
        /**
         * The data needed :
         * controlId and value
         */
        if (!data) {
            return socket.emit("error", Error.get_syntax("_socket_data_"));
        }
        if (!syntaxService.id(data.controlId)){
            return socket.emit("error", Error.get_syntax("controlId"));
        }
        if (!syntaxService.id(userId)){
            return socket.emit("error", Error.get_syntax_session("userId"))
        }

        const controlId = data.controlId;

        gradeService.reset_grade(userId, controlId).catch(err => {
            if (!err || !err.status){
                throw err
            }
            return socket.emit("error", err);
        });
    })

}

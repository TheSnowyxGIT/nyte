
const Error = require("./entities/Error")

class SERVER_DATA {

    constructor() {
        this.users = {}
    }

    AddUser(session, socket){
        if (this.users[session.user_data.id]){
            this.users[session.user_data.id].access_token = session.access_token;
            this.users[session.user_data.id].access_token = session.user_data;
            this.users[session.user_data.id].sockets[socket.id] = socket;
        }else{
            this.users[session.user_data.id] = {
                access_token: session.access_token,
                user_data: session.user_data,
                sockets: {}
            }
            this.users[session.user_data.id].sockets[socket.id] = socket;
        }
    }

    RemoveUser(session, socket){
        if (Object.keys(this.users[session.user_data.id].sockets).length > 1){
            delete this.users[session.user_data.id].sockets[socket.id];
        }else{
            delete this.users[session.user_data.id];
        }
    }
    
    GetOnlineUsers_details(){
        const users = this.users.map(elmt => {
            elmt.user_data
        })
        return users;
    }

    GetOnlineUsers_basic(){
        const users = this.users.map(elmt => {
            elmt.user_data.id
        })
        return users;
    }

    getOnlineUsersCount(){
        return Object.keys(this.users).length;
    }

}

module.exports.data = new SERVER_DATA();

/**
 * Modify / Create the session of an user
 * @param {*} req express request variable
 * @param {*} obj the data to save into the session
 * @param {*} callback
 * return undefined on success
 * Otherwise, an error
 */
 module.exports.save_session = (req, obj) => {
    return new Promise((resolve, reject) => {
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            req.session[key] = value;
        });
        req.session.save(err => {
            if (err) {
                return reject(Error.get(Error.types.SaveSessionFailed, {
                    message: "Session save failed.",
                    error: err
                }));
            }
            resolve();
        });
    });
}


module.exports.need_connected = (req, res, next) => {
    if (!req.session.connected) {
        res.redirect('/user/login');
        return;
    }
    next();
}

module.exports.need_disconnected = (req, res, next) => {
    if (req.session.connected) {
        res.redirect('/');
        return;
    }
    next();
}

module.exports.is_connected = (req) => {
    if (req.session.connected) {
        return true;
    }
    return false;
}

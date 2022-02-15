const https = require("https");
const fs = require('fs');

/**
 * Load the "./config" that contains all basics informations
 * like the server port
 */
const config = require("./config.json");
require("./configChecker")(); // Check the config

const options = {
    key: fs.readFileSync(config.SSL.privkey),
    cert: fs.readFileSync(config.SSL.fullchain)
};

/**
 * Create the server with the script that will holder all requests
 */
const { app } = require("./src/presentation/app"); // Object that will hold requests
const server = https.createServer(options, app);


/**
* Launch the server on the port "config.port"
*/
server.listen(config.port, function () {
    console.log("Server running on " + config.port);
    /**
    * Launch the server socket io
    */
    require("./src/presentation/listeners/listerner")(server);
    LoadData();
});

/*
* Daily timeout
*/
/*
setTimeout(() => {
    LoadData();
}, 1000 * 60 * 60 * 24);
*/

/*---------------*/
const criService = require("./src/services/CriService")

const groupRepository = require("./src/data/GroupRepository")

function LoadData() {
    criService.update_groups();
}

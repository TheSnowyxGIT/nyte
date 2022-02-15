/**
 * Depedencies declarations
 */
 const path = require("path");
 const express = require("express");
 
 const config = require("../../config.json");
 
 /**
  * Requests holding
  */
 
 const app = express();
 
 /**
  * HTML views engine -> PUG
  * More info : https://www.npmjs.com/package/pug
  */
 app.set("views", "./src/presentation/views");
 app.set("view engine", "pug");
 
 
 /**
  * SESSIONS
  */
const express_session = require("express-session");
const MySQLStore = require('express-mysql-session')(express_session);
const sessionStore = new MySQLStore({
    host: config.DDB.host,
    user: config.DDB.username,
    password: config.DDB.password,
    database: config.DDB.database,
    port: 3306,
    clearExpired: true,
});
const sessionMiddleware = express_session({
    name: "sid",
    cookie: {
        maxAge: config.SESSIONS.LIFETIME,
        secure: false, //pour le developpement
        httpOnly: false
    },
    secret: config.SESSIONS.SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
});
app.use(sessionMiddleware);

 /* SET PUBLIC DIRECTORY */
 app.use(express.static(path.join(__dirname, '../../www')));
 

 
/**
 *  Services
 */
 const serverService = require("../services/ServerService")



 /**
  * Routes
  */
 

 

app.get("/", (req, res) => {
    res.render("home",
    {
        //connected: serverService.is_connected(req)
    });
})

const userRessource = require("./UserRessource");
app.use("/user", userRessource);

const apiRessource = require("./ApiRessource");
app.use("/api", apiRessource);
 
 const gradeRessource = require("./GradeRessource");
 app.use("/grades", gradeRessource);
 
 /*
 const statsRessource = require("./StatsRessource");
 app.use("/stats", statsRessource);
*/


 
 module.exports.app = app;
 module.exports.sessionMiddleware = sessionMiddleware;
 

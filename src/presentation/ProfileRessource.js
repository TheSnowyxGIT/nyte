const express = require("express");
const router = express.Router();


/**
 *  Services
 */

const serverService = require("../services/ServerService")




router.get("/", serverService.need_connected, (req, res) => {
    const user_data = req.session.user_data;

    res.render("profile", {
        user: {
            login: user_data.login,
        }
    });

})

module.exports = router;

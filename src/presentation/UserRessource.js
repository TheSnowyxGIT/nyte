const express = require("express");
const router = express.Router();


/**
 *  Services
 */
const serverService = require("../services/ServerService");
const microsoftService = require("../services/MicrosoftService");

router.get("/login", /*serverService.need_disconnected,*/ (req, res) => {
    res.render("login",{
        oauth_microsoft_url: microsoftService.oauth_url
    });
});


module.exports = router;

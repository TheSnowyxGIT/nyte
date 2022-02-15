const express = require("express");
const router = express.Router();


const Error = require("../services/entities/Error")
const Success = require("../services/entities/Success")

/**
 *  Services
 */
const syntaxService = require("../services/SyntaxService");
const microsoftService = require("../services/MicrosoftService");
const authService = require("../services/AuthService");
const userService = require("../services/UserService");
const serverService = require("../services/ServerService");


router.get("/login_microsoft", (req, res) => {
    const code = req.query.code;
    if (!syntaxService.notempty_string(code)) {
        return Error.send_err(res, Error.get_syntax("code"))
    }
    microsoftService.get_access_token(code).then(microsoft_access_token => {
        authService.prepare_connexion(microsoft_access_token).then(user_id => {
            userService.get_user_minimal_info(user_id).then(user_infos => {
                serverService.save_session(req, {
                    connected: true,
                    id: user_id,
                    user_data: user_infos
                }).then(() => {
                    res.redirect('/');
                }).catch(err => Error.send_err(res, err))
            }).catch(err => Error.send_err(res, err))
        }).catch(err => Error.send_err(res, err))
    }).catch(err => Error.send_err(res, err))
})

router.get("/logout", (req, res) => {
    if (serverService.is_connected(req)) {
        req.session.destroy((err) => {
            if (err) {
                return Error.send_err(Error.types.DestroySessionFailed, {
                    message: "Serveur erreur: destroy session failed."
                });
            } else {
                return Success.send(res, {
                    success: "Déconnecté."
                })
            }
        });
    } else {
        return Success.send(res, {
            success: "Déja déconnecté."
        })
    }
});


module.exports = router;

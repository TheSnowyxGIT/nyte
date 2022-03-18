const express = require("express");
const router = express.Router();


const Error = require("../services/entities/Error")
const Success = require("../services/entities/Success")


/**
 *  Services
 */
const serverService = require("../services/ServerService")
const syntaxService = require("../services/SyntaxService");
const statsService = require("../services/StatsService")
const rankingService = require("../services/RankingService")

 
router.get("/", serverService.need_connected, (req, res) => {
    const user_data = req.session.user_data;
    const userId = user_data.id;

    if (!syntaxService.id(userId)){
        return Error.send_err(res, Error.get_syntax_session("user_id"))
    }

    const stats = {
        connexions: {
            data: {
                nb_connexions: statsService.stats.connexions_number,
                average: statsService.stats.connexions_daily_average,
                campus: statsService.stats.campus_ranking[0].campus,
                best_user: statsService.stats.best_user
            },
            daily_connexions: statsService.stats.daily_connexions
        },
        campus: {
            campus_ranking_avg: rankingService.rankings.campus_ranking,
            campus_ranking_connexion: statsService.stats.campus_ranking,
        }

    }

    res.render("stats", {
        user: {
            login: user_data.login
        },
        stats: stats
    });
})


module.exports = router;

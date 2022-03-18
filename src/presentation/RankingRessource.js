const express = require("express");
const router = express.Router();

const Error = require("../services/entities/Error")
const Success = require("../services/entities/Success")

/**
 *  Services
 */

const serverService = require("../services/ServerService")
const rankingService = require("../services/RankingService")
const gradeService = require("../services/GradeService")

router.get("/menu", serverService.need_connected, async (req, res) => {
    const user_data = req.session.user_data;

    const semesters = await gradeService.get_all_epita_subjects();

    res.render("ranking_menu", {
        user: {
            login: user_data.login,
        },
        semesters: semesters
    });
})

router.get("/", serverService.need_connected, (req, res) => {
    const user_data = req.session.user_data;

    let ranking_obj;
    if (req.query.semester) {
        const semester = req.query.semester;
        if (!rankingService.rankings.global_ranking[semester]) {
            return Error.send(res, Error.types.InvalidRequest, "The given semester does not exists or there is no grades in it yet.");
        }
        if (req.query.module) {
            const module = req.query.module;
            if (!rankingService.rankings.global_ranking[semester].modules[module]) {
                return Error.send(res, Error.types.InvalidRequest, "The given module does not exists or there is no grades in it yet.");
            }
            if (req.query.subject) {
                const subject = req.query.subject;
                if (!rankingService.rankings.global_ranking[semester].modules[module].subjects[subject]) {
                    return Error.send(res, Error.types.InvalidRequest, "The given subject does not exists or there is no grades in it yet.");
                }
                ranking_obj = {
                    ranking: rankingService.rankings.global_ranking[semester].modules[module].subjects[subject].ranking,
                    type: rankingService.rankings.global_ranking[semester].modules[module].subjects[subject].type,
                    date: rankingService.rankings.global_ranking[semester].modules[module].subjects[subject].date
                };
            } else {
                ranking_obj = {
                    ranking: rankingService.rankings.global_ranking[semester].modules[module].ranking,
                    type: rankingService.rankings.global_ranking[semester].modules[module].type,
                    date: rankingService.rankings.global_ranking[semester].modules[module].date
                };
            }
        } else {
            ranking_obj = {
                ranking: rankingService.rankings.global_ranking[semester].ranking,
                type: rankingService.rankings.global_ranking[semester].type,
                date: rankingService.rankings.global_ranking[semester].date
            };
        }
    } else {
        return Error.send(res, Error.types.InvalidRequest, "The semester is missing in the query.");
    }

    res.render("ranking", {
        user: {
            login: user_data.login,
        },
        ranking: ranking_obj
    });

})

module.exports = router;

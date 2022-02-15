const express = require("express");
const router = express.Router();


const Error = require("../services/entities/Error")
const Success = require("../services/entities/Success")


/**
 *  Services
 */
 const syntaxService = require("../services/SyntaxService");
 const gradeService = require("../services/GradeService");


const calculator = require("@adrien.pgd/grades")


/**
 *  Services
 */
 const serverService = require("../services/ServerService")

router.get("/", serverService.need_connected, (req, res) => {
    const user_data = req.session.user_data;
    const userId = user_data.id;

    if (!syntaxService.id(userId)){
        return Error.send_err(res, Error.get_syntax_session("user_id"))
    }

    gradeService.get_user_grades_details(userId).then(grades => {
        calculator.eval(grades);
        
        res.render("grades", {
            user: {
                login: user_data.login,
            },
            grades: grades
        });
    }).catch(err => Error.send_err(res, err));
})


module.exports = router;

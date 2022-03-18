const calculator = require("@adrien.pgd/grades")

/**
 * Services
 */
const gradeService = require("./GradeService")


/**
 * Repositories
 */
const userRepository = require("../data/UserRepository")


class Ranking {
    constructor() {
        this.load()

        setInterval(() => {
            this.load()
        }, 1000 * 60 * 30) // two per hours
    }

    async load() {
        await this.loadCampusRanking();
        await this.loadGlobalRanking();
    }

    async loadCampusRanking() {
        const users = await userRepository.get_users();
        const campus_calcul = {};
        for (const user of users) {
            const campus = user.campus;
            const gradeDetail = await gradeService.get_user_grades_details(user.id);
            calculator.eval(gradeDetail);
            let number = 0;
            let sum = 0;
            for (const semester of Object.values(gradeDetail.semesters)) {
                if (semester.eval && semester.eval.value && semester.eval.value != null && !isNaN(semester.eval.value)) {
                    sum += semester.eval.value;
                    number += 1;
                }
            }
            if (number > 0) {
                const average = sum / number;
                if (!campus_calcul[campus]) {
                    campus_calcul[campus] = {
                        sum: average,
                        number: 1
                    }
                } else {
                    campus_calcul[campus].sum += average;
                    campus_calcul[campus].number += 1;
                }
            } else {
                if (!campus_calcul[campus]) {
                    campus_calcul[campus] = {
                        sum: 0,
                        number: 0
                    }
                }
            }
        }
        const result = []
        for (const [key, value] of Object.entries(campus_calcul)) {
            const average = value.number == 0 ? null : value.sum / value.number;
            result.push({
                campus: key,
                average: average
            })
        }
        this.campus_ranking = result.sort((a, b) => a.average < b.average ? 1 : -1);
    }

    async loadGlobalRanking() {
        const users = await userRepository.get_users();
        const all_users_rankings = {};
        for (const user of users) {
            const gradeDetail = await gradeService.get_user_grades_details(user.id);
            calculator.eval(gradeDetail);
            for (const semester of Object.values(gradeDetail.semesters)) {
                if (!all_users_rankings[semester.name]) {
                    all_users_rankings[semester.name] = {
                        ranking: [],
                        type: semester.name,
                        modules: {}
                    }
                }
                semester.eval.user = user;
                all_users_rankings[semester.name].date = new Date(); // update the date of the update
                this.insertAt(all_users_rankings[semester.name].ranking, semester.eval); // insert sorted the user eval
                for (const module of Object.values(semester.modules)) {
                    if (!all_users_rankings[semester.name].modules[module.code]) {
                        all_users_rankings[semester.name].modules[module.code] = {
                            ranking: [],
                            type: semester.name + "-" + module.code,
                            subjects: {}
                        }
                    }
                    module.eval.user = user;
                    all_users_rankings[semester.name].modules[module.code].date = new Date(); // update the date of the update
                    this.insertAt(all_users_rankings[semester.name].modules[module.code].ranking, module.eval); // insert sorted the user eval
                    for (const subject of Object.values(module.subjects)){
                        if (!all_users_rankings[semester.name].modules[module.code].subjects[subject.code]) {
                            all_users_rankings[semester.name].modules[module.code].subjects[subject.code] = {
                                ranking: [],
                                type: semester.name + "-" + module.code + "-" + subject.code,
                            }
                        }
                        subject.eval.user = user;
                        all_users_rankings[semester.name].modules[module.code].subjects[subject.code].date = new Date(); // update the date of the update
                        this.insertAt(all_users_rankings[semester.name].modules[module.code].subjects[subject.code].ranking, subject.eval); // insert sorted the user eval   
                    }
                }
            }
        }
        this.global_ranking = all_users_rankings;
    }



    /*-- Utils ---*/
    async findIndex(arr, user_eval) {
        // user_eval.value exist
        if (isNaN(user_eval.value)) {
            return arr.length;
        }
        let low = 0, high = arr.length;
        while (low < high) {
            let mid = (low + high) >>> 1;
            if (isNaN(arr[mid].value) || arr[mid].value < user_eval.value) {
                high = mid
            } else {
                low = mid + 1;
            }
        };
        return low;
    };

    async insertAt(arr = [], user_eval) {
        // user_eval.value exist
        const position = await this.findIndex(arr, user_eval);
        arr.push({});
        for (let i = arr.length - 2; i >= position; i--) {
            arr[i + 1] = arr[i];
        };
        arr[position] = user_eval;
    };

}

module.exports.rankings = new Ranking();

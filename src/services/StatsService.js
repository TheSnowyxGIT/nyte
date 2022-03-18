
const statsRepository = require("../data/StatsRepository")


class Stats {
    constructor(){

        

        this.load()

        setInterval(() => {
            this.load()
        }, 1000 * 60 * 60) // on per hours
    }

    async load(){
        this.daily_connexions = await statsRepository.get_daily_connection();
        this.connexions_number = await statsRepository.get_nb_connexions();
        this.connexions_daily_average = await statsRepository.get_daily_connexions_average()
        this.campus_ranking = await statsRepository.get_campus_ranking()
        this.best_user = await statsRepository.get_best_user();
    }

}

module.exports.stats = new Stats();


module.exports.log_connexion = async (userId) => {
    await statsRepository.log_connexion(userId);
}







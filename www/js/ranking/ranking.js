
function DateBetweenNow(date){
    date = new Date(date);
    var diff = Math.abs(new Date() - date);
    const minutes = Math.ceil(diff / (1000 * 60));
    return "Il y a " + minutes + " minute(s)"
}

class LeaderRow {
    static getHTMLProgress(){
        let obj = $($("#LeaderRowProgress")[0]).clone();
        obj.removeAttr('id');
        return obj;
    }
    static getHTMLData(){
        let obj = $($("#LeaderRowData")[0]).clone();
        obj.removeAttr('id');
        return obj;
    }
    constructor(login, campus, percent, average){
        this.login = login;
        this.campus = campus;
        this.percent = percent;
        this.average = average;
        this.load();
        this.appendTo($(".leaderboard"));
    }

    load(){
        this.obj_progress = LeaderRow.getHTMLProgress();
        this.obj_data = LeaderRow.getHTMLData();

        $(this.obj_progress).get(0).style.setProperty("--value", this.average.toFixed(2));

        $(this.obj_data).find(".leaderboard-name").text(this.login);
        $(this.obj_data).find(".leaderboard-campus").text(this.campus);
        $(this.obj_data).find(".leaderboard-percent").text(this.percent.toFixed(2) + "%");
        $(this.obj_data).find(".leaderboard-value").text(this.average.toFixed(2));
    }

    appendTo(jqueryElt){
        $(this.obj_progress).appendTo(jqueryElt);
        $(this.obj_data).appendTo(jqueryElt);
    }
}


function generate_page() {

    // without the user with no grades
    const filtered_ranking = Object.values(ranking.ranking).filter(elt => {
        return !isNaN(elt.value) && elt.value != null
    });
    // sorted by percent and average
    const sorted_ranking = filtered_ranking.sort((elt1,elt2) => {
        let average1 = elt1.completed_controls / elt1.total_controls * elt1.value;
        let average2 = elt2.completed_controls / elt2.total_controls * elt2.value;
        return average1 < average2 ? 1 : -1;
    })

    sorted_ranking.forEach(elt => {
        let percent = elt.completed_controls / elt.total_controls * 100;
        new LeaderRow(elt.user.login, elt.user.campus, percent, elt.value)
    })
    const ranking_header = $(".ranking-header");
    ranking_header.find(".type").text(ranking.type);
    ranking_header.find(".date").text(DateBetweenNow(ranking.date));
    setInterval(() => {
        ranking_header.find(".date").text(DateBetweenNow(ranking.date));
    }, 1000 * 60)



    let position;
    let is_in = false;
    for (let i = 0; i < sorted_ranking.length; i++){
        let obj = sorted_ranking[i];
        if (obj.user.login == user_login){
            position = i + 1;
            is_in = true;
            break;
        }
    }
    
    let user_list = Object.values(ranking.ranking).filter(elt => {
        return elt.user.login == user_login;
    });
    const user_data = $(".user-data");
    if (user_list.length > 0){
        let user_obj = user_list[0];
        user_data.find(".name").text(user_obj.user.name);
        if (!isNaN(user_obj.value) && user_obj.value != null)
            user_data.find(".average").text(user_obj.value.toFixed(2));
        let percent = user_obj.completed_controls / user_obj.total_controls * 100;
        user_data.find(".percent").text(percent.toFixed(2)+"%");
    }

    if (is_in){
        user_data.find(".position").text(position);
    }
    user_data.find(".total").text("/ " + sorted_ranking.length);
}

$(document).ready(() => {
    generate_page();
})

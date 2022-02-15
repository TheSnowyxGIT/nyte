let prefabs = {};

current_next_rank = 1;

function load_prefabs() {
    // user box
    let box_prefab = $(".user_box")[0];
    return {
        box: box_prefab
    };
}

function clear_boxes() {
    current_next_rank = 1;
    $(".list").empty();
}

function append_box(user) {
    let obj = $(prefabs.box).clone();

    $(obj).find(".rank").find("span").text(current_next_rank);
    current_next_rank += 1;

    const img_url = `https://photos.cri.epita.fr/thumb/${user.login}`;
    $(obj).find(".profile").find("img").attr("src", img_url);
    $(obj).find(".login").find("span").text(user.login);
    
    const format = `${user.actual}/${user.total}`;
    $(obj).find(".progress").find("span").text(format);

    if (user.average){
    	$(obj).find(".average").find("span").text(user.average.toFixed(2));
    } else {
    	$(obj).find(".average").find("span").text("--");
    }

    $(".list").append(obj);
}




function generate_page() {
    if (typeof ranking == "undefined") {
        console.log("ranking undefined");
        return;
    }
    clear_boxes();
    ranking.forEach((obj, index) => {
        append_box(obj);
    });
}




$(document).ready(() => {
    prefabs = load_prefabs();

    generate_page(true);
})



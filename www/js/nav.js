

// execute script after page load
$(document).ready(() => {


    // toggle button
    let toggle = $("#nav .toggle-btn");
    let collapse = $("#nav .collapse");
    $(toggle).on("click", function(event) {
        $(collapse).toggleClass("active")
    })



})

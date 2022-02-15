module.exports.array = (syntax_fct, array) => {
    let good = true;
    if (typeof array !== "object"){
        return false
    }
    Object.values(array).forEach(value => {
        good = good && syntax_fct(value);
    })
    return good;
}

module.exports.string = (value) => {
    return typeof value === 'string';
}

module.exports.notempty_string = (value) => {
    return typeof value === "string" && value !== "";
}

module.exports.user_login = (value) => {
    if (typeof value !== "string" || !value.match("^[-a-zA-Z0-9]*.[-a-zA-Z0-9]*$")) {
        return false;
    }
    return true;
}

module.exports.object = (value) => {
    return typeof value === "object";
}

module.exports.positive_number = (value) => {
    return typeof value === "number" && value >= 0;
}

module.exports.grade = (value) => {
    return typeof value === "number" && value >= 0 && value <= 20;
}

module.exports.id = (value) => {
    return typeof value == "number" && Number.isInteger(value) && value >= 0;
}

module.exports.mail = (value) => {
    return typeof value == "string" && value != "" && value.match("^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
}

module.exports.epita_mail = (value) => {
    return typeof value == "string" && module.exports.mail(value) && value.includes("@epita.fr");
}

module.exports.semester = (value) => {
    return typeof value == "string" && (value.match("^[s][0-9][0-9]?$"));
}

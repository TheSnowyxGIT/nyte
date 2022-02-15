module.exports.types = {
    DestroySessionFailed: { type: "DestroySessionFailed", code: 500 },

    RequestAxiosError: { type: "RequestAxiosError", code: 502 },
    NoResponseAxios: { type: "NoResponseAxios", code: 502 },

    PrismaError: { type: "PrismaError", code: 500 },
    SessionPayloadInvalidSyntax: { type: "SessionPayloadInvalidSyntax", code: 500 },
    SyntaxError: { type: "SyntaxError", code: 403 },

    Unauthorize: { type: "Unauthorize", code: 401 },

    UnknownUser: { type: "UnknownUser", code: 403 },

    UserNotHaveSemester: { type: "UserNotHaveSemester", code: 403 },
    ControlNotExists: {type: "ControlNotExists", code: 403 },

    SCTypeNotExists: {type: "SCTypeNotExists", code: 403 },
    CalculTypeData: {type: "CalculTypeData", code: 403 },
}


module.exports.get_axios = (axios_err) => {
    if (axios_err.response) {
        if (axios_err.response.data) {
            return module.exports.get(module.exports.types.RequestAxiosError, axios_err.response.data);
        }
        else
        {
            return module.exports.get(module.exports.types.RequestAxiosError, axios_err.response);
        }
    } else if (axios_err.request) {
        return module.exports.get(module.exports.types.NoResponseAxios, axios_err);
    } else {
        return module.exports.get(module.exports.types.RequestAxiosError, axios_err);
    }
}

module.exports.get_syntax = (name) => {
    return module.exports.get(module.exports.types.SyntaxError, {
        message: `Syntax error on \`${name}\` or \`${name}\` is missing`
    });
}

module.exports.get_prisma = (err) => {
    return module.exports.get(module.exports.types.PrismaError, err);
}

module.exports.get_syntax_session = (name) => {
    return module.exports.get(module.exports.types.SessionPayloadInvalidSyntax, {
        message: `Syntax error on session \`${name}\` or \`${name}\` is missing`
    });
}

/* express */
module.exports.get = (type, err) => {
    let code = type.code;
    if (typeof err != "object")
    {
        err = {data: err};
    }
    err.type = type.type;
    return { status: code, error: err }
}

module.exports.send = (res, type, err) => {
    const e = this.get(type, err);
    res.status(e.status).json({ status: "ERROR", error: e.error });
}

module.exports.send_err = (res, error) => {
    if (!error || !error.status){
        throw error
    }
    res.status(error.status).json({ status: "ERROR", error: error.error });
}

/* System */
module.exports.throw = (message) => {
    throw new Error(message);
}

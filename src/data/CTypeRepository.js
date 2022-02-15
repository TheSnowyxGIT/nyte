const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const Error = require("../services/entities/Error")


module.exports.ctype_exists = async (ctypeCode) => {
    const ctype = await prisma.controlType.findUnique({
        where: {
            code: ctypeCode
        }
    }).catch(err => {throw Error.get_prisma(err)});
    if (ctype) {
        return true;
    }
    return false;
}

module.exports.get_ctype_by_code = async (ctypeCode) => {
    const ctype = await prisma.controlType.findUnique({
        where: {
            code: ctypeCode
        }
    }).catch(err => {throw Error.get_prisma(err)});
    return ctype;
}



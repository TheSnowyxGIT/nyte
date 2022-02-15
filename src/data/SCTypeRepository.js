const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const Error = require("../services/entities/Error")

module.exports.sctype_exists = async (sctypeId) => {
    const sctype = await prisma.subjectControlType.findUnique({
        where: {
            id: sctypeId
        }
    }).catch(err => {throw Error.get_prisma(err)});
    if (sctype) {
        return true;
    }
    return false;
}

module.exports.get_sctype_by_id = async (sctypeId) => {
    const sctype = await prisma.subjectControlType.findUnique({
        where: {
            id: sctypeId
        }
    }).catch(err => {throw Error.get_prisma(err)});
    if (!sctype){
        throw Error.get(Error.types.SCTypeNotExists, {message: "SubjectControlType does not exists"})
    }
    return sctype;
}

module.exports.get_sctypes_by_subject = async (subjectId) => {
    const sctypes = await prisma.subjectControlType.findMany({
        where: {
            subjectId: subjectId
        }
    }).catch(err => {throw Error.get_prisma(err)});
    return sctypes;
}

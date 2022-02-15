const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const Error = require("../services/entities/Error")

module.exports.subject_exists = async (subjectId) => {
    const subject = await prisma.subject.findUnique({
        where: {
            id: subjectId
        }
    }).catch(err => {throw Error.get_prisma(err)});
    if (subject) {
        return true;
    }
    return false;
}

module.exports.get_subjects_by_module = async (moduleId) => {
    const subjects = await prisma.subject.findMany({
        where: {
            moduleId: moduleId
        }
    }).catch(err => {throw Error.get_prisma(err)});
    return subjects;
}

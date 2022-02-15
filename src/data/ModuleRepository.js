const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const Error = require("../services/entities/Error")

module.exports.module_exists = async (moduleId) => {
    const module = await prisma.module.findUnique({
        where: {
            id: moduleId
        }
    }).catch(err => {throw Error.get_prisma(err)});
    if (module) {
        return true;
    }
    return false;
}

module.exports.get_modules_by_semester = async (semesterId) => {
    const modules = await prisma.module.findMany({
        where: {
            semesterId: semesterId
        }
    }).catch(err => {throw Error.get_prisma(err)});
    return modules;
}

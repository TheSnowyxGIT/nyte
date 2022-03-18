const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const Error = require("../services/entities/Error")

module.exports.user_exists = async (userId) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        }
    }).catch(err => {throw Error.get_prisma(err)});
    if (user) {
        return true;
    }
    return false;
}

module.exports.get_users = async () => {
    const users = await prisma.user.findMany().catch(err => {throw Error.get_prisma(err)});
    return users;
}

module.exports.upsert_user = async (mail, data) => {
    const data_update = Object.assign({}, data);
    delete data_update.login
    delete data_update.email
    const user = await prisma.user.upsert({
        where: {
            email: mail
        },
        update: data_update,
        create: data
    }).catch(err => {throw Error.get_prisma(err)});
    return user;
}


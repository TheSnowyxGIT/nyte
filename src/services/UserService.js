const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const Error = require("./entities/Error")

/**
 * 
 * Get basic user info
 * 
 * @param {*} user_id 
 * @param {*} callback 
 */
module.exports.get_user_minimal_info = async (user_id) => {
    let user = await prisma.user.findUnique({
        where: {
            id: user_id
        },
        include: {
            groups: {}
        }
    });
    return user;
}

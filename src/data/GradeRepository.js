const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const Error = require("../services/entities/Error")

/*
* Repositories
*/
const userRepository = require("./UserRepository")
const controlRepository = require("./ControlRepository")


module.exports.user_has_grade = async (userId, controlId) => {
    const grade = await prisma.grade.findFirst({
        where: {
            controlId: controlId,
            userId: userId
        }
    }).catch(err => { throw Error.get_prisma(err) });
    if (grade) {
        return true;
    }
    return false;
}

module.exports.get_grade = async (userId, controlId) => {
    const grade = await prisma.grade.findFirst({
        where: {
            controlId: controlId,
            userId: userId
        }
    }).catch(err => { throw Error.get_prisma(err) });
    return grade;
}

module.exports.upsert_grade = async (userId, controlId, value) => {
    const data = {
        userId: userId,
        controlId: controlId,
        value: value
    };
    const data_update = Object.assign({}, data);
    delete data_update.userId
    delete data_update.controlId
    let exists = await this.user_has_grade(userId, controlId);
    if (exists) {
        await prisma.grade.updateMany({
            where: {
                controlId: data.controlId,
                userId: data.userId
            },
            data: {
                value: data.value
            }
        }).catch(err => { throw Error.get_prisma(err) })
    } else {
        if (! await userRepository.user_exists(userId)) {
            throw Error.get(Error.types.UnknownUser, { message: "Cannot add the grade due to UnknownUser" })
        }
        if (! await controlRepository.control_exists(controlId)) {
            throw Error.get(Error.types.ControlNotExists, { message: "Cannot add the grade due to ControlNotExists" })
        }

        await prisma.grade.create({
            data: data
        }).catch(err => { throw Error.get_prisma(err) });
    }
}

module.exports.delete_grade = async (userId, controlId) => {
    await prisma.grade.deleteMany({
        where: {
            controlId: controlId,
            userId: userId
        }
    }).catch(err => { throw Error.get_prisma(err) })
}

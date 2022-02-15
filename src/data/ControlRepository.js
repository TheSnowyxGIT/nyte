const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const Error = require("../services/entities/Error")

module.exports.control_exists = async (controlId) => {
    const control = await prisma.control.findUnique({
        where: {
            id: controlId
        }
    }).catch(err => {throw Error.get_prisma(err)});
    if (control) {
        return true;
    }
    return false;
}

module.exports.get_control_by_id = async (controlId) => {
    const control = await prisma.control.findUnique({
        where: {
            id: controlId
        }
    }).catch(err => {throw Error.get_prisma(err)});
    if (!control){
        throw Error.get(Error.types.ControlNotExists, {message: "Control does not exists"})
    }
    return control;
}

module.exports.get_controls_by_scType = async (scType) => {
    const controls = await prisma.control.findMany({
        where: {
            subjectControlTypeId: scType
        }
    }).catch(err => {throw Error.get_prisma(err)});
    return controls;
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const Error = require("./entities/Error")

const calculator = require("@adrien.pgd/grades")

/**
 * Repositories
 */
const gradeRepository = require("../data/GradeRepository")
const groupRepository = require("../data/GroupRepository")
const moduleRepository = require("../data/ModuleRepository")
const subjectRepository = require("../data/SubjectRepository")
const scTypeRepository = require("../data/SCTypeRepository")
const cTypeRepository = require("../data/CTypeRepository")
const controlRepository = require("../data/ControlRepository")


/**
 * Services
 */

module.exports.get_user_semesters = async (userId) => {
    const user_groups = await groupRepository.get_user_groups(userId);
    const semesters = await prisma.semester.findMany({
        where: {
            group_slug: {
                in: user_groups.map(group => group.group_slug)
            }
        }
    }).catch(err => {throw Error.get_prisma(err)});
    const sorted_semesters = semesters.sort((a, b) => a.name < b.name ? -1 : 1);
    return sorted_semesters;
}


module.exports.get_user_grades_details = async (userId) => {
   const semesters = await this.get_user_semesters(userId);
   const user_groups = await groupRepository.get_user_groups(userId);
   const _data = {semesters: []};
   for (const semester of Object.values(semesters)){
        const _semester = {
            id: semester.id,
            name: semester.name,
            modules: []
        }
        const modules = (await moduleRepository.get_modules_by_semester(semester.id)).filter(module => {
            return !module.group_slug || user_groups.some(group => group.group_slug === module.group_slug)
        });
        for (const module of Object.values(modules)){
            const _module = {
                id: module.id,
                name: module.name,
                coef: module.coef,
                subjects: []
            }
            const subjects = (await subjectRepository.get_subjects_by_module(module.id)).filter(subject => {
                return !subject.group_slug || user_groups.some(group => group.group_slug === subject.group_slug)
            });;
            for (const subject of Object.values(subjects)){
                const _subject = {
                    id: subject.id,
                    name: subject.name,
                    coef: subject.coef,
                    threshold: subject.threshold,
                    sctypes: []
                }
                const subjectControlTypes = await scTypeRepository.get_sctypes_by_subject(subject.id);
                for (const sctype of Object.values(subjectControlTypes)) {
                    const controls = await controlRepository.get_controls_by_scType(sctype.id);
                    const ct = await cTypeRepository.get_ctype_by_code(sctype.controlTypeCode);
                    const _sctype = {
                        id: ct.id,
                        name: ct.name,
                        coef: sctype.coef,
                        type: sctype.calcul,
                        typeData: sctype.calculData,
                        controls: []
                    }
                    for (const control of Object.values(controls)) {
                        const _control = {
                            id: control.id,
                            name: control.name,
                            data: control.data,
                        }
                        const user_grade = await gradeRepository.get_grade(userId, control.id);
                        if (user_grade){
                            _control.value = user_grade.value;
                        }
                        _sctype.controls.push(_control);
                    }
                    _subject.sctypes.push(_sctype)
                }
                _module.subjects.push(_subject)
            }
            _semester.modules.push(_module)
        }
        _data.semesters.push(_semester);
   }
   return _data;
}


module.exports.set_grade = async (userId, controlId, value) => {
    const control = await controlRepository.get_control_by_id(controlId);
    const sctype = await scTypeRepository.get_sctype_by_id(control.subjectControlTypeId);
    if (!calculator.checkValueByType(sctype.calcul, value)){
        throw Error.get(Error.types.CalculTypeData, {message: "The type of the sctype is not supported or the data is invalid"})
    }
    return await gradeRepository.upsert_grade(userId, controlId, value);
};

module.exports.reset_grade = async (userId, controlId) => {
    return await gradeRepository.delete_grade(userId, controlId);
};

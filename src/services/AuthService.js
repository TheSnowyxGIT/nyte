

const Error = require("../services/entities/Error");


const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

/**
 *  Repositories
 */
const userRepository = require("../data/UserRepository")
const groupRepository = require("../data/GroupRepository")


/**
 *  Services
 */
const syntaxService = require("../services/SyntaxService");
const microsoftService = require("../services/MicrosoftService");
const criService = require("../services/CriService");

/**
 * 
 * @param {*} microsoft_token 
 * @param {*} callback 
 */
 module.exports.prepare_connexion = (microsoft_token) => {
    return new Promise((resolve, reject) => {
        if (!syntaxService.notempty_string(microsoft_token)) {
            return reject(Error.get_syntax("microsoft_token"));
        }
        microsoftService.get_userinfo(microsoft_token).then(user_data => {
            const mail = user_data.mail;
            const name = user_data.displayName;


            if (!syntaxService.epita_mail(mail)) {
                return reject(Error.get(Error.types.Unauthorize, {
                    message: 'this user is not allow to access because his email do not end by epita.fr',
                }));
            }
            criService.get_userinfo(mail).then(user_data => {
                const login = user_data.login;
                const role = user_data.role;
                const campus = user_data.campus;
                const groups = user_data.groups;

                const data = {
                    name: name,
                    email: mail,
                    login: login,
                    role: role,
                    campus: campus
                }
                save_user(mail, data, groups).then(id => {
                    resolve(id)
                }).catch(err =>{
                    reject(err);
                });
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
}


/**
 * Create / Update the user to the database
 * Return the id of the user
 */
 async function save_user(mail, data, groups) {
    const user = await userRepository.upsert_user(mail, data);
    await groupRepository.upsert_user_groups(user.id, groups);
    return user.id;
}

const axios = require('axios').default;

const Error = require("./entities/Error")

const config = require("../../config.json");

/**
 * Repositories
 */
const GroupRepository = require("../data/GroupRepository")

function get_all_subgroups(slug) {
    let splited_group = slug.split("-");
    let subgroups = [];
    let group = "";
    for (let i = 0; i < splited_group.length - 1; i++) {
        group += splited_group[i];
        subgroups.push(group);
        group += "-";
    }
    return subgroups;
}


/**
 * Get the cri epita groupsinfo
 * The data from cri epita will be arranged
 */
module.exports.get_groupsinfo = () => {
    return new Promise((resolve, reject) => {
        const cri_url = `https://cri.epita.fr/api/v2/groups/?limit=10000&offset=0`;
        const cri_config = {
            headers: {
                "accept": "application/json",
                "X-CSRFToken": `${config.CRI.CSRF_TOKEN}`,
                "authorization": `Basic bHVrYXMuZGVyb256aWVyOlNheG9waG9uZTE=`
            }
        };
        axios.get(cri_url, cri_config).then(result_cri => {
            const groups = result_cri.data.results;

            let groups_maped = Object.values(groups).map(group => {
                return {
                    name: group.name,
                    slug: group.slug,
                    kind: group.kind
                };
            })

            resolve(groups_maped);
        }).catch((err) => {
            return reject(Error.get_axios(err))
        })
    });
}

/**
 * Get the cri epita userinfo
 * The data from cri epita will be arranged
 */
module.exports.get_userinfo = (mail) => {
    return new Promise((resolve, reject) => {
        const cri_url = `https://cri.epita.fr/api/v2/users/search/?emails=${mail}`;
        const cri_config = {
            headers: {
                "accept": "application/json",
                "X-CSRFToken": `${config.CRI.CSRF_TOKEN}`,
                "authorization": `Basic bHVrYXMuZGVyb256aWVyOlNheG9waG9uZTE=`
            }
        };
        axios.get(cri_url, cri_config).then(result_cri => {
            if (result_cri.data.count == 0) {
                return reject(Error.get(Error.types.Unauthorized, {
                    message: 'No account find on the cri Epita for the email given.',
                    email: mail
                }));
            }
            const user = result_cri.data.results[0];

            let user_groups = [];
            // current
            user_groups = user_groups.concat(
                Object.values(user.current_groups).map(group => {
                    return { current: true, group_slug: group.slug };
                })
            )
            // past
            user_groups = user_groups.concat(
                Object.values(user.groups_history).map(gh => {
                    return { current: false, group_slug: gh.group.slug };
                })
            )
            Object.values(user.current_groups).forEach(group => {
                let subgroups = []
                get_all_subgroups(group.slug).forEach(slug => {
                    if (!user_groups.some(group => group.group_slug == slug)) {
                        subgroups.push({ current: true, group_slug: slug });
                    }
                });
                user_groups = user_groups.concat(subgroups);
            });
            Object.values(user.groups_history).forEach(gh => {
                let subgroups = []
                get_all_subgroups(gh.group.slug).forEach(slug => {
                    if (!user_groups.some(group => group.group_slug == slug)) {
                        subgroups.push({ current: false, group_slug: slug });
                    }
                });
                user_groups = user_groups.concat(subgroups);
            });

            const current_groups = user_groups.filter(group => group.current).map(group => group.group_slug);
            let campus = "UNKNOWN";
            if (current_groups.includes("tls")){
                campus = "TOULOUSE"
            } else if (current_groups.includes("prs")){
                campus = "PARIS"
            } else if (current_groups.includes("rns")){
                campus = "RENNES"
            }else if (current_groups.includes("lyn")){
                campus = "LYON"
            } else if (current_groups.includes("stg")){
                campus = "STRASBOURG"
            }

            let role = user.primary_group.slug;
            if (role === "students")
                role = "STUDENT";
            else if (role === "administratives")
                role = "ADMIN";
            else if (role === "teachers")
                role = "TEACHER";
            else
                role = "UNKNOWN";

            const data = {
                login: user.login,
                role: role,
                groups: user_groups,
                campus: campus
            }
            resolve(data);
        }).catch((err) => {
            return reject(Error.get(Error.types.InternRequestFailed, {
                message: 'Request to the cri epita api failed.',
                error: err
            }));
        })
    });
}

/**
 * Update the database.
 * Fill the database by the groups getted from the cri api
 */
module.exports.update_groups = async () => {
    const groups = await module.exports.get_groupsinfo();
    await GroupRepository.remove_old_groups(groups);
    await GroupRepository.upsert_groups(groups);
}

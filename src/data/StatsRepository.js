const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const Error = require("../services/entities/Error")


module.exports.log_connexion = async (userLogin) => {
    await prisma.connexion.create({
        data: { userLogin: userLogin }
    }).catch(err => { throw Error.get_prisma(err) });
}

module.exports.get_nb_connexions = async () => {
    const nb_connexions = await prisma.$queryRaw`SELECT sum(a.count) AS count 
        FROM (
             SELECT count(DISTINCT userLogin) AS count 
             FROM Connexion
             GROUP BY TO_CHAR(createAt, 'YYYY-MM-DD')) AS a
        `;
    return nb_connexions[0].count;
}

module.exports.get_daily_connexions_average = async () => {
    const average = await prisma.$queryRaw`SELECT sum(a.count) / count(*) AS count 
    FROM (
         SELECT count(DISTINCT userLogin) AS count 
         FROM Connexion
         GROUP BY TO_CHAR(createAt, 'YYYY-MM-DD')) AS a
        `;
    return average[0].count;
}

module.exports.get_campus_ranking = async () => {
    const campus = await prisma.$queryRaw`SELECT u.campus AS campus, count(u.campus) AS count FROM Connexion AS st
        JOIN User AS u ON u.login = st.userLogin
        GROUP BY u.campus
        ORDER BY count(u.campus) DESC
        `;
    return campus;
}

module.exports.get_best_user = async () => {
    const user = await prisma.$queryRaw`SELECT u.name AS name FROM Connexion AS st
        JOIN User AS u ON u.login = st.userLogin
        WHERE u.login != 'adrien.pingard'
        GROUP BY u.login
        ORDER BY count(u.login) DESC
        LIMIT 1
        `;
    return user[0].name;
}


module.exports.get_daily_connection = async () => {
    const daily_connexions = await prisma.$queryRaw`SELECT
            to_char(createAt, 'YYYY-MM-DD') AS date,
            COUNT(DISTINCT userLogin) AS count
        FROM
            Connexion
        GROUP BY
            to_char(createAt, 'YYYY-MM-DD')
        ORDER BY
            to_char(createAt, 'YYYY-MM-DD')
        DESC`;
    return daily_connexions;
}

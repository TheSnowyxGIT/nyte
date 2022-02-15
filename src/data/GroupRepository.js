const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const Error = require("../services/entities/Error")

module.exports.user_has_group = async (userId, slug) => {
    const userGroup = await prisma.userGroup.findFirst({
        where: {
            group_slug: slug,
            userId: userId
        }
    }).catch(err => {throw Error.get_prisma(err)});
    if (userGroup) {
        return true;
    }
    return false;
}

module.exports.upsert_user_groups = async (userId, groups) => {
    const promiseArray = []
    for (const group of Object.values(groups)) {
        group.userId = userId;
        let exists = await this.user_has_group(group.userId, group.group_slug);
        if (exists) {
            let promise = prisma.userGroup.updateMany({
                where: {
                    group_slug: group.group_slug,
                    userId: group.userId
                },
                data: {
                    current: group.current
                }
            });
            promiseArray.push(promise);
        } else {
            if (await this.group_exists(group.group_slug)) {
                let promise = prisma.userGroup.create({
                    data: group
                });
                promiseArray.push(promise);
            }
        }
    }
    const res = await prisma.$transaction(promiseArray).catch(err => {throw Error.get_prisma(err)});
    return res;
}

module.exports.get_user_groups = async (userId) => {
    const groups = await prisma.userGroup.findMany({
        where: {
            userId: userId
        }
    }).catch(err => {throw Error.get_prisma(err)});
    return groups;
}



module.exports.group_exists = async (slug) => {
    const group = await prisma.group.findUnique({
        where: {
            slug: slug
        }
    }).catch(err => {throw Error.get_prisma(err)});
    if (group) {
        return true;
    }
    return false;
}


module.exports.remove_old_groups = async (current_groups) => {
    const groups = await prisma.group.findMany();
    const groups_filtered = groups.filter(group => {
        const value = Object.values(current_groups).find(g => g.slug === group.slug)
        return typeof value === "undefined";
    })
    await prisma.group.deleteMany({
        where: {
            slug: {
                in: groups_filtered.map(g => g.slug)
            }
        }
    }).catch(err => {throw Error.get_prisma(err)});
}

module.exports.upsert_groups = async (groups) => {
    const promiseArray = []
    Object.values(groups).forEach(group => {
        const group_update = Object.assign({}, group);
        delete group_update.slug;
        const promise = prisma.group.upsert({
            where: {
                slug: group.slug
            },
            update: group_update,
            create: group
        });
        promiseArray.push(promise);
    })
    const res = await prisma.$transaction(promiseArray).catch(err => {throw Error.get_prisma(err)});
    return res;
}

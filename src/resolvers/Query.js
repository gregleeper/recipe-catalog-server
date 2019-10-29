import getUserId from "../utils/getUserId";

const Query = {
  async users(parent, args, { prisma }, info) {
    const opArgs = {
      first: args.first,
      skip: args.skip,
      after: args.after,
      orderBy: args.orderBy
    };

    if (args.query) {
      opArgs.where = {
        OR: [
          {
            name_contains: args.query
          }
        ]
      };
    }
    return await prisma.query.users(opArgs, info);
  },
  async user(parent, args, { prisma }, info) {
    return await prisma.query.user({ where: { id: args.where.id } }, info);
  },
  async me(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    return await prisma.query.user(
      {
        where: {
          id: userId
        }
      },
      info
    );
  },
  async categories(parent, args, { prisma, request }, info) {
    const opArgs = {
      first: args.first,
      skip: args.skip,
      after: args.after,
      orderBy: args.orderBy
    };

    if (args.query) {
      opArgs.where = {
        OR: [
          {
            name_contains: args.query
          }
        ]
      };
    }

    return await prisma.query.categories(opArgs, info);
  },
  async category(parent, args, { prisma, request }, info) {
    return await prisma.query.category(
      {
        where: {
          id: args.where.id
        }
      },
      info
    );
  },
  async recipes(parent, args, { prisma, request }, info) {
    const opArgs = {
      first: args.first,
      skip: args.skip,
      after: args.after,
      orderBy: args.orderBy
    };

    if (args.query) {
      opArgs.where = {
        OR: [
          {
            title_contains: args.query
          }
        ]
      };
    }

    return await prisma.query.recipes(opArgs, info);
  },
  async recipe(parent, args, { prisma, request }, info) {
    return await prisma.query.recipe(
      {
        where: {
          id: args.where.id
        }
      },
      info
    );
  }
};

export { Query as default };

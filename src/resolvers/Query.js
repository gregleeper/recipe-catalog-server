import getUserId from "../utils/getUserId";

const Query = {
  users(parent, args, { prisma }, info) {
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

    return prisma.query.users(opArgs, info);
  },
  me(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    return prisma.query.user({
      where: {
        id: userId
      }
    });
  },
  categories(parent, args, { prisma, request }, info) {
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

    return prisma.query.categories(opArgs, info);
  },
  category(parent, args, { prisma, request }, info) {
    return prisma.query.category(
      {
        where: {
          id: args.where.id
        }
      },
      info
    );
  },
  recipes(parent, args, { prisma, request }, info) {
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

    return prisma.query.recipes(opArgs, info);
  },
  recipe(parent, args, { prisma, request }, info) {
    return prisma.query.recipe(
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

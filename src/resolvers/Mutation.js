import bcrypt from "bcryptjs";
import getUserId from "../utils/getUserId";
import generateToken from "../utils/generateToken";
import hashPassword from "../utils/hashPassword";
import aws from "aws-sdk";

const s3 = new aws.S3({
  accessKeyId: "foo",
  secretAccessKey: "bar",
  params: {
    Bucket: "com.prisma.s3"
  },
  endpoint: new aws.Endpoint("http://localhost:4569") // fake s3 endpoint for local dev
});

const Mutation = {
  async createUser(parent, args, { prisma }, info) {
    const password = await hashPassword(args.data.password);
    const user = await prisma.mutation.createUser({
      data: {
        ...args.data,
        password
      }
    });

    return {
      user,
      token: generateToken(user.id)
    };
  },
  async login(parent, args, { prisma }, info) {
    const user = await prisma.query.user({
      where: {
        email: args.data.email
      }
    });

    if (!user) {
      throw new Error("Unable to login");
    }

    const isMatch = await bcrypt.compare(args.data.password, user.password);

    if (!isMatch) {
      throw new Error("Unable to login");
    }

    return {
      user,
      token: generateToken(user.id)
    };
  },
  async deleteUser(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    return prisma.mutation.deleteUser(
      {
        where: {
          id: userId
        }
      },
      info
    );
  },
  async updateUser(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    if (typeof args.data.password === "string") {
      args.data.password = await hashPassword(args.data.password);
    }

    return prisma.mutation.updateUser(
      {
        where: {
          id: userId
        },
        data: args.data
      },
      info
    );
  },
  async createCategory(parent, args, { prisma, request }, info) {
    return prisma.mutation.createCategory({ data: args.data }, info);
  },
  async deleteCategory(parent, args, { prisma, request }, info) {
    return prisma.mutation.deleteCategory(
      {
        where: {
          id: args.where.id
        }
      },
      info
    );
  },
  async updateCategory(parent, args, { prisma, request }, info) {
    return prisma.mutation.updateCategory(
      {
        where: {
          id: args.where.id
        },
        data: args.data
      },
      info
    );
  },
  async createRecipe(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);
    return await prisma.mutation.createRecipe(
      { data: { ...args.data, author: { connect: { id: userId } } } },
      info
    );
  },
  deleteRecipe(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);
    const recipeExists = prisma.exists.Recipe({
      id: args.where.id,
      author: {
        id: userId
      }
    });
    if (recipeExists) {
      return prisma.mutation.deleteRecipe(
        { where: { id: args.where.id } },
        info
      );
    }
    throw new Error(
      "Recipe does not exist or you must be the author to delete the recipe."
    );
  },
  updateRecipe(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);
    const recipeExists = prisma.exists.Recipe({
      id: args.where.id,
      author: { id: userId }
    });

    if (recipeExists) {
      return prisma.mutation.updateRecipe(
        {
          where: { id: args.where.id },
          data: args.data
        },
        info
      );
    }
    throw new Error(
      "Recipe does not exist or you must be the author to update."
    );
  },
  async uploadImage(parent, { file }, ctx, info) {
    try {
      const { stream, filename } = await file;
      const result = await s3.upload({ stream, filename });
      console.log(result);
      return result;
    } catch (err) {
      throw new Error("upload error: ", err);
    }
  },
  async renameImage(parent, { id, name }, { prisma, request }, info) {
    return await prisma.mutation.updateImage({
      data: { name },
      where: { id },
      info
    });
  },

  async deleteImage(parent, { id }, { prisma, request }, info) {
    return await prisma.mutation.deleteImage({ where: { id } }, info);
  }
};

export { Mutation as default };

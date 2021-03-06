import bcrypt from "bcryptjs";
import getUserId from "../utils/getUserId";
import generateToken from "../utils/generateToken";
import hashPassword from "../utils/hashPassword";
import aws from "aws-sdk";
import uuid from "uuid/v4";

const s3 = new aws.S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  params: {
    Bucket: "leeper-family-cookbook"
  }
  //   endpoint: new aws.Endpoint(
  //     "https://s3.console.aws.amazon.com/s3/buckets/leeper-family-cookbook/"
  //   ) // fake s3 endpoint for local dev
  //
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
    const userExists = prisma.exists.User({
      where: {
        id: args.where.id
      }
    });
    if (userExists) {
      return prisma.mutation.deleteUser(
        {
          where: {
            id: userId,
            id: args.where.id
          }
        },
        info
      );
    }
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
    throw new Error("User does not exist or is not found.");
  },
  async createTag(parent, args, {prisma, request}, info) {
    return prisma.mutation.createTag({data: args.data}, info);
  },
  async deleteTag(parent, args, { prisma, request }, info) {
    return prisma.mutation.deleteTag(
      {
        where: {
          id: args.where.id
        }
      },
      info
    );
  },
  async updateTag(parent, args, { prisma, request }, info) {
    return prisma.mutation.updateTag(
      {
        where: {
          id: args.where.id
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
  async updateRecipe(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);
    const recipeExists = await prisma.exists.Recipe({
      id: args.where.id,
      author: { id: userId }
    });
    console.log("args: ", args);
    if (recipeExists) {
      try {
        return await prisma.mutation.updateRecipe(
          {
            where: { id: args.where.id },
            data: args.data
          },
          info
        );
      } catch (error) {
        throw new Error(error);
      }
    }
    throw new Error(
      "Recipe does not exist or you must be the author to update."
    );
  },
  async uploadImage(parent, { file }, { prisma, request }, info) {
    const { createReadStream, filename, mimetype, encoding } = await file;
    const stream = createReadStream();

    const key = uuid() + "-" + filename;
    const result = await s3
      .upload(
        {
          Bucket: "leeper-family-cookbook",
          Key: key,
          ACL: "public-read",
          Body: stream
        },
        function(err, data) {
          if (err) {
            console.log(err);
          }
          if (data) {
            console.log(data);
          }
        }
      )
      .promise();
    return await prisma.mutation.createFile(
      {
        data: {
          filename: result.key,
          url: result.Location,
          mimetype,
          encoding
        }
      },
      info
    );
  },
  async createFile(parent, args, { prisma, reequest }, info) {
    return await prisma.mutation.createFile(
      {
        data: args.data
      },
      info
    );
  },

  async renameImage(parent, { id, name }, { prisma, request }, info) {
    return await prisma.mutation.updateImage({
      data: { name },
      where: { id },
      info
    });
  },
  async deleteImage(parent, args, { prisma, request }, info) {
    return await prisma.mutation.deleteFile(
      { where: { id: args.where.id } },
      info
    );
  },
  async deleteManyImages(parent, args, { prisma, request }, info) {
    return await prisma.mutation.deleteManyFiles(
      { where: { url_contains: args.where.url_contains } },
      info
    );
  }
};

export { Mutation as default };

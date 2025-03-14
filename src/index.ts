import { neon } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { users } from "./db/schema";
import { createSchema, createYoga } from "graphql-yoga";
import { getContext, contextStorage } from "hono/context-storage";
import * as dbSchema from "./db/schema";
import { logger } from "hono/logger";

type HonoBindings = {
  DATABASE_URL: string;
};

type HonoVariables = {
  dbConnectionString: string;
};

type YogaContext = {
  db: NeonHttpDatabase<typeof dbSchema>;
};

const app = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables }>();

app.use(logger());
app.use(contextStorage());

app.use(async (c, next) => {
  c.set("dbConnectionString", c.env.DATABASE_URL);
  return next();
});

const schema = createSchema({
  typeDefs: /* graphql */ `
    type Query {
      getUser(id: String!): User
    }

    type User {
      id: String!
      first_name: String!
      last_name: String!
      email: String!
      createdAt: String!
    }
  `,
  resolvers: {
    Query: {
      getUser: async (
        _: unknown,
        { id }: { id: string },
        context: YogaContext
      ) => {
        const user = await context.db
          .select()
          .from(users)
          .where(eq(users.id, id));
        console.log("user", JSON.stringify(user, null, 2));
        return user[0];
      },
    },
  },
});

const yoga = createYoga<YogaContext>({
  schema,
  graphqlEndpoint: "/graphql",
});

// Handle GraphQL requests with proper DB connection
app.use("/graphql", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db: NeonHttpDatabase<typeof dbSchema> = drizzle(sql);

  const yogaHandler = async (request: Request) => {
    const response = await yoga.handleRequest(request, {
      db,
    });
    return response;
  };

  return yogaHandler(c.req.raw);
});

export default app;

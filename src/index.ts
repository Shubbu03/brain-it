import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { ContentModel, dbConnect, LinkModel, UserModel } from "./db";
import { z } from "zod";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { userMiddleware } from "./middleware";
dotenv.config();
const app = express();
app.use(express.json());

app.post("/api/v1/signup", async (req: Request, res: Response) => {
  const userZodAuth = z.object({
    username: z.string().nonempty("Username is required"),
    password: z
      .string()
      .min(4, "Password should have at least 4 characters")
      .max(16, "Password can't have more than 16 characters"),
  });

  try {
    const { username, password } = userZodAuth.parse(req.body);

    // const existingUser = await UserModel.findOne({ username });

    // if (existingUser) {
    //   return res.status(409).json({
    //     message: "Username already exists. Please choose another one.",
    //   });
    // }

    const newUser = await UserModel.create({
      username: username,
      password: password,
    });

    res.status(201).json({
      message: "New User added successfully",
      user: { username: newUser.username },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation failed",
        errors: error.errors.map((err) => ({
          path: err.path,
          message: err.message,
        })),
      });
    } else {
      console.error("Error during user creation:", error);
      res.status(500).json({
        message: "An error occurred while creating the user",
        error: error instanceof Error ? error.message : error,
      });
    }
  }
});

app.post("/api/v1/signin", async (req: Request, res: Response) => {
  const userZodAuth = z.object({
    username: z.string().nonempty("Username is required"),
    password: z
      .string()
      .min(4, "Password should have at least 4 characters")
      .max(16, "Password can't have more than 16 characters"),
  });

  try {
    const { username, password } = userZodAuth.parse(req.body);

    const existingUser = await UserModel.findOne({ username, password });

    if (existingUser) {
      const token = jwt.sign(
        { id: existingUser._id },
        process.env.JWT_PASSWORD || "",
        { expiresIn: "1h" }
      );

      res.status(200).json({
        message: "User logged in successfully",
        token,
      });
    } else {
      res.status(403).json({
        message: "Incorrect credentials",
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation failed",
        errors: error.errors.map((err) => ({
          path: err.path,
          message: err.message,
        })),
      });
    } else {
      res.status(500).json({
        message: "An error occurred while processing your request",
        error: error instanceof Error ? error.message : error,
      });
    }
  }
});

app.post(
  "/api/v1/content",
  userMiddleware,
  async (req: Request, res: Response) => {
    const link = req.body.link;
    const type = req.body.type;
    const title = req.body.title;

    const newContent = await ContentModel.create({
      link,
      type,
      title,
      userId: req.userId,
    });

    if (newContent) {
      res.status(201).json({
        message: "New Content added to brain successfully",
        newContent,
      });
    } else {
      res.status(403).json({
        message: "Error updating your brain!!",
      });
    }
  }
);

app.get(
  "/api/v1/content",
  userMiddleware,
  async (req: Request, res: Response) => {
    const userId = req.userId;
    const userData = await ContentModel.find({
      userId: userId,
    }).populate("userId", "username");
    if (userData) {
      res.status(201).json({
        data: userData,
      });
    } else {
      res.status(404).json({
        message: "Error finding content with given userID",
      });
    }
  }
);

app.delete(
  "/api/v1/content",
  userMiddleware,
  async (req: Request, res: Response) => {
    const contentId = req.body.contentId;

    const deletedData = await ContentModel.deleteOne({
      _id: contentId,
      userId: req.userId,
    });

    if (deletedData) {
      res.status(201).json({
        message: "Data deleted from brain",
      });
    } else {
      res.status(403).json({
        message: "Error deleting data from brain!!",
      });
    }
  }
);

app.post(
  "/api/v1/brain/share",
  userMiddleware,
  async (req: Request, res: Response) => {
    const { contentId } = req.body;

    if (!contentId) {
      res.status(400).json({ message: "Content ID is required." });
    }

    const hash = crypto.randomBytes(16).toString("hex");

    const newLink = await LinkModel.create({
      hash,
      userId: req.userId,
      contentId: contentId,
    });

    if (newLink) {
      const shareableUrl = `${process.env.BASE_URL}/shared/${hash}`;

      res.status(201).json({
        message: "Content shared successfully.",
        shareableUrl,
      });
    } else {
      res.status(500).json({
        message: "An error occurred while creating the shared link.",
      });
    }
  }
);

app.get(
  " /api/v1/brain/:shareLink",
  userMiddleware,
  async (req: Request, res: Response) => {
    const { shareLink } = req.params;

    const link = await LinkModel.findOne({ hash: shareLink }).populate(
      "userId"
    );

    if (!link) {
      res.status(404).json({ message: "Invalid or expired link." });
    }

    const content = await ContentModel.findById(link?.contentId);

    if (!content) {
      res.status(404).json({ message: "Content not found." });
    }

    res.status(200).json({
      message: "Content retrieved successfully.",
      content,
    });
  }
);

const main = async () => {
  try {
    const isConnected = await dbConnect();
    if (isConnected) {
      app.listen(process.env.PORT, () => {
        console.log(`Server started at port ${process.env.PORT}`);
      });
    } else {
      console.log("An error occurred while connecting to the database.");
      return;
    }
  } catch (err) {
    console.log("An error occurred while running the program!!", err);
    return;
  }
};

main();

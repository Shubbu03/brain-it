import mongoose, { Schema, Model, model } from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const dbConnect = async (): Promise<Boolean> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("Database connected successfully!");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
};

enum contentTypes {
  "image",
  "video",
  "article",
  "audio",
}

const userSchema = new Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const contentSchema = new Schema({
  link: { type: String, required: true },
  type: { type: String, enum: contentTypes, required: true },
  title: { type: String, required: true },
  tags: [{ type: mongoose.Types.ObjectId, ref: "Tag" }],
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
});

const tagSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
});

const linkSchema = new Schema({
  hash: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  contentId: { type: mongoose.Types.ObjectId, ref: "Content", required: true },
});

export const UserModel = model("User", userSchema);
export const ContentModel = model("Content", contentSchema);
export const TagModel = model("Tag", tagSchema);
export const LinkModel = model("Link", linkSchema);

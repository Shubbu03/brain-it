import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const userMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const headers = req.headers["authorization"];

  try {
    const decoded = jwt.verify(
      headers as string,
      process.env.JWT_PASSWORD || ""
    ) as { id: string };

    if (decoded) {
      req.userId = decoded.id;
      next();
    } else {
      res.status(403).json({
        message: "Invalid token! Try again.",
      });
    }
  } catch (error) {
    res.status(403).json({
      message: "Invalid token! Try again.",
      error: error instanceof Error ? error.message : error,
    });
  }
};

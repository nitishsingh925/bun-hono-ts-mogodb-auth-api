import type { Context } from "hono";
import User from "../models/user.models";

interface IUser {
  name: string;
  userName: string;
  email: string;
  password: string;
}

export const signup = async (c: Context) => {
  try {
    const { name, userName, email, password }: IUser = await c.req.json();

    // Validate the request
    if (!name || !userName || !email || !password) {
      return c.json({ message: "All fields are required" }, 400);
    }

    // Check if user with the given email,username or password blank (empty) exists
    if ([email, userName, password].some((field) => field?.trim() === "")) {
      return c.json({ message: "All fields are required" }, 400);
    }

    // Check if the user already exists
    const existedUser = await User.findOne({ $or: [{ email }, { userName }] });
    if (existedUser) return c.json({ message: "User already exists" }, 409);

    // Hash the password
    const hashPassword = await Bun.password.hash(password);

    // Capitalize the name
    const capitalizeName = (name: string) => {
      return name.replace(/\b\w/g, (char) => char.toUpperCase());
    };

    // Create a new user instance
    const user = new User({
      userName: userName.toLowerCase(),
      name: capitalizeName(name),
      email: email.toLowerCase(),
      password: hashPassword,
    });

    // Save the user to the database
    await user.save();

    //  Create a new user instance without password
    const createdUser = await User.findById(user._id).select("-password");

    // Return a successful response
    return c.json(
      { message: "User created successfully", user: createdUser },
      201
    );
  } catch (error) {
    // Return an error response
    return c.json({ message: `Internal server error ${error}` });
  }
};

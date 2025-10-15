import { User } from "./users.model";

export const getUsers = async () => {
  try {
    const users = await User.findAll({
      where: { hideInLogin: false },
      attributes: ["id", "username", "type", "avatar"], // Exclude sensitive fields like password
    });
    return users;
  } catch (err) {
    console.error("[Users]: Error fetching public user list:", err);
    return [];
  }
};

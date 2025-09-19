import bcrypt from "bcrypt";
import { TPreviousPasswords } from "../modules/user/user.interface";
import moment from "moment";
import config from "../config";

export const hashPassword = async (password: string) => {
  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds as string)
  );
  return hashedPassword;
};

export const compareHashPassword = async (
  plainPass: string,
  hashPass: string
) => {
  return await bcrypt.compare(plainPass, hashPass);
};

export const checkCurrentPasswordToPreviousPassword = async (
  newPass: string,
  previousPass: TPreviousPasswords[]
) => {
  let match;
  for (const passObj of previousPass) {
    const matchedPassword = await compareHashPassword(
      newPass,
      passObj.password
    );
    if (matchedPassword) {
      match = moment(passObj.createdAt).format("YYYY-MM-DD [at] hh:mm A");
    }
  }
  return match;
};

export const getPreviousPasswords = async (
  previousPass: TPreviousPasswords[]
) => {
  const sortingLastPassword = previousPass.sort(
    (x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime()
  );
  return sortingLastPassword[0];
};

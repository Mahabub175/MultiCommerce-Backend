import nodemailer from "nodemailer";

export const sendEmail = async (to: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com.",
    port: 587,
    secure: false,
    auth: {
      user: "equlibrium1705@gmail.com",
      pass: "dpqz ongs hltn hhll",
    },
  });

  await transporter.sendMail({
    from: "equlibrium1705@gmail.com",
    to,
    subject: "Reset your password!",
    text: "",
    html: `<br/> <br/> <b>Reset your password within ten mins!</b> <br /> <br /> ${html}`,
  });
};

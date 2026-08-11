import nodemailer from "nodemailer";

export const sendEmail = async (
  email: string,
  resetUrl: string,
  subject: string,
) => {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USERNAME, EMAIL_PASSWORD } =
    process.env;

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: EMAIL_HOST,
    port: +EMAIL_PORT!,
    secure: true,
    auth: {
      user: EMAIL_USERNAME,
      pass: EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: "Amir Aghayari <amiraghayari2119@gmail.com>",
    to: email,
    subject: subject,
    // text: resetUrl,
    html: `
<div style="background:#f7fafc;padding:60px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial;">

<div style="
max-width:620px;
margin:auto;
background:#ffffff;
border-radius:16px;
overflow:hidden;
border:1px solid #e5e7eb;
">

<div style="
padding:28px;
background:#635bff;
text-align:center;
">

<h1 style="
margin:0;
color:white;
font-size:28px;
">
Reset Password
</h1>

</div>

<div style="
padding:45px;
direction:rtl;
text-align:right;
">

<h2 style="margin-top:0;">
سلام 👋
</h2>

<p style="
line-height:32px;
color:#4b5563;
font-size:16px;
">

Click the button below to recover your password.

</p>

<div style="
text-align:center;
margin:45px 0;
">

<a
href="${resetUrl}"
style="
background:#635bff;
padding:15px 36px;
color:white;
text-decoration:none;
border-radius:10px;
font-weight:600;
display:inline-block;
">

Password recovery

</a>

</div>

<p style="color:#6b7280;">
This link will be valid for <strong>10 minutes</strong>.
</p>

<p style="font-size:13px;color:#9ca3af;">
If this request was not filed by you, please ignore this email.
</p>

</div>

</div>

</div>
`,
  };

  await transporter.sendMail(mailOptions);
};

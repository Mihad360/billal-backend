export const workerInviteEmailTemplate = ({
  name,
  email,
  password,
  companyName,
}: {
  name?: string;
  email: string;
  password: string;
  companyName?: string;
}) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Welcome to ${companyName || "our company"} 🎉</h2>

      <p>Hello ${name || "there"},</p>

      <p>
        You have been added as an employee to <strong>${
          companyName || "our system"
        }</strong>.
      </p>

      <p><strong>Your login credentials:</strong></p>

      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>

      <p style="color: red;">
        ⚠️ For security reasons, please change your password after logging in.
      </p>

      <br />
      <p>Thanks,<br/>${companyName || "Team"}</p>
    </div>
  `;
};

/** Minimal inline-styled templates. Email clients ignore <style> blocks, so styles are inline. */

const wrap = (appName, bodyHtml) => `
<!doctype html>
<html><body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:14px;padding:32px;">
        <tr><td>
          <div style="font-size:18px;font-weight:700;color:#4F46E5;margin-bottom:24px;">${appName}</div>
          ${bodyHtml}
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />
          <p style="font-size:12px;color:#94a3b8;margin:0;">
            If you did not expect this email you can safely ignore it.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

const button = (label, link) => `
  <a href="${link}" style="display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;
     padding:12px 24px;border-radius:10px;font-weight:600;">${label}</a>
  <p style="font-size:13px;color:#475569;margin-top:20px;">
    Or paste this link into your browser:<br />
    <span style="word-break:break-all;color:#4F46E5;">${link}</span>
  </p>`;

const templates = {
  verifyEmail: ({ name, link, appName }) => ({
    html: wrap(
      appName,
      `<h1 style="font-size:22px;color:#0f172a;margin:0 0 12px;">Welcome, ${name}</h1>
       <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 24px;">
         Confirm your email address to activate your account.</p>
       ${button('Verify email', link)}`
    ),
    text: `Welcome, ${name}. Verify your email: ${link}`,
  }),

  resetPassword: ({ name, link, appName, minutes }) => ({
    html: wrap(
      appName,
      `<h1 style="font-size:22px;color:#0f172a;margin:0 0 12px;">Reset your password</h1>
       <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 24px;">
         Hi ${name}, use the button below to set a new password.
         This link expires in ${minutes} minutes.</p>
       ${button('Reset password', link)}`
    ),
    text: `Hi ${name}, reset your password (expires in ${minutes} min): ${link}`,
  }),

  mentorInvite: ({ mentorName, studentName, projectTitle, link, appName }) => ({
    html: wrap(
      appName,
      `<h1 style="font-size:22px;color:#0f172a;margin:0 0 12px;">You have been invited to mentor</h1>
       <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 24px;">
         Hi ${mentorName}, ${studentName} has invited you to review
         <strong>${projectTitle}</strong>.</p>
       ${button('Open project', link)}`
    ),
    text: `${studentName} invited you to mentor "${projectTitle}": ${link}`,
  }),
};

export const renderTemplate = (name, data) => {
  const template = templates[name];
  if (!template) throw new Error(`Unknown email template: ${name}`);
  return template(data);
};

export default renderTemplate;

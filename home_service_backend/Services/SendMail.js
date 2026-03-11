const nodemailer = require("nodemailer");

const sendMail = async (toEmail, Subject, mailOptions) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "fixii.home.services@gmail.com",        // your gmail
                pass: "wspfxiqwmpicykgj"               // Gmail App Password (NOT normal password)
            }
        });

        await transporter.sendMail(mailOptions);

        return { Status: "OK", Result: "Mail Sent Successfully" };

    } catch (error) {
        return { Status: "Fail", Result: error.message };
    }
};

const createAccountTemplate = (Name, UserName, Passwd, toEmail) => {
    return {
        from: '"FixIt Admin Panel" <fixii.home.services@gmail.com>',
        to: toEmail,
        subject: "Welcome to FixIt - Admin Account Created",
        html: `
        <div style="margin:0; padding:0; background-color:#f4f6f9; font-family:Arial, sans-serif;">
            <table align="center" width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; box-shadow:0 4px 15px rgba(0,0,0,0.08); overflow:hidden;">
                            
                            <!-- Header -->
                            <tr>
                                <td style="background:#1e88e5; padding:20px; text-align:center;">
                                    <h2 style="color:#ffffff; margin:0;">FixIt Admin Panel</h2>
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="padding:30px;">
                                    <h3 style="margin-top:0; color:#333;">Hello ${Name},</h3>
                                    
                                    <p style="color:#555; font-size:14px;">
                                        Your admin account has been successfully created. Below are your login credentials:
                                    </p>

                                    <table width="100%" cellpadding="10" cellspacing="0" style="background:#f4f6f9; border-radius:6px; margin:20px 0;">
                                        <tr>
                                            <td style="font-weight:bold; color:#333;">Username / Email:</td>
                                            <td style="color:#555;">${UserName}</td>
                                        </tr>
                                        <tr>
                                            <td style="font-weight:bold; color:#333;">Password:</td>
                                            <td style="color:#555;">${Passwd}</td>
                                        </tr>
                                    </table>

                                    <p style="color:#777; font-size:13px;">
                                        For security reasons, please change your password after your first login.
                                    </p>

                                    <!-- Button -->
                                    <div style="text-align:center; margin:30px 0;">
                                        <a href="#" 
                                           style="background:#1e88e5; color:#ffffff; padding:12px 25px; text-decoration:none; border-radius:5px; font-size:14px; display:inline-block;">
                                           Login Now
                                        </a>
                                    </div>

                                    <p style="font-size:12px; color:#999;">
                                        If you did not request this account, please contact support immediately.
                                    </p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background:#f4f6f9; padding:15px; text-align:center; font-size:12px; color:#999;">
                                    © ${new Date().getFullYear()} FixIt. All rights reserved.
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </div>
        `
    };
};

const forgotPasswordTemplate = (Name, newPassword, toEmail) => {
    return {
        from: '"FixIt Admin Panel" <fixii.home.services@gmail.com>',
        to: toEmail,
        subject: "FixIt - Password Reset Successful",
        html: `
        <div style="margin:0; padding:0; background-color:#f4f6f9; font-family:Arial, sans-serif;">
            <table align="center" width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; box-shadow:0 4px 15px rgba(0,0,0,0.08); overflow:hidden;">
                            
                            <!-- Header -->
                            <tr>
                                <td style="background:#ff7043; padding:20px; text-align:center;">
                                    <h2 style="color:#ffffff; margin:0;">Password Reset</h2>
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="padding:30px;">
                                    <h3 style="margin-top:0; color:#333;">Hello ${Name},</h3>
                                    
                                    <p style="color:#555; font-size:14px;">
                                        Your password has been successfully reset. Please use the new password below to login:
                                    </p>

                                    <table width="100%" cellpadding="10" cellspacing="0" style="background:#fff3e0; border-radius:6px; margin:20px 0;">
                                        <tr>
                                            <td style="font-weight:bold; color:#333;">New Password:</td>
                                            <td style="color:#d84315; font-weight:bold;">${newPassword}</td>
                                        </tr>
                                    </table>

                                    <p style="color:#777; font-size:13px;">
                                        ⚠ For security reasons, we strongly recommend changing your password immediately after login.
                                    </p>

                                    <!-- Button -->
                                    <div style="text-align:center; margin:30px 0;">
                                        <a href="#" 
                                           style="background:#ff7043; color:#ffffff; padding:12px 25px; text-decoration:none; border-radius:5px; font-size:14px; display:inline-block;">
                                           Login Now
                                        </a>
                                    </div>

                                    <p style="font-size:12px; color:#999;">
                                        If you did not request this password reset, please contact support immediately.
                                    </p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background:#f4f6f9; padding:15px; text-align:center; font-size:12px; color:#999;">
                                    © ${new Date().getFullYear()} FixIt. All rights reserved.
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </div>
        `
    };
};


module.exports = { sendMail, createAccountTemplate, forgotPasswordTemplate };
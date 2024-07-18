const nodemailer = require("nodemailer");

module.exports = {
    async send(email, subject, text) {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.mailhost,
                port: 587,
                secure: false,
                auth: {
                    user: process.env.mailuser,
                    pass: process.env.mailpasswd,
                },
            });
    
            await transporter.sendMail({
                from: process.env.senderemail,
                to: email,
                subject: subject,
                text: text,
            });
        } catch (error) {
            console.log(error);
        }
    },
    isEmail(email) {
        let emailFormat = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
        if (email !== '' && email.match(emailFormat)) return true;
        return false;
    },
    generateToken(length){
        let a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
        let b = [];  
        for (let i = 0; i < length; i++) {
            var j = (Math.random() * (a.length - 1)).toFixed(0);
            b[i] = a[j];
        }
        return { value: b.join(""), ts: Date.now() };
    }
};
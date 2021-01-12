const { Router } = require('express');
const User = require('../models/User');
const router = Router();

const jwt = require('jsonwebtoken');
const config = require('../config');
const pdfMake = require('../pdfmake/pdfmake');
const vfsFonts = require('../pdfmake/vfs_fonts');
pdfMake.vfs = vfsFonts.pdfMake.vfs;

require('../models/User');

router.post('/signup', async(req, res, next) => {
    console.log(req.body);
    const { username, email, password } = req.body;
    const user = new User({
        username,
        email,
        password
    });
    console.log(user);

    user.password = await user.encryptPassword(user.password);
    await user.save();

    const token = jwt.sign({ id: user._id }, config.secret, {
        expiresIn: 60 * 60 * 24
    });


    res.json({ auth: true, token });


});

router.get('/me', async(req, res, next) => {

    const token = req.headers['x-access-token'];
    if (!token) {
        return res.status(401).json({
            auth: false,
            massage: 'No token provided'
        });
    }
    const decoded = jwt.verify(token, config.secret);

    console.log(decoded);
    const user = await User.findById(decoded.id, { password: 0 });
    if (!user) {
        return res.status(404).send('No user found');
    };
    res.json(user);
});

router.post('/signin', async(req, res, next) => {

    const { email, password } = req.body;
    console.log(email, password);
    const user = await User.findOne({ email: email });
    if (!user) {
        return res.status(404).send('The email doesnt exist');
    };
    const validPassword = await user.validatePassword(password);
    console.log(validPassword);
    if (!validPassword) {
        return res.status(401).json({ auth: false, token: null });
    };
    const token = jwt.sign({ id: user._id }, config.secret, {
        expiresIn: 60 * 60 * 24
    });
    //res.json({ auth: true, token });

    const usuario = req.body.user;
    //const email = req.body.email;
    //const password = req.body.password;
    var documentDefinition = {
        content: [
            'Estos son tus datos',
            `Usuario: ${usuario}`,
            `Correo: ${email}`,
            `Contraseña: ${password}`,
            `Certificado: ${token}`
        ]
    };

    const pdfDoc = pdfMake.createPdf(documentDefinition);
    pdfDoc.getBase64((data) => {
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment;filename="filename.pdf"'
        });

        const download = Buffer.from(data.toString('utf-8'), 'base64');
        res.end(download);
    });


});

router.post('/pdf', (req, res, next) => {
    //res.send('PDF');

    const user = req.body.user;
    const email = req.body.email;
    const password = req.body.password;
    const token = jwt.sign({ id: user._id }, config.secret, {
        expiresIn: 60 * 60 * 24
    });

    var documentDefinition = {
        content: [
            'Estos son tus datos',
            `Usuario ${user}`,
            `Correo ${email}`,
            `Contraseña ${password}`,
            `Certificado ${token}`
        ]
    };

    const pdfDoc = pdfMake.createPdf(documentDefinition);
    pdfDoc.getBase64((data) => {
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment;filename="filename.pdf"'
        });

        const download = Buffer.from(data.toString('utf-8'), 'base64');
        res.end(download);
    });

});



module.exports = router;
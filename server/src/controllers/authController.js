const User = require('../models/User');
const SchoolSettings = require('../models/SchoolSettings');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({ name, email, password, role });
        await user.save();

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
            if (err) throw err;
            res.json({
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.updateUser = async (req, res) => {
    const { name, email, role, password } = req.body;

    try {
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            user.email = email;
        }

        if (name) user.name = name;
        if (role) user.role = role;
        if (password) user.password = password;

        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });
    } catch (err) {
        console.error('Update User Error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getSetupStatus = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        res.json({ needsSetup: userCount === 0 });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.initialSetup = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            return res.status(403).json({ message: 'Setup has already been completed. Further admin creation requires authentication.' });
        }

        const { name, email, password, schoolName } = req.body;

        // Ensure required fields
        if (!name || !email || !password || !schoolName) {
            return res.status(400).json({ message: 'School Name, Admin Name, email, and password are required.' });
        }

        const user = new User({
            name,
            email,
            password: password, // The User schema has a pre('save') hook that automatically hashes this!
            role: 'admin' // Force the first user to be a root admin
        });

        await user.save();

        // 2. Initialize the Global School Settings with the custom name
        let settings = await SchoolSettings.findOne();
        if (!settings) {
            settings = new SchoolSettings({ schoolName: schoolName });
            await settings.save();
        } else {
            settings.schoolName = schoolName;
            await settings.save();
        }

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({
                message: 'Admin account secured and created. Welcome to Fi-Das Liceyum.',
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

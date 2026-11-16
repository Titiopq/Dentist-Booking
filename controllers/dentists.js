const Dentist = require('../models/Dentist');

exports.createDentist = async (req, res) => {
    try {
        const { name, yearsOfExperience, areaOfExpertise } = req.body;
        const dentist = await Dentist.create({ name, yearsOfExperience, areaOfExpertise });
        res.status(201).json({ success: true, data: dentist });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.getDentists = async (req, res) => {
    try {
        const dentists = await Dentist.find().sort('name');
        res.status(200).json({ success: true, count: dentists.length, data: dentists });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Cannot find dentists' });
    }
};

exports.getDentist = async (req, res) => {
    try {
        const dentist = await Dentist.findById(req.params.id);
        if (!dentist) {
            return res.status(404).json({ success: false, error: 'Dentist not found' });
        }
        res.status(200).json({ success: true, data: dentist });
    } catch (err) {
        res.status(400).json({ success: false, error: 'Invalid dentist id' });
    }
};

const mongoose = require('mongoose');

const DentistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a dentist name'],
        trim: true
    },
    yearsOfExperience: {
        type: Number,
        required: [true, 'Please add years of experience'],
        min: [0, 'Years of experience cannot be negative']
    },
    areaOfExpertise: {
        type: String,
        required: [true, 'Please add an area of expertise'],
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Dentist', DentistSchema);

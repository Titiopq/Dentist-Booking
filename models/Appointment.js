const mongoose = require('mongoose');

const AppointmentSchema=new mongoose.Schema({
    apptDate: {
        type: Date,
        required:true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref:'User',
        required:true
    },
    dentist: {
        type: mongoose.Schema.ObjectId,
        ref:'Dentist',
        required:true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Enforce the one-booking-per-user requirement at the database level too.
AppointmentSchema.index({ user: 1 }, { unique: true });

module.exports=mongoose.model('Appointment', AppointmentSchema);

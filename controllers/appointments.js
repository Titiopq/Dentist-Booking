const Appointment = require('../models/Appointment');
const Dentist = require('../models/Dentist');

const appointmentPopulation = [
    { path: 'dentist', select: 'name yearsOfExperience areaOfExpertise' },
    { path: 'user', select: 'name email telephone' }
];

// A registered user sees only their own booking. Admins can see every booking.
exports.getAppointments = async (req, res) => {
    try {
        const filter = req.user.role === 'admin' ? {} : { user: req.user.id };
        const appointments = await Appointment.find(filter).populate(appointmentPopulation).sort('apptDate');
        res.status(200).json({ success: true, count: appointments.length, data: appointments });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Cannot find appointments' });
    }
};

// A booking can be viewed by its owner or by an admin.
exports.getAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id).populate(appointmentPopulation);
        if (!appointment) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }
        if (req.user.role !== 'admin' && appointment.user._id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'You cannot view this appointment' });
        }
        res.status(200).json({ success: true, data: appointment });
    } catch (err) {
        res.status(400).json({ success: false, error: 'Invalid appointment id' });
    }
};

// Each registered user may have one booking. The unique model index also
// protects this rule when two booking requests arrive at the same time.
exports.addAppointment = async (req, res) => {
    try {
        const { apptDate, date, dentist: bodyDentist } = req.body;
        const bookingDate = apptDate || date;
        const dentistId = req.params.dentistId || bodyDentist;
        if (!bookingDate || !dentistId || Number.isNaN(Date.parse(bookingDate))) {
            return res.status(400).json({ success: false, error: 'Please provide a valid date and dentist' });
        }

        const dentist = await Dentist.findById(dentistId);
        if (!dentist) {
            return res.status(404).json({ success: false, error: 'Dentist not found' });
        }

        const appointment = await Appointment.create({
            apptDate: new Date(bookingDate),
            dentist: dentist._id,
            user: req.user.id
        });
        await appointment.populate(appointmentPopulation);
        res.status(201).json({ success: true, data: appointment });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, error: 'You already have a booking' });
        }
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, error: 'Invalid dentist id' });
        }
        res.status(400).json({ success: false, error: err.message || 'Cannot create appointment' });
    }
};

// Users can edit their own booking; admins can edit any booking.
exports.updateAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }
        if (req.user.role !== 'admin' && appointment.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'You cannot edit this appointment' });
        }

        const updates = {};
        const requestedDate = req.body.apptDate || req.body.date;
        if (requestedDate !== undefined) {
            if (Number.isNaN(Date.parse(requestedDate))) {
                return res.status(400).json({ success: false, error: 'Please provide a valid date' });
            }
            updates.apptDate = new Date(requestedDate);
        }
        if (req.body.dentist !== undefined || req.body.dentistId !== undefined) {
            const dentistId = req.body.dentistId || req.body.dentist;
            const dentist = await Dentist.findById(dentistId);
            if (!dentist) {
                return res.status(404).json({ success: false, error: 'Dentist not found' });
            }
            updates.dentist = dentist._id;
        }
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, error: 'Provide a date or dentist to update' });
        }

        const updated = await Appointment.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        }).populate(appointmentPopulation);
        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, error: 'This user already has a booking' });
        }
        res.status(400).json({ success: false, error: 'Cannot update appointment' });
    }
};

exports.deleteAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }
        if (req.user.role !== 'admin' && appointment.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'You cannot delete this appointment' });
        }
        await appointment.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: 'Cannot delete appointment' });
    }
};

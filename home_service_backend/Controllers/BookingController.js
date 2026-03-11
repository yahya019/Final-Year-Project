const BookingRepository = require("./../Repositories/BookingRepository");

class BookingController {

    createBooking = async (req, res) => {

        try {

            const {
                customerId,
                servicemanId,
                serviceId,
                address,
                availableSlotId,
                totalAmount,
                contactNumber,
                contactPerson,
                paymentMode,
                bookingDate
            } = req.body;


            if (!customerId)
                return res.status(400).json({ Status: "Fail", Result: "Customer Id required" });

            if (!servicemanId)
                return res.status(400).json({ Status: "Fail", Result: "Serviceman Id required" });

            if (!serviceId)
                return res.status(400).json({ Status: "Fail", Result: "Service Id required" });

            if (!availableSlotId)
                return res.status(400).json({ Status: "Fail", Result: "Slot Id required" });

            if (!address)
                return res.status(400).json({ Status: "Fail", Result: "Address required" });

            if (!totalAmount)
                return res.status(400).json({ Status: "Fail", Result: "Amount required" });

            const result = await BookingRepository.createBooking(req.body);

            if (result.Status === "OK")
                return res.status(200).json(result);

            return res.status(400).json(result);

        }
        catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };
    
    updateBookingStatus = async (req, res) => {

    try {

        const { bookingId, bookingStatus } = req.body;

        if (!bookingId)
            return res.status(400).json({
                Status: "Fail",
                Result: "Booking Id required"
            });

        if (!bookingStatus)
            return res.status(400).json({
                Status: "Fail",
                Result: "Booking status required"
            });

        const result = await BookingRepository.updateBookingStatus(
            bookingId,
            bookingStatus
        );

        if (result.Status === "OK")
            return res.status(200).json(result);

        return res.status(400).json(result);

    } catch (error) {

        return res.status(500).json({
            Status: "Fail",
            Result: error.message
        });

    }

};

/* ================= GET BOOKINGS BY CUSTOMER ================= */

getBookingsByCustomer = async (req, res) => {

    try {

        const { customerId } = req.params;

        if (!customerId)
            return res.status(400).json({
                Status: "Fail",
                Result: "Customer Id required"
            });

        const result = await BookingRepository.getBookingsByCustomer(customerId);

        if (result.Status === "OK")
            return res.status(200).json(result);

        return res.status(400).json(result);

    } catch (error) {

        return res.status(500).json({
            Status: "Fail",
            Result: error.message
        });

    }

};

/* ================= GET ALL BOOKINGS (ADMIN) ================= */
getAllBookings = async (req, res) => {
    try {
        const result = await BookingRepository.getAllBookings();

        if (result.Status === "OK")
            return res.status(200).json(result);

        return res.status(400).json(result);

    } catch (error) {
        return res.status(500).json({
            Status: "Fail",
            Result: error.message
        });
    }
};

}

module.exports = new BookingController();
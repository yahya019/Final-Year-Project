const { ObjectId } = require("mongodb");
const { getCollection } = require("./dbConfig");

class BookingRepository {

    generateBookingNumber = () => {
        return "BK" + Date.now();
    };

    generateTransactionId = () => {
        return "TXN" + Date.now();
    };

    /* ================= CREATE PAYMENT ================= */

    createPayment = async (bookingId, amount, transactionId) => {

        const paymentCollection = await getCollection("PaymentMaster");

        const paymentData = {
            bookingId: bookingId,
            amount: Number(amount),
            paymentMode: "Online",
            transactionId: transactionId,
            paymentStatus: "Success",
            paidAt: new Date(),
            createdAt: new Date()
        };

        await paymentCollection.insertOne(paymentData);
    };


    /* ================= CREATE BOOKING ================= */

    createBooking = async (model) => {

        try {

            const bookingCollection = await getCollection("BookingMaster");
            const slotCollection = await getCollection("ServicemanSlot");
            const customerCollection = await getCollection("Customer");
            const servicemanCollection = await getCollection("Serviceman");
            const serviceCollection = await getCollection("Service");

            /* ===== REQUIRED FIELD VALIDATION ===== */

            if (!model.customerId)
                return { Status: "Fail", Result: "Customer Id required" };

            if (!model.servicemanId)
                return { Status: "Fail", Result: "Serviceman Id required" };

            if (!model.serviceId)
                return { Status: "Fail", Result: "Service Id required" };

            if (!model.availableSlotId)
                return { Status: "Fail", Result: "Slot Id required" };

            if (!model.address)
                return { Status: "Fail", Result: "Address required" };

            if (!model.totalAmount)
                return { Status: "Fail", Result: "Total amount required" };

            if (!model.contactNumber)
                return { Status: "Fail", Result: "Contact number required" };

            if (!model.contactPerson)
                return { Status: "Fail", Result: "Contact person required" };

            if (!model.bookingDate)
                return { Status: "Fail", Result: "Booking date required" };


            /* ===== OBJECT ID VALIDATION ===== */

            if (!ObjectId.isValid(model.customerId))
                return { Status: "Fail", Result: "Invalid Customer Id" };

            if (!ObjectId.isValid(model.servicemanId))
                return { Status: "Fail", Result: "Invalid Serviceman Id" };

            if (!ObjectId.isValid(model.serviceId))
                return { Status: "Fail", Result: "Invalid Service Id" };

            if (!ObjectId.isValid(model.availableSlotId))
                return { Status: "Fail", Result: "Invalid Slot Id" };


            /* ===== CHECK CUSTOMER ===== */

            const customer = await customerCollection.findOne({
                _id: new ObjectId(model.customerId)
            });

            if (!customer)
                return { Status: "Fail", Result: "Customer not found" };


            /* ===== CHECK SERVICEMAN ===== */

            const serviceman = await servicemanCollection.findOne({
                _id: new ObjectId(model.servicemanId)
            });

            if (!serviceman)
                return { Status: "Fail", Result: "Serviceman not found" };


            /* ===== CHECK SERVICE ===== */

            const service = await serviceCollection.findOne({
                _id: new ObjectId(model.serviceId)
            });

            if (!service)
                return { Status: "Fail", Result: "Service not found" };


            /* ===== CHECK SLOT ===== */

            const slot = await slotCollection.findOne({
                _id: new ObjectId(model.availableSlotId)
            });

            if (!slot)
                return { Status: "Fail", Result: "Slot not found" };

            if (slot.bookedSlots >= slot.totalSlots)
                return { Status: "Fail", Result: "Slot already full" };


            /* ===== BOOKING DATE VALIDATION ===== */

            const bookingDate = new Date(model.bookingDate);

            if (isNaN(bookingDate))
                return { Status: "Fail", Result: "Invalid booking date" };

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (bookingDate < today)
                return { Status: "Fail", Result: "Booking date cannot be in the past" };


            /* ===== GENERATE IDS ===== */

            const bookingNumber = this.generateBookingNumber();
            const transactionId = this.generateTransactionId();


            /* ===== CREATE BOOKING ===== */

            const bookingData = {

                customerId: new ObjectId(model.customerId),

                servicemanId: new ObjectId(model.servicemanId),

                serviceId: new ObjectId(model.serviceId),

                address: model.address,

                latitude: model.latitude || null,

                longitude: model.longitude || null,

                availableSlotId: model.availableSlotId ? new ObjectId(model.availableSlotId) : null,

                bookingNumber: bookingNumber,

                totalAmount: Number(model.totalAmount),

                surgeCharges: Number(model.surgeCharges || 0),

                contactNumber: model.contactNumber,

                contactPerson: model.contactPerson,

                paymentMode: "Online",

                paymentStatus: "Paid",

                bookingStatus: "Pending",

                bookingDate: bookingDate,

                createdAt: new Date()

            };

            const booking = await bookingCollection.insertOne(bookingData);


            /* ===== CREATE PAYMENT RECORD ===== */

            await this.createPayment(
                booking.insertedId,
                model.totalAmount,
                transactionId
            );


            /* ===== UPDATE SLOT ===== */

            await slotCollection.updateOne(
                { _id: slot._id },
                { $inc: { bookedSlots: 1 } }
            );


            return {
                Status: "OK",
                Result: {
                    message: "Booking created successfully",
                    bookingNumber: bookingNumber,
                    transactionId: transactionId
                }
            };

        }
        catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };

    /* ================= UPDATE BOOKING STATUS ================= */  
    updateBookingStatus = async (bookingId, status) => {
        try {
            const bookingCollection = await getCollection("BookingMaster");

            if (!ObjectId.isValid(bookingId))
                return { Status: "Fail", Result: "Invalid Booking Id" };

            const booking = await bookingCollection.findOne({
                _id: new ObjectId(bookingId)
            });

            if (!booking)
                return { Status: "Fail", Result: "Booking not found" };

            await bookingCollection.updateOne(
                { _id: new ObjectId(bookingId) },
                { $set: { bookingStatus: status } }
            );

            // ── AUTO CREATE COMMISSION WHEN COMPLETED ──
            if (status === "Completed") {
                const commissionCollection = await getCollection("Commission");

                const existing = await commissionCollection.findOne({
                    bookingId: new ObjectId(bookingId)
                });

                if (!existing) {
                    const commissionPercentage = 15;
                    const commissionAmount = booking.totalAmount * commissionPercentage / 100;
                    const servicemanEarning = booking.totalAmount - commissionAmount;

                    await commissionCollection.insertOne({
                        bookingId: new ObjectId(bookingId),
                        totalAmount: booking.totalAmount,
                        commissionPercentage: commissionPercentage,
                        commissionAmount: commissionAmount,
                        servicemanEarning: servicemanEarning,
                        settlementStatus: "Pending",
                        settledAt: null,
                        createdAt: new Date()
                    });
                }
            }
            // ───────────────────────────────────────────

            return { Status: "OK", Result: "Booking status updated successfully" };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };

    getAllBookings = async () => {
        try {
            const collection = await getCollection("BookingMaster");

            const bookings = await collection.aggregate([
                {
                    $lookup: {
                        from: "Customer",
                        localField: "customerId",
                        foreignField: "_id",
                        as: "customer"
                    }
                },
                { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "Serviceman",
                        localField: "servicemanId",
                        foreignField: "_id",
                        as: "serviceman"
                    }
                },
                { $unwind: { path: "$serviceman", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "Service",
                        localField: "serviceId",
                        foreignField: "_id",
                        as: "service"
                    }
                },
                { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
                { $sort: { createdAt: -1 } }
            ]).toArray();

            return { Status: "OK", Result: bookings };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };

    getBookingsByServiceman = async (servicemanId) => {
        try {
            const collection = await getCollection("BookingMaster");

            if (!ObjectId.isValid(servicemanId))
                return { Status: "Fail", Result: "Invalid Serviceman Id" };

            const bookings = await collection.aggregate([
                { $match: { servicemanId: new ObjectId(servicemanId) } },
                {
                    $lookup: {
                        from: "Customer",
                        localField: "customerId",
                        foreignField: "_id",
                        as: "customer"
                    }
                },
                { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "Service",
                        localField: "serviceId",
                        foreignField: "_id",
                        as: "service"
                    }
                },
                { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
                { $sort: { createdAt: -1 } }
            ]).toArray();

            return { Status: "OK", Result: bookings };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };

    getBookingsByCustomer = async (customerId) => {
        try {
            const collection = await getCollection("BookingMaster");

            if (!ObjectId.isValid(customerId))
                return { Status: "Fail", Result: "Invalid Customer Id" };

            const bookings = await collection.aggregate([
                { $match: { customerId: new ObjectId(customerId) } },
                {
                    $lookup: {
                        from: "Serviceman",
                        localField: "servicemanId",
                        foreignField: "_id",
                        as: "serviceman"
                    }
                },
                { $unwind: { path: "$serviceman", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "Service",
                        localField: "serviceId",
                        foreignField: "_id",
                        as: "service"
                    }
                },
                { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        "serviceman.password": 0,
                        "serviceman.aadhaarNumber": 0,
                        "serviceman.accountNumber": 0,
                        "serviceman.ifscCode": 0,
                    }
                },
                { $sort: { createdAt: -1 } }
            ]).toArray();

            return { Status: "OK", Result: bookings };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };


}

module.exports = new BookingRepository();
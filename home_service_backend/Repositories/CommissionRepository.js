const { ObjectId } = require("mongodb");
const { getCollection } = require("./dbConfig");

class CommissionRepository {

    /* ================= CREATE COMMISSION ================= */

    createCommission = async (model) => {

        try {

            const bookingCollection = await getCollection("BookingMaster");
            const commissionCollection = await getCollection("Commission");

            if (!ObjectId.isValid(model.bookingId))
                return { Status: "Fail", Result: "Invalid Booking Id" };

            const booking = await bookingCollection.findOne({
                _id: new ObjectId(model.bookingId)
            });

            if (!booking)
                return { Status: "Fail", Result: "Booking not found" };

            const existing = await commissionCollection.findOne({
                bookingId: new ObjectId(model.bookingId)
            });

            if (existing)
                return { Status: "Conflict", Result: "Commission already exists for this booking" };
           

            const totalAmount = Number(model.totalAmount);
            const commissionPercentage = Number(model.commissionPercentage);

        
            if (totalAmount <= 0)
                return { Status: "Fail", Result: "Invalid total amount" };

            if (commissionPercentage <= 0)
                return { Status: "Fail", Result: "Invalid commission percentage" };

            const commissionAmount =
                (totalAmount * commissionPercentage) / 100;

            const servicemanEarning =
                totalAmount - commissionAmount;

            const data = {

                bookingId: new ObjectId(model.bookingId),

                totalAmount: totalAmount,

                commissionPercentage: commissionPercentage,

                commissionAmount: commissionAmount,

                servicemanEarning: servicemanEarning,

                settlementStatus: "Pending",

                settledAt: null,

                createdAt: new Date()

            };

            await commissionCollection.insertOne(data);

            return {
                Status: "OK",
                Result: "Commission created successfully"
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };

    getByServiceman = async (servicemanId) => {
    try {
        const collection = await getCollection("Commission");

        if (!ObjectId.isValid(servicemanId))
            return { Status: "Fail", Result: "Invalid Serviceman Id" };

        const commissions = await collection.aggregate([
            {
                $lookup: {
                    from: "BookingMaster",
                    localField: "bookingId",
                    foreignField: "_id",
                    as: "booking"
                }
            },
            { $unwind: { path: "$booking", preserveNullAndEmptyArrays: true } },
            {
                $match: {
                    "booking.servicemanId": new ObjectId(servicemanId)
                }
            },
            {
                $lookup: {
                    from: "Service",
                    localField: "booking.serviceId",
                    foreignField: "_id",
                    as: "service"
                }
            },
            { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        return { Status: "OK", Result: commissions };

    } catch (error) {
        return { Status: "Fail", Result: error.message };
    }
};


    /* ================= COMMISSION LIST ================= */

    commissionList = async () => {
        try {
            const collection = await getCollection("Commission");

            const commissions = await collection.aggregate([
                {
                    $lookup: {
                        from: "BookingMaster",
                        localField: "bookingId",
                        foreignField: "_id",
                        as: "booking"
                    }
                },
                { $unwind: { path: "$booking", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "Serviceman",
                        localField: "booking.servicemanId",
                        foreignField: "_id",
                        as: "serviceman"
                    }
                },
                { $unwind: { path: "$serviceman", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "Service",
                        localField: "booking.serviceId",
                        foreignField: "_id",
                        as: "service"
                    }
                },
                { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
                { $sort: { createdAt: -1 } }
            ]).toArray();

            return { Status: "OK", Result: commissions };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };


    /* ================= COMMISSION BY BOOKING ================= */

    getByBooking = async (bookingId) => {

        try {

            const collection = await getCollection("Commission");

            const commission = await collection.findOne({
                bookingId: new ObjectId(bookingId)
            });

            if (!commission)
                return { Status: "Fail", Result: "Commission not found" };

            return {
                Status: "OK",
                Result: commission
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };


    /* ================= SETTLE COMMISSION ================= */

    settleCommission = async (id) => {

        try {

            const collection = await getCollection("Commission");

            await collection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        settlementStatus: "Settled",
                        settledAt: new Date()
                    }
                }
            );

            return {
                Status: "OK",
                Result: "Commission settled successfully"
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };

}

module.exports = new CommissionRepository();
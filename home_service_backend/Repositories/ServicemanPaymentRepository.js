const { ObjectId } = require("mongodb");
const { getCollection } = require("./dbConfig");

class ServicemanPaymentRepository {

    /* ================= CREATE PAYMENT ================= */

    createPayment = async (model) => {

        try {

            const paymentCollection = await getCollection("ServicemanPayment");
            const servicemanCollection = await getCollection("Serviceman");

            if (!ObjectId.isValid(model.servicemanId))
                return { Status: "Fail", Result: "Invalid Serviceman Id" };

            if (!model.amount || Number(model.amount) <= 0)
                return { Status: "Fail", Result: "Invalid payment amount" };

            if (!model.paymentMode)
                return { Status: "Fail", Result: "Payment mode required" };

            if (!model.paymentDate)
                return { Status: "Fail", Result: "Payment date required" };

            /* ===== CHECK SERVICEMAN ===== */

            const serviceman = await servicemanCollection.findOne({
                _id: new ObjectId(model.servicemanId)
            });

            if (!serviceman)
                return { Status: "Fail", Result: "Serviceman not found" };

            /* ===== CREATE PAYMENT ===== */

            const data = {

                servicemanId: new ObjectId(model.servicemanId),

                amount: Number(model.amount),

                transactionId: model.transactionId || null,

                paymentMode: model.paymentMode,

                settlementPeriodStart: model.settlementPeriodStart
                    ? new Date(model.settlementPeriodStart)
                    : null,

                settlementPeriodEnd: model.settlementPeriodEnd
                    ? new Date(model.settlementPeriodEnd)
                    : null,

                paymentDate: new Date(model.paymentDate),

                status: model.status || "Completed",

                createdAt: new Date()

            };

            await paymentCollection.insertOne(data);

            return {
                Status: "OK",
                Result: "Payment recorded successfully"
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };


    /* ================= PAYMENT LIST ================= */

    paymentList = async () => {

        try {

            const collection = await getCollection("ServicemanPayment");

            const payments = await collection.aggregate([
                {
                    $lookup: {
                        from: "Serviceman",
                        localField: "servicemanId",
                        foreignField: "_id",
                        as: "serviceman"
                    }
                },
                { $unwind: "$serviceman" },
                {
                    $project: {
                        amount: 1,
                        transactionId: 1,
                        paymentMode: 1,
                        paymentDate: 1,
                        status: 1,
                        "serviceman.fullName": 1,
                        "serviceman.contactNumber": 1
                    }
                },
                { $sort: { paymentDate: -1 } }
            ]).toArray();

            return {
                Status: "OK",
                Result: payments
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };


    /* ================= PAYMENT BY SERVICEMAN ================= */

    paymentByServiceman = async (servicemanId) => {

        try {

            const collection = await getCollection("ServicemanPayment");

            const payments = await collection.find({
                servicemanId: new ObjectId(servicemanId)
            }).sort({ paymentDate: -1 }).toArray();

            return {
                Status: "OK",
                Result: payments
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };

}

module.exports = new ServicemanPaymentRepository();
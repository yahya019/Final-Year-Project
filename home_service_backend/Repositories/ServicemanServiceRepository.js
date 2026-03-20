const { ObjectId } = require("mongodb");
const { getCollection } = require("./dbConfig");

class ServicemanServiceRepository {

    /* ================= APPLY SERVICE ================= */

    applyService = async (model) => {
    try {
        const collection = await getCollection("ServicemanService");

        // ── CHECK WORKER IS APPROVED ──
        const servicemanCollection = await getCollection("Serviceman");
        const serviceman = await servicemanCollection.findOne({
            _id: new ObjectId(model.servicemanId)
        });

        if (!serviceman)
            return { Status: "Fail", Result: "Serviceman not found" };

        if (serviceman.status !== "Approved")
            return { Status: "Fail", Result: "Only approved servicemen can apply for services" };

        // ── CHECK DUPLICATE ──
        const exist = await collection.findOne({
            servicemanId: new ObjectId(model.servicemanId),
            serviceId: new ObjectId(model.serviceId)
        });

        if (exist)
            return { Status: "Conflict", Result: "Service already applied" };

        // ── CHECK CHARGE vs MAX PRICE ──
        const serviceCollection = await getCollection("Service");
        const service = await serviceCollection.findOne({
            _id: new ObjectId(model.serviceId)
        });

        if (service && Number(model.charge) > service.maximumPrice)
            return { Status: "Fail", Result: `Charge cannot exceed maximum price of ₹${service.maximumPrice}` };

        // ── INSERT ──
        const data = {
            servicemanId: new ObjectId(model.servicemanId),
            serviceId:    new ObjectId(model.serviceId),
            categoryId:   new ObjectId(model.categoryId),
            role:         model.role        || null,
            description:  model.description || null,
            charge:       Number(model.charge) || 0,
            status:       "Pending",
            adminRemark:  null,
            createdAt:    new Date()
        };

        await collection.insertOne(data);

        return {
            Status: "OK",
            Result: "Service request submitted successfully"
        };

    } catch (error) {
        return {
            Status: "Fail",
            Result: error.message
        };
    }
};

    /* ================= SERVICEMAN SERVICES ================= */

    servicemanServices = async (servicemanId) => {

        try {

            const collection = await getCollection("ServicemanService");

            const data = await collection.aggregate([

                {
                    $match: {
                        servicemanId: new ObjectId(servicemanId)
                    }
                },

                {
                    $lookup: {
                        from: "Service",
                        localField: "serviceId",
                        foreignField: "_id",
                        as: "service"
                    }
                },

                { $unwind: "$service" },

                {
                    $lookup: {
                        from: "ServiceCategory",
                        localField: "categoryId",
                        foreignField: "_id",
                        as: "category"
                    }
                },

                { $unwind: "$category" }

            ]).toArray();

            return {
                Status: "OK",
                Result: data
            };

        }
        catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };


    /* ================= ADMIN APPROVE / REJECT ================= */

    changeStatus = async (_id, status, adminRemark) => {

        try {

            const collection = await getCollection("ServicemanService");

            await collection.updateOne(
                { _id: new ObjectId(_id) },
                {
                    $set: {
                        status: status,
                        adminRemark: adminRemark || null
                    }
                }
            );

            return {
                Status: "OK",
                Result: "Status updated successfully"
            };

        }
        catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };


    /* ================= ADMIN LIST ================= */

    list = async () => {

        try {

            const collection = await getCollection("ServicemanService");

            const data = await collection.aggregate([

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
                    $lookup: {
                        from: "Service",
                        localField: "serviceId",
                        foreignField: "_id",
                        as: "service"
                    }
                },

                { $unwind: "$service" }

            ]).toArray();

            return {
                Status: "OK",
                Result: data
            };

        }
        catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };

    servicesByService = async (serviceId) => {
    try {
        const collection = await getCollection("ServicemanService");

        const data = await collection.aggregate([
            {
                $match: {
                    serviceId: new ObjectId(serviceId),
                    status: "Approved"
                }
            },
            {
                $lookup: {
                    from: "Serviceman",
                    localField: "servicemanId",
                    foreignField: "_id",
                    as: "serviceman"
                }
            },
            { $unwind: "$serviceman" },
        ]).toArray();

        return { Status: "OK", Result: data };

    } catch (error) {
        return { Status: "Fail", Result: error.message };
    }
};

}

module.exports = new ServicemanServiceRepository(); 
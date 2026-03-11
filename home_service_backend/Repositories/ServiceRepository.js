const { ObjectId } = require("mongodb");
const { getCollection } = require("./dbConfig");

class ServiceRepository {

    /* ================= CREATE SERVICE ================= */
    createService = async (model) => {
        try {
            const collection = await getCollection("Service");
            const categoryCollection = await getCollection("ServiceCategory");

            // Validate category exists
            const category = await categoryCollection.findOne({
                _id: new ObjectId(model.serviceCategoryId),
                isDeleted: false
            });

            if (!category)
                return { Status: "Fail", Result: "Invalid Service Category" };

            // Check duplicate service name inside same category
            const nameExist = await collection.findOne({
                serviceName: model.serviceName,
                serviceCategoryId: new ObjectId(model.serviceCategoryId),
                isDeleted: false
            });

            if (nameExist)
                return { Status: "Conflict", Result: "Service already exists in this category" };

            const data = {
                serviceName: model.serviceName,
                serviceCategoryId: new ObjectId(model.serviceCategoryId),
                maximumPrice: parseFloat(model.maximumPrice),
                description: model.description || null,
                isDeleted: false,
                createdAt: new Date(),
                deletedAt: null
            };

            await collection.insertOne(data);

            return { Status: "OK", Result: "Service Created Successfully" };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };


    /* ================= UPDATE SERVICE ================= */
    updateService = async (_id, model) => {
        try {
            const collection = await getCollection("Service");

            const service = await collection.findOne({
                _id: new ObjectId(_id),
                isDeleted: false
            });

            if (!service)
                return { Status: "Fail", Result: "Service not found" };

            // Check duplicate name in same category (excluding current)
            const nameExist = await collection.findOne({
                serviceName: model.serviceName,
                serviceCategoryId: new ObjectId(model.serviceCategoryId),
                _id: { $ne: new ObjectId(_id) },
                isDeleted: false
            });

            if (nameExist)
                return { Status: "Conflict", Result: "Service already exists in this category" };

            await collection.updateOne(
                { _id: new ObjectId(_id) },
                {
                    $set: {
                        serviceName: model.serviceName,
                        serviceCategoryId: new ObjectId(model.serviceCategoryId),
                        maximumPrice: parseFloat(model.maximumPrice),
                        description: model.description || null
                    }
                }
            );

            return { Status: "OK", Result: "Service Updated Successfully" };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };


    /* ================= SERVICE LIST ================= */
    serviceList = async () => {
        try {
            const collection = await getCollection("Service");

            const services = await collection.aggregate([
                { $match: { isDeleted: false } },
                {
                    $lookup: {
                        from: "ServiceCategory",
                        localField: "serviceCategoryId",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                { $unwind: "$category" },
                {
                    $project: {
                        serviceName: 1,
                        maximumPrice: 1,
                        description: 1,
                        createdAt: 1,
                        "category._id": 1,
                        "category.name": 1
                    }
                }
            ]).toArray();

            return { Status: "OK", Result: services };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };


    /* ================= GET SERVICE BY ID ================= */
    getServiceById = async (_id) => {
        try {
            const collection = await getCollection("Service");

            const service = await collection.findOne({
                _id: new ObjectId(_id),
                isDeleted: false
            });

            if (!service)
                return { Status: "Fail", Result: "Service not found" };

            return { Status: "OK", Result: service };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };

    /* ================= SERVICES BY CATEGORY ================= */
    getServicesByCategoryId = async (serviceCategoryId) => {
        try {
            const collection = await getCollection("Service");

            const services = await collection.find({
                serviceCategoryId: new ObjectId(serviceCategoryId),
                isDeleted: false
            }).toArray();

            if (!services || services.length === 0)
                return { Status: "Fail", Result: "No services found for this category" };

            return { Status: "OK", Result: services };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };


    /* ================= SOFT DELETE SERVICE ================= */
    deleteService = async (_id) => {
        try {
            const collection = await getCollection("Service");

            const service = await collection.findOne({ _id: new ObjectId(_id) });

            if (!service)
                return { Status: "Fail", Result: "Service not found" };

            await collection.updateOne(
                { _id: new ObjectId(_id) },
                {
                    $set: {
                        isDeleted: true,
                        deletedAt: new Date()
                    }
                }
            );

            return { Status: "OK", Result: "Service Deleted Successfully" };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };

    /* ================= ACTIVE SERVICE LIST ================= */

    activeServiceList = async () => {

        try {

            const collection = await getCollection("Service");

            const services = await collection.aggregate([
                {
                    $match: { isDeleted: false }
                },
                {
                    $lookup: {
                        from: "ServiceCategory",
                        localField: "serviceCategoryId",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                { $unwind: "$category" },
                {
                    $project: {
                        serviceName: 1,
                        maximumPrice: 1,
                        description: 1,
                        "category._id": 1,
                        "category.name": 1
                    }
                }
            ]).toArray();

            return {
                Status: "OK",
                Result: services
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };

    /* ================= SERVICE BY SERVICEMAN ================= */

    getServiceByServicemanId = async (servicemanId) => {

        try {

            if (!ObjectId.isValid(servicemanId))
                return { Status: "Fail", Result: "Invalid Serviceman Id" };

            const collection = await getCollection("ServicemanService");

            const services = await collection.aggregate([
                {
                    $match: {
                        servicemanId: new ObjectId(servicemanId),
                        status: "Approved"
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
                { $unwind: "$category" },
                {
                    $project: {
                        role: 1,
                        description: 1,
                        "service._id": 1,
                        "service.serviceName": 1,
                        "category.name": 1
                    }
                }
            ]).toArray();

            return {
                Status: "OK",
                Result: services
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };

    /* ================= DELETED SERVICE LIST ================= */
    deletedServiceList = async () => {
        try {
            const collection = await getCollection("Service");
            const services = await collection.find({ isDeleted: true }).toArray();
            return { Status: "OK", Result: services };
        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };

    /* ================= RECOVER SERVICE ================= */
recoverService = async (_id) => {
    try {
        const collection         = await getCollection("Service");
        const categoryCollection = await getCollection("ServiceCategory");

        // Find the service first
        const service = await collection.findOne({ _id: new ObjectId(_id) });

        if (!service)
            return { Status: "Fail", Result: "Service not found" };

        // ── VALIDATION ──────────────────────────────────────
        // Check if the parent category is still deleted
        const category = await categoryCollection.findOne({
            _id: service.serviceCategoryId
        });

        if (!category)
            return { Status: "Fail", Result: "Cannot recover — parent category not found" };

        if (category.isDeleted)
            return { Status: "Fail", Result: `Cannot recover — category "${category.name}" is deleted. Recover the category first.` };
        // ────────────────────────────────────────────────────

        await collection.updateOne(
            { _id: new ObjectId(_id) },
            { $set: { isDeleted: false, deletedAt: null } }
        );

        return { Status: "OK", Result: "Service recovered successfully" };

    } catch (error) {
        return { Status: "Fail", Result: error.message };
    }
};
}

module.exports = new ServiceRepository();
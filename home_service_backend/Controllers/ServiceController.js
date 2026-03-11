const ServiceRepository = require("./../Repositories/ServiceRepository");
const { ObjectId } = require("mongodb");

class ServiceController {

    /* ================= CREATE SERVICE ================= */
    createService = async (req, res) => {
        try {
            const { serviceName, serviceCategoryId, maximumPrice, description } = req.body;

            if (!serviceName)
                return res.status(400).json({ Status: "Fail", Result: "Service name is required" });

            if (serviceName.trim().length < 2)
                return res.status(400).json({ Status: "Fail", Result: "Service name must be at least 2 characters" });

            if (!serviceCategoryId)
                return res.status(400).json({ Status: "Fail", Result: "Service Category Id is required" });

            if (!ObjectId.isValid(serviceCategoryId))
                return res.status(400).json({ Status: "Fail", Result: "Invalid Service Category Id format" });

            if (!maximumPrice)
                return res.status(400).json({ Status: "Fail", Result: "Maximum price is required" });

            if (isNaN(maximumPrice) || Number(maximumPrice) <= 0)
                return res.status(400).json({ Status: "Fail", Result: "Maximum price must be a valid positive number" });

            const result = await ServiceRepository.createService(req.body);

            if (result.Status === "OK")
                return res.status(200).json(result);

            if (result.Status === "Conflict")
                return res.status(409).json(result);

            return res.status(400).json(result);

        } catch (error) {
            return res.status(500).json({ Status: "Fail", Result: error.message });
        }
    };


    /* ================= UPDATE SERVICE ================= */
    updateService = async (req, res) => {
        try {
            const { _id, serviceName, serviceCategoryId, maximumPrice } = req.body;

            if (!_id)
                return res.status(400).json({ Status: "Fail", Result: "Service Id is required" });

            if (!ObjectId.isValid(_id))
                return res.status(400).json({ Status: "Fail", Result: "Invalid Service Id format" });

            if (!serviceName)
                return res.status(400).json({ Status: "Fail", Result: "Service name is required" });

            if (!serviceCategoryId)
                return res.status(400).json({ Status: "Fail", Result: "Service Category Id is required" });

            if (!ObjectId.isValid(serviceCategoryId))
                return res.status(400).json({ Status: "Fail", Result: "Invalid Service Category Id format" });

            if (!maximumPrice)
                return res.status(400).json({ Status: "Fail", Result: "Maximum price is required" });

            if (isNaN(maximumPrice) || Number(maximumPrice) <= 0)
                return res.status(400).json({ Status: "Fail", Result: "Maximum price must be a valid positive number" });

            const result = await ServiceRepository.updateService(_id, req.body);

            if (result.Status === "OK")
                return res.status(200).json(result);

            if (result.Status === "Conflict")
                return res.status(409).json(result);

            return res.status(400).json(result);

        } catch (error) {
            return res.status(500).json({ Status: "Fail", Result: error.message });
        }
    };


    /* ================= SERVICE LIST ================= */
    serviceList = async (req, res) => {
        try {
            const result = await ServiceRepository.serviceList();

            if (result.Status === "OK")
                return res.status(200).json(result);

            return res.status(500).json(result);

        } catch (error) {
            return res.status(500).json({ Status: "Fail", Result: error.message });
        }
    };


    /* ================= GET SERVICE BY ID ================= */
    getServiceById = async (req, res) => {
        try {
            const { id } = req.params;

            if (!id)
                return res.status(400).json({ Status: "Fail", Result: "Service Id is required" });

            if (!ObjectId.isValid(id))
                return res.status(400).json({ Status: "Fail", Result: "Invalid Service Id format" });

            const result = await ServiceRepository.getServiceById(id);

            if (result.Status === "OK")
                return res.status(200).json(result);

            return res.status(404).json(result);

        } catch (error) {
            return res.status(500).json({ Status: "Fail", Result: error.message });
        }
    };

    getServiceByCategoryId = async (req, res) => {
    try {
        const { categoryId } = req.params;

        if (!categoryId)
            return res.status(400).json({
                Status: "Fail",
                Result: "Category Id is required"
            });

        if (!ObjectId.isValid(categoryId))
            return res.status(400).json({
                Status: "Fail",
                Result: "Invalid Category Id"
            });

        const result = await ServiceRepository.getServicesByCategoryId(categoryId);

        if (result.Status === "OK")
            return res.status(200).json(result);

        return res.status(404).json(result);

    } catch (error) {
        return res.status(500).json({
            Status: "Fail",
            Result: error.message
        });
    }
};


    /* ================= DELETE SERVICE ================= */
    deleteService = async (req, res) => {
        try {
            const { id } = req.body;

            if (!id)
                return res.status(400).json({ Status: "Fail", Result: "Service Id is required" });

            if (!ObjectId.isValid(id))
                return res.status(400).json({ Status: "Fail", Result: "Invalid Service Id format" });

            const result = await ServiceRepository.deleteService(id);

            if (result.Status === "OK")
                return res.status(200).json(result);

            return res.status(404).json(result);

        } catch (error) {
            return res.status(500).json({ Status: "Fail", Result: error.message });
        }
    };


    /* ================= ACTIVE SERVICE LIST ================= */

activeServiceList = async (req, res) => {

    try {

        const result = await ServiceRepository.activeServiceList();

        if (result.Status === "OK")
            return res.status(200).json(result);

        return res.status(500).json(result);

    } catch (error) {

        return res.status(500).json({
            Status: "Fail",
            Result: error.message
        });

    }

};


/* ================= SERVICES BY SERVICEMAN ================= */

getServiceByServicemanId = async (req, res) => {

    try {

        const { servicemanId } = req.params;

        if (!servicemanId)
            return res.status(400).json({
                Status: "Fail",
                Result: "Serviceman Id required"
            });

        const result = await ServiceRepository.getServiceByServicemanId(servicemanId);

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

deletedServiceList = async (req, res) => {
    try {
        const result = await ServiceRepository.deletedServiceList();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ Status: "Fail", Result: error.message });
    }
};

recoverService = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ Status: "Fail", Result: "Service Id is required" });
        const result = await ServiceRepository.recoverService(id);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ Status: "Fail", Result: error.message });
    }
};
}

module.exports = new ServiceController();
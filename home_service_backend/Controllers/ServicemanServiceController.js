const ServicemanServiceRepository = require("../Repositories/ServicemanServiceRepository");

class ServicemanServiceController {

    applyService = async (req, res) => {

        try {

            const { servicemanId, serviceId, categoryId, charge } = req.body;

            if (!servicemanId)
                return res.status(400).json({
                    Status: "Fail",
                    Result: "Serviceman Id is required"
                });

            if (!serviceId)
                return res.status(400).json({
                    Status: "Fail",
                    Result: "Service Id is required"
                });

            if (!categoryId)
                return res.status(400).json({
                    Status: "Fail",
                    Result: "Category Id is required"
                });
                
            if (!charge)
                return res.status(400).json({ Status: "Fail", Result: "Charge is required" });

            if (isNaN(charge) || Number(charge) <= 0)
                return res.status(400).json({ Status: "Fail", Result: "Charge must be a positive number" });



            const result = await ServicemanServiceRepository.applyService(req.body);

            if (result.Status === "OK")
                return res.status(200).json(result);

            if (result.Status === "Conflict")
                return res.status(409).json(result);

            return res.status(400).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };

servicesByService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const result = await ServicemanServiceRepository.servicesByService(serviceId);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ Status: "Fail", Result: error.message });
    }
};

    servicemanServices = async (req, res) => {

        const { servicemanId } = req.params;

        const result = await ServicemanServiceRepository.servicemanServices(servicemanId);

        return res.json(result);

    };


    changeStatus = async (req, res) => {

        const { _id, status, adminRemark } = req.body;

        const result = await ServicemanServiceRepository.changeStatus(_id, status, adminRemark);

        return res.json(result);

    };


    list = async (req, res) => {

        const result = await ServicemanServiceRepository.list();

        return res.json(result);

    };

}

module.exports = new ServicemanServiceController();
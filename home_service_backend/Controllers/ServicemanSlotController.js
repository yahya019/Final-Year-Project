const ServicemanSlotRepository = require("../Repositories/ServicemanSlotRepository");

class ServicemanSlotController {

    createSlot = async (req, res) => {

    try {

        const { servicemanId, availableDate, totalSlots } = req.body;

        if (!servicemanId)
            return res.status(400).json({
                Status: "Fail",
                Result: "Serviceman Id is required"
            });

        if (!availableDate)
            return res.status(400).json({
                Status: "Fail",
                Result: "Available date is required"
            });

        if (!totalSlots)
            return res.status(400).json({
                Status: "Fail",
                Result: "Total slots required"
            });

        const result = await ServicemanSlotRepository.createSlot(req.body);

        if (result.Status === "OK")
            return res.status(200).json(result);

        if (result.Status === "Conflict")
            return res.status(409).json(result);

        return res.status(400).json(result);

    }
    catch (error) {

        return res.status(500).json({
            Status: "Fail",
            Result: error.message
        });

    }

};


   getSlotById = async (req, res) => {

    try {

        const { id } = req.params;

        if (!id)
            return res.status(400).json({
                Status: "Fail",
                Result: "Slot Id required"
            });

        const result = await ServicemanSlotRepository.getSlotById(id);

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

slotsByServiceman = async (req, res) => {
    try {
        const { servicemanId } = req.params;
        if (!servicemanId)
            return res.status(400).json({ Status: "Fail", Result: "Serviceman Id required" });

        const result = await ServicemanSlotRepository.slotsByServiceman(servicemanId);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ Status: "Fail", Result: error.message });
    }
};

deleteSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await ServicemanSlotRepository.deleteSlot(id);
        if (result.Status === 'OK') return res.status(200).json(result);
        return res.status(400).json(result);
    } catch (error) {
        return res.status(500).json({ Status: "Fail", Result: error.message });
    }
};

}

module.exports = new ServicemanSlotController();
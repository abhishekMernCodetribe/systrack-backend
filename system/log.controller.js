import Log from "../utils/Log.js";

export const getLogs = async (req, res) => {
    try {
        const logs = await Log.find()
            .populate('performedBy', 'name email')
            .populate('entityId', 'name')
            .sort({ timestamp: -1 });

        return res.status(200).json({ logs });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
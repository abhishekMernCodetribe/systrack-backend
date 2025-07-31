import System from "./system.model.js";
import Employee from "../employee/employee.model.js";
import Part from '../parts/parts.model.js';
import mongoose from "mongoose";
import logAction from "../utils/logAction.js";

export const getDashboardStats = async (req, res) => {
    try {
        const totalSystems = await System.countDocuments();
        const allocatedSystems = await System.countDocuments({ status: "assigned" });
        const unallocatedSystems = await System.countDocuments({ status: { $ne: "assigned" } });

        const totalParts = await Part.countDocuments();
        const activeParts = await Part.countDocuments({ status: { $ne: "Unusable" } });
        const unusableParts = await Part.countDocuments({ status: "Unusable" });

        const totalEmployees = await Employee.countDocuments();

        return res.status(200).json({
            message: "All stats fetched",
            totalSystems,
            allocatedSystems,
            unallocatedSystems,
            totalParts,
            activeParts,
            unusableParts,
            totalEmployees
        })
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch dashboard stats." });
    }
}

export const createSystem = async (req, res) => {
    try {
        const { name, parts, EmployeeID, assignedTo, status } = req.body;
        const errors = {};

        const existingName = await System.findOne({ name });
        if (existingName) errors.name = "System already exists";

        if (!Array.isArray(parts) || parts.length === 0) {
            errors.parts = "At least one part must be selected.";
        } else {
            const existingParts = await Part.find({ _id: { $in: parts } });
            if (existingParts.length !== parts.length) {
                errors.parts = "One or more parts do not exist.";
            }
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }
        const system = await System.create({
            name,
            parts,
            assignedTo: EmployeeID || null,
            status: EmployeeID ? 'assigned' : (status || 'available'),
        });

        if (EmployeeID) {
            const employee = await Employee.findById(EmployeeID);

            if (!employee) {
                return res.status(404).json({ message: "Employee not found" });
            }
            await Employee.updateOne(
                { _id: EmployeeID },
                { $set: { allocatedSys: system._id } }
            );

            await logAction({
                actionType: 'ASSIGN_SYSTEM',
                entity: 'System',
                entityId: system._id,
                performedBy: req.user?._id,
                details: {
                    assignedTo: employee.name,
                    employee_email: employee.email,
                },
            });
        }

        await Part.updateMany(
            { _id: { $in: parts } },
            { $set: { assignedSystem: system._id } }
        );

        await system.save();

        return res.status(201).json({
            message: "System created successfully",
            system,
        });

    } catch (err) {
        console.error("Create System Error:", err);
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};


export const updateSystemDetails = async (req, res) => {
    const { name, parts } = req.body;
    const { id: systemId } = req.params;

    const errors = {};

    if (!mongoose.Types.ObjectId.isValid(systemId)) {
        return res.status(400).json({ error: 'Invalid system ID' });
    }

    try {
        const system = await System.findById(systemId);
        if (!system) return res.status(404).json({ error: 'System not found' });

        if (name !== undefined && name.trim() === '') {
            errors.name = "Name should not be empty";
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }
        if (name !== undefined && name.trim() !== '') {
            system.name = name.trim();
        }

        if (Array.isArray(parts) && parts.length > 0) {
            const existingPartIds = system.parts.map(p => p.toString());
            const newPartIds = parts.filter(p => !existingPartIds.includes(p));

            if (newPartIds.length > 0) {
                await Part.updateMany(
                    { _id: { $in: newPartIds } },
                    { $set: { assignedSystem: system._id } }
                );
                const mergedParts = [...existingPartIds, ...newPartIds];
                const uniqueParts = [...new Set(mergedParts)];

                system.parts = uniqueParts;
            }
        }

        await system.save();

        res.status(200).json({
            message: 'System updated successfully',
            system
        });

    } catch (err) {
        console.error('Error updating system:', err);
        res.status(500).json({
            error: 'Failed to update system',
            details: err.message
        });
    }
};

export const removePartFromSystem = async (req, res) => {
    const { systemId, partId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(systemId) || !mongoose.Types.ObjectId.isValid(partId)) {
        return res.status(400).json({ error: 'Invalid system or part ID' });
    }

    try {
        const system = await System.findByIdAndUpdate(
            systemId,
            { $pull: { parts: partId } },
            { new: true }
        );

        if (!system) return res.status(404).json({ error: 'System not found' });

        await Part.findByIdAndUpdate(partId, {
            $pull: { assignedSystem: systemId },
        });

        res.status(200).json({ message: 'Part removed from system successfully', system });
    } catch (err) {
        res.status(500).json({ error: 'Error removing part from system', details: err.message });
    }
};

export const getPartsBySystemId = async (req, res) => {
    const { systemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(systemId)) {
        return res.status(400).json({ error: 'Invalid system ID' });
    }

    try {
        const parts = await Part.find({ assignedSystem: systemId });
        res.status(200).json({ message: 'Parts fetched successfully', parts });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch parts', details: error.message });
    }
};

export const getAllSystems = async (req, res) => {
    try {
        const { search = '', status = '', page = 1, limit = 10 } = req.query;
        const query = {};

        if (search.trim() !== '') {
            query.name = { $regex: search.trim(), $options: 'i' };
        }

        if (status === 'assigned') {
            query.assignedTo = { $ne: null };
        } else if (status === 'unassigned') {
            query.assignedTo = null;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const totalSystems = await System.countDocuments(query);

        const systems = await System.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .populate({
                path: 'parts',
                model: 'Parts'
            })
            .populate('assignedTo', 'email');

        if (!systems) return res.status(404).json({ message: "No System found" });

        return res.status(200).json({
            message: 'Systems fetched successfully',
            systems,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalSystems / limit),
            totalSystems
        })
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

export const unassignSystem = async (req, res) => {
    const { systemId } = req.params;

    try {
        const system = await System.findById(systemId).populate('assignedTo').populate('parts');
        if (!system) {
            return res.status(404).json({ message: 'System not found' });
        }

        const employee = system.assignedTo;

        await Employee.updateMany(
            { allocatedSys: system._id },
            { $unset: { allocatedSys: "" } }
        );

        await Promise.all(
            system.parts.map(part =>
                Part.findByIdAndUpdate(part._id, { allocatedTo: null })
            )
        );

        const updatedSystem = await System.findByIdAndUpdate(
            systemId,
            {
                assignedTo: null,
                status: 'unassigned',
            },
            { new: true }
        ).populate('parts');


        if (employee) {
            await logAction({
                actionType: 'UNASSIGN_SYSTEM',
                entity: 'System',
                entityId: systemId,
                performedBy: req.user?._id,
                details: {
                    UnassignedFrom: employee.name || 'Unknown',
                    employee_email: employee.email || 'Unknown'
                }
            });
        }

        return res.status(200).json({
            message: 'System unassigned',
            system: updatedSystem,
        });
    } catch (error) {
        console.error("Unassignment failed:", error);
        return res.status(500).json({ message: 'Unassignment failed', error });
    }
};

export const assignSystemToEmployee = async (req, res) => {
    const { systemId } = req.params;
    const { EmployeeID } = req.body;

    if (!mongoose.Types.ObjectId.isValid(systemId) || !mongoose.Types.ObjectId.isValid(EmployeeID)) {
        return res.status(400).json({ message: 'Invalid system or employee ID' });
    }

    try {
        const system = await System.findById(systemId).populate('parts');
        const employee = await Employee.findById(EmployeeID);

        if (!system) {
            return res.status(404).json({ message: 'System not found' });
        }

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        await Employee.updateMany(
            { allocatedSys: system._id },
            { $unset: { allocatedSys: "" } }
        );

        employee.allocatedSys = system._id;
        await employee.save();

        system.assignedTo = EmployeeID;
        system.status = 'assigned';
        await system.save();

        await logAction({
            actionType: 'ASSIGN_SYSTEM',
            entity: 'System',
            entityId: systemId,
            performedBy: req.user?._id,
            details: {
                assignedTo: employee.name,
                employee_email: employee.email
            }
        })

        return res.status(200).json({
            message: 'System assigned to employee successfully',
            system
        });
    } catch (error) {
        console.error("Assignment failed:", error);
        return res.status(500).json({ message: 'Assignment failed', error });
    }
};
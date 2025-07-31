import Employee from './employee.model.js';
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'abhishekmern.codetribe@gmail.com',
        pass: 'cecy xhha ping fwwq',
    },
});

const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

export const createEmployee = async (req, res) => {
    try {
        const { name, employeeID, department, designation, email, phone } = req.body;

        const errors = {};

        if (!name) errors.name = 'Name is required';
        if (!employeeID) errors.employeeID = 'employeeID is required';
        if (!department) errors.department = 'department is required';
        if (!designation) errors.designation = 'designation is required';
        if (!email) errors.email = 'email is required';
        if (!phone) errors.phone = 'phone is required';

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        const hasSpecialCharacters = (value) => /[^a-zA-Z0-9 ]/.test(value);
        ['name', 'employeeID', 'department', 'designation', 'phone'].forEach((field) => {
            if (req.body[field] && hasSpecialCharacters(req.body[field])) {
                errors[field] = `${field} contains special characters`;
            }
        });

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        if (!Number(employeeID)) errors.employeeID = "employeeID should be a number";
        const existingEmployee = await Employee.findOne({ employeeID });
        if (existingEmployee) errors.employeeID = "employeeID already exists";

        if (!isValidEmail(email)) errors.email = "Enter the valid Email";
        const exisitingEmail = await Employee.findOne({ email });
        if (exisitingEmail) errors.email = "Email already exists";

        if (phone.toString().length < 10) errors.phone = "Phone number is invalid";
        let existingPhone;
        if (!errors.phone) {
            existingPhone = await Employee.findOne({ phone });
        }
        if (existingPhone) errors.phone = "Phone number already exists";

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        const employee = await Employee.create(req.body);
        return res.status(201).json(employee);
    } catch (err) {
        console.error("Error in creating parts", err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

export const getUnassignedEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({
            $or: [
                {
                    allocatedSys: { $exists: false }
                },
                {
                    allocatedSys: null
                }
            ]
        });

        res.status(200).json({
            message: "Unassigned employees fetched successfully",
            employees
        });
    } catch (error) {
        console.error("Error fetching unassigned employees:", error);
        res.status(500).json({ error: "Server error while fetching unassigned employees" });
    }
}

export const getEmployeeDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await Employee.findById(id)
            .populate({
                path: 'allocatedSys',
                model: 'System',
                populate: {
                    path: 'parts',
                    model: 'Parts'
                }
            });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        return res.status(200).json({
            message: 'Employee fetched successfully',
            employee
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
};

export const getAllEmployees = async (req, res) => {
    try {
        const {search = '', page = 1, limit = 10} = req.query;
        const query = {};

        if(search.trim() !== ''){
            query.email = {$regex: search.trim(), $options: 'i'};
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const totalEmployees = await Employee.countDocuments(query);

        const employees = await Employee.find(query)
                                        .skip(skip)
                                        .limit(parseInt(limit))
                                        .populate({
                                            path: 'allocatedSys',
                                            populate: {
                                                path: 'parts',
                                                model: 'Parts'
                                            }
                                        })

        if (!employees) return res.status(404).json({ message: "No employee found" });

        return res.status(200).json({ 
            message: 'Employees fetched successfully', 
            employees,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalEmployees/limit),
            totalEmployees
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

export const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findByIdAndDelete(id);

        if (!employee) return res.status(404).json({ message: "Employee not found" });

        return res.status(200).json({ success: true, message: "Employee deleted successfully", employee });
    } catch (err) {
        return res.status(500).json({ message: "Something went wrong in deleting employee" });
    }
}

export const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, employeeID, department, designation, email, phone } = req.body;

        const errors = {};

        const hasSpecialCharacters = (value) => /[^a-zA-Z0-9 ]/.test(value);
        ['name', 'employeeID', 'department', 'designation', 'phone'].forEach((field) => {
            if (req.body[field] && hasSpecialCharacters(req.body[field])) {
                errors[field] = `${field} contains special characters`;
            }
        });

        if (phone && (!Number(phone) || phone.toString().length < 10)) {
            errors.phone = "Enter the valid phone number";
        }

        if (email && !isValidEmail(email)) errors.email = "Enter the valid Email";
        let exisitingEmail;
        if (email && !errors.email) {
            exisitingEmail = await Employee.findOne({ email });
        }
        if (email && exisitingEmail) errors.email = "Email already exists";

        if (employeeID && !Number(employeeID)) errors.employeeID = "employeeID should be a number";
        let existingEmployee;
        if(employeeID && !errors.employeeID) existingEmployee = await Employee.findOne({ employeeID });
        if (employeeID && existingEmployee) errors.employeeID = "employeeID already exists";

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedEmployee) return res.status(404).json({ error: "Employee not found" });

        return res.status(200).json({ message: "Employee updated successfully", updatedEmployee })

    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}
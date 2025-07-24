import express from "express";
import { createEmployee, deleteEmployee, getAllEmployees, getEmployeeDetails, getUnassignedEmployees, updateEmployee } from "./employee.controller.js";

const router = express.Router();

router.get('/allemployee', getAllEmployees);
router.get('/unassigned', getUnassignedEmployees);
router.post('/', createEmployee);
router.delete('/:id', deleteEmployee);
router.get('/:id', getEmployeeDetails);
router.put('/:id', updateEmployee);

export default router;
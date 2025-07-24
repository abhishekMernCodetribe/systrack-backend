import express from 'express';
import {assignSystemToEmployee, createSystem, getAllSystems, getDashboardStats, getPartsBySystemId, removePartFromSystem, unassignSystem, updateSystemDetails } from './system.controller.js';

const router = express.Router();

router.get('/stats', getDashboardStats);
router.post('/', createSystem);
router.get('/allsys', getAllSystems);
router.post('/updateSystem/:id', updateSystemDetails);
router.get('/by-system/:systemId', getPartsBySystemId);
router.put('/:systemId/remove-part/:partId', removePartFromSystem); 
router.patch("/unassign/:systemId", unassignSystem);
router.post('/assignSystem/:systemId', assignSystemToEmployee);


export default router;

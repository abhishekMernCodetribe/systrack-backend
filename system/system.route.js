import express from 'express';
import {assignSystemToEmployee, createSystem, getAllSystems, getDashboardStats, getPartsBySystemId, removePartFromSystem, unassignSystem, updateSystemDetails } from './system.controller.js';
import { getLogs } from './log.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', getDashboardStats);
router.get('/logs', getLogs);
router.post('/',verifyToken, createSystem);
router.get('/allsys', getAllSystems);
router.post('/updateSystem/:id', updateSystemDetails);
router.get('/by-system/:systemId', getPartsBySystemId);
router.put('/:systemId/remove-part/:partId', removePartFromSystem); 
router.patch("/unassign/:systemId", verifyToken, unassignSystem);
router.post('/assignSystem/:systemId',verifyToken, assignSystemToEmployee);


export default router;

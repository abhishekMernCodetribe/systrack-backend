import express from "express";
import { createPart, deletePartById, getAllParts, getBarcodeInfo, getFreeParts, getUnusableParts, markPartUnusable, restorePart, updatePart } from "./parts.controller.js";

const router = express.Router();

router.post('/', createPart);
router.get('/', getAllParts);
router.get('/barcode/:imageName', getBarcodeInfo);
router.get('/freeparts', getFreeParts);
router.get("/unusable", getUnusableParts);
router.patch("/:id/unusable", markPartUnusable);
router.patch("/:id/restore", restorePart);
router.put('/:id', updatePart);
router.delete('/:id', deletePartById);

export default router;
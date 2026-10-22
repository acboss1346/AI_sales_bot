import { Router } from 'express';
import multer from 'multer';
import {
  createCall,
  updateCall,
  getCallById,
  getCalls
} from '../services/db.js';
import { uploadCallRecording } from '../services/storage.js';
import { generateCallSummaryAndClassification } from '../services/aiSummary.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// POST /api/calls — Create call record
router.post('/', async (req, res) => {
  try {
    const { started_at, recording_consent } = req.body;
    const call = await createCall({
      started_at: started_at || new Date().toISOString(),
      recording_consent: Boolean(recording_consent)
    });
    return res.status(201).json({ success: true, data: call });
  } catch (err) {
    console.error('Error creating call:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/calls — List calls with search & filter
router.get('/', async (req, res) => {
  try {
    const { page, limit, status, search, sortBy } = req.query;
    const result = await getCalls({ page, limit, status, search, sortBy });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('Error fetching calls:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/calls/:id — Retrieve single call
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const call = await getCallById(id);
    if (!call) {
      return res.status(404).json({ success: false, error: 'Call not found' });
    }
    return res.status(200).json({ success: true, data: call });
  } catch (err) {
    console.error('Error fetching call by id:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/calls/:id — Update call transcript/duration
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existing = await getCallById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Call not found' });
    }

    const updated = await updateCall(id, updates);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating call:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/calls/:id/finalize — Finalize call & generate AI summary + sales classification
router.post('/:id/finalize', async (req, res) => {
  try {
    const { id } = req.params;
    const { transcript, ended_at, duration_seconds } = req.body;

    const existing = await getCallById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Call not found' });
    }

    const finalTranscript = Array.isArray(transcript) ? transcript : (existing.transcript || []);
    const finalEndedAt = ended_at || new Date().toISOString();
    
    let finalDuration = duration_seconds;
    if (finalDuration === undefined || finalDuration === null) {
      const startMs = new Date(existing.started_at).getTime();
      const endMs = new Date(finalEndedAt).getTime();
      finalDuration = Math.max(0, Math.round((endMs - startMs) / 1000));
    }

    // Generate AI Summary and Sales Classification
    let aiResult;
    let processing_status = 'completed';
    try {
      aiResult = await generateCallSummaryAndClassification(finalTranscript);
    } catch (aiErr) {
      console.error('AI summary generation failure:', aiErr.message);
      processing_status = 'retry_pending';
      aiResult = {
        summary: 'AI summary generation pending or failed. Click retry to regenerate.',
        customer_requirements: [],
        objections: [],
        customer_interest: 'Low',
        next_steps: ['Review transcript manually'],
        sales_status: 'No Response',
        status_reason: 'Automated classification failed: ' + aiErr.message
      };
    }

    const updated = await updateCall(id, {
      ended_at: finalEndedAt,
      duration_seconds: finalDuration,
      transcript: finalTranscript,
      summary: aiResult.summary,
      customer_requirements: aiResult.customer_requirements,
      objections: aiResult.objections,
      next_steps: aiResult.next_steps,
      customer_interest: aiResult.customer_interest,
      sales_status: aiResult.sales_status,
      status_reason: aiResult.status_reason,
      processing_status
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Error finalizing call:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/calls/:id/recording — Upload completed call recording
router.post('/:id/recording', upload.single('audio'), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getCallById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Call not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file provided' });
    }

    const { recording_path, recording_url } = await uploadCallRecording({
      callId: id,
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype
    });

    const updated = await updateCall(id, {
      recording_path,
      recording_url
    });

    return res.status(200).json({
      success: true,
      data: {
        recording_path,
        recording_url,
        call: updated
      }
    });
  } catch (err) {
    console.error('Error uploading call recording:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/calls/:id/retry-summary — Retry summary generation
router.post('/:id/retry-summary', async (req, res) => {
  try {
    const { id } = req.params;
    const call = await getCallById(id);
    if (!call) {
      return res.status(404).json({ success: false, error: 'Call not found' });
    }

    const aiResult = await generateCallSummaryAndClassification(call.transcript || []);
    const updated = await updateCall(id, {
      summary: aiResult.summary,
      customer_requirements: aiResult.customer_requirements,
      objections: aiResult.objections,
      next_steps: aiResult.next_steps,
      customer_interest: aiResult.customer_interest,
      sales_status: aiResult.sales_status,
      status_reason: aiResult.status_reason,
      processing_status: 'completed'
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Error retrying call summary:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

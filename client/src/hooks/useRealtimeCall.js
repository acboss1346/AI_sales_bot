import { useState, useRef, useEffect, useCallback } from 'react';
import {
  fetchRealtimeSession,
  createCallRecord,
  finalizeCall,
  uploadCallRecording
} from '../services/api.js';

export function useRealtimeCall() {
  const [callStatus, setCallStatus] = useState('idle'); // idle | requesting_permissions | connecting | connected | ending | ended | error
  const [callDuration, setCallDuration] = useState(0);
  const [recordingConsent, setRecordingConsent] = useState(true);
  const [transcript, setTranscript] = useState([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isCustomerSpeaking, setIsCustomerSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [finalizedCall, setFinalizedCall] = useState(null);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);

  // References
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const currentAiTurnIdRef = useRef(null);

  // Ensure remote audio element exists in memory
  useEffect(() => {
    if (!remoteAudioRef.current) {
      const audio = document.createElement('audio');
      audio.autoplay = true;
      audio.setAttribute('playsinline', 'true');
      remoteAudioRef.current = audio;
    }
  }, []);

  // Timer effect when connected
  useEffect(() => {
    if (callStatus === 'connected') {
      callStartTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        setCallDuration(secs);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [callStatus]);

  // Handle incoming OpenAI Realtime data-channel events
  const handleRealtimeEvent = useCallback((event) => {
    switch (event.type) {
      case 'input_audio_buffer.speech_started':
        setIsCustomerSpeaking(true);
        setIsAiSpeaking(false);
        break;

      case 'input_audio_buffer.speech_stopped':
        setIsCustomerSpeaking(false);
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript && event.transcript.trim()) {
          const customerText = event.transcript.trim();
          setTranscript((prev) => [
            ...prev,
            {
              id: 'cust-' + Date.now(),
              speaker: 'Customer',
              text: customerText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }
          ]);
        }
        break;

      case 'response.audio_transcript.delta':
        setIsAiSpeaking(true);
        const delta = event.delta || '';
        const currentId = currentAiTurnIdRef.current || ('ai-' + Date.now());
        currentAiTurnIdRef.current = currentId;

        setTranscript((prev) => {
          const lastIndex = prev.findIndex((item) => item.id === currentId);
          if (lastIndex !== -1) {
            const updated = [...prev];
            updated[lastIndex] = {
              ...updated[lastIndex],
              text: updated[lastIndex].text + delta
            };
            return updated;
          } else {
            return [
              ...prev,
              {
                id: currentId,
                speaker: 'AI',
                text: delta,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              }
            ];
          }
        });
        break;

      case 'response.audio_transcript.done':
        currentAiTurnIdRef.current = null;
        break;

      case 'response.done':
        setIsAiSpeaking(false);
        break;

      case 'error':
        console.error('OpenAI Realtime session event error:', event.error);
        break;

      default:
        break;
    }
  }, []);

  // Start Call Flow
  const startCall = async () => {
    setErrorMessage(null);
    setTranscript([]);
    setCallDuration(0);
    setFinalizedCall(null);
    audioChunksRef.current = [];
    currentAiTurnIdRef.current = null;

    try {
      setCallStatus('requesting_permissions');

      // 1. Request microphone permissions early
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      localStreamRef.current = stream;

      setCallStatus('connecting');

      // 2. Create initial call record in database
      const callRecord = await createCallRecord({
        started_at: new Date().toISOString(),
        recording_consent: recordingConsent
      });
      setCurrentCallId(callRecord.id);

      // 3. Mint short-lived ephemeral client session token from backend
      const sessionData = await fetchRealtimeSession();
      const ephemeralKey = sessionData.client_secret?.value || sessionData.value;
      const model = sessionData.model || 'gpt-realtime-mini';

      if (!ephemeralKey) {
        throw new Error('Server did not return a valid Realtime ephemeral token');
      }

      // 4. Create WebRTC PeerConnection
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // 5. Add local mic tracks to PeerConnection
      stream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // 6. Set up Web Audio Context for Dual-Audio Recording (Customer + AI)
      let mixedAudioStream = null;
      if (recordingConsent && (window.AudioContext || window.webkitAudioContext)) {
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;

          const micSource = audioCtx.createMediaStreamSource(stream);
          const mixedDest = audioCtx.createMediaStreamDestination();
          micSource.connect(mixedDest);

          // We will connect remote AI track once ontrack fires
          mixedAudioStream = mixedDest;
        } catch (audioCtxErr) {
          console.warn('Web Audio Context initialization warning:', audioCtxErr);
        }
      }

      // 7. Receive remote audio track from OpenAI
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch((err) => {
            console.warn('Remote audio autoplay policy catch:', err);
          });
        }

        // Connect remote AI stream to Web Audio recorder destination
        if (mixedAudioStream && audioContextRef.current) {
          try {
            const aiSource = audioContextRef.current.createMediaStreamSource(remoteStream);
            aiSource.connect(mixedAudioStream);

            // Initialize MediaRecorder on the combined stream
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
              ? 'audio/webm;codecs=opus'
              : 'audio/webm';

            const recorder = new MediaRecorder(mixedAudioStream.stream, { mimeType });
            recorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) {
                audioChunksRef.current.push(e.data);
              }
            };
            recorder.start(250);
            mediaRecorderRef.current = recorder;
          } catch (recErr) {
            console.warn('Failed to start dual MediaRecorder:', recErr);
          }
        }
      };

      // 8. Create Data Channel for Realtime Events
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;

      dc.onopen = () => {
        console.log('⚡ WebRTC OpenAI Data Channel opened successfully');
        setCallStatus('connected');

        // Trigger initial greeting from the assistant
        try {
          const triggerGreeting = {
            type: 'response.create',
            response: {
              modalities: ['audio', 'text'],
              instructions: 'Introduce yourself politely as SalesFlow AI and ask how you can help the customer today.'
            }
          };
          dc.send(JSON.stringify(triggerGreeting));
        } catch (greetErr) {
          console.warn('Initial greeting trigger warning:', greetErr);
        }
      };

      dc.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          handleRealtimeEvent(msg);
        } catch (parseErr) {
          console.warn('Data channel parse error:', parseErr);
        }
      };

      dc.onerror = (err) => {
        console.error('Data channel error:', err);
      };

      // 9. Generate SDP Offer and exchange with OpenAI Realtime calls endpoint
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp'
        }
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        throw new Error(`OpenAI WebRTC negotiation failed (${sdpResponse.status}): ${errorText}`);
      }

      const answerSdp = await sdpResponse.text();
      const answer = {
        type: 'answer',
        sdp: answerSdp
      };

      await pc.setRemoteDescription(answer);

      // WebRTC Connection State Monitor
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          console.warn('WebRTC connection state changed to:', pc.connectionState);
          if (callStatus === 'connected') {
            endCall();
          }
        }
      };

    } catch (err) {
      console.error('Error starting call:', err);
      setCallStatus('error');
      setErrorMessage(err.message || 'Failed to start AI voice call');
      // Cleanup any allocated media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    }
  };

  // End Call Flow
  const endCall = async () => {
    if (callStatus === 'ending' || callStatus === 'ended' || callStatus === 'idle') {
      return;
    }

    setCallStatus('ending');
    setIsAiSpeaking(false);
    setIsCustomerSpeaking(false);

    const callId = currentCallId;
    const finalDuration = callDuration;
    const finalEndedAt = new Date().toISOString();

    // 1. Stop MediaRecorder and grab completed audio blob
    let recordedAudioBlob = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        await new Promise((resolve) => {
          mediaRecorderRef.current.onstop = resolve;
          mediaRecorderRef.current.stop();
        });
        if (audioChunksRef.current.length > 0) {
          recordedAudioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorderRef.current.mimeType || 'audio/webm'
          });
        }
      } catch (recStopErr) {
        console.warn('Error stopping MediaRecorder:', recStopErr);
      }
    }

    // 2. Stop local mic tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // 3. Close AudioContext
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }

    // 4. Close WebRTC PeerConnection & Data Channel
    if (dataChannelRef.current) {
      try {
        dataChannelRef.current.close();
      } catch (e) {}
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {}
      peerConnectionRef.current = null;
    }

    // 5. Finalize call on backend (Triggers AI Summary & Sales Status classification)
    if (callId) {
      try {
        const finalized = await finalizeCall(callId, {
          transcript,
          ended_at: finalEndedAt,
          duration_seconds: finalDuration
        });
        setFinalizedCall(finalized);

        // 6. Upload audio recording if available and consented
        if (recordedAudioBlob && recordingConsent) {
          setIsUploadingRecording(true);
          try {
            const uploadResult = await uploadCallRecording(callId, recordedAudioBlob);
            setFinalizedCall((prev) => ({
              ...prev,
              recording_path: uploadResult.recording_path,
              recording_url: uploadResult.recording_url
            }));
          } catch (uploadErr) {
            console.error('Recording upload error:', uploadErr);
          } finally {
            setIsUploadingRecording(false);
          }
        }
      } catch (finalizeErr) {
        console.error('Call finalization error:', finalizeErr);
      }
    }

    setCallStatus('ended');
  };

  return {
    callStatus,
    callDuration,
    recordingConsent,
    setRecordingConsent,
    transcript,
    isAiSpeaking,
    isCustomerSpeaking,
    errorMessage,
    currentCallId,
    finalizedCall,
    isUploadingRecording,
    startCall,
    endCall
  };
}

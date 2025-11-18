
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { Transcript } from '../types';

const useGeminiLive = () => {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isAITalking, setIsAITalking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('กดปุ่มไมโครโฟนเพื่อเริ่มคุย');

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const stopSessionCleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.input.close();
      audioContextRef.current.output.close();
      audioContextRef.current = null;
    }

    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    setIsSessionActive(false);
    setIsAITalking(false);
    setStatusMessage('กดปุ่มไมโครโฟนเพื่อเริ่มคุย');
  }, []);


  const startSession = useCallback(async () => {
    setTranscripts([]);
    setStatusMessage('กำลังเชื่อมต่อ...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = { input: inputAudioContext, output: outputAudioContext };
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          // Reduce latency by disabling the thinking budget
          thinkingConfig: { thinkingBudget: 0 },
          systemInstruction: 'You are "RightCode Buddy", a friendly and helpful AI assistant from Thailand. Your name is "RightCode Buddy". ALWAYS refer to yourself as "RightCode Buddy", not Gemini. Respond in Thai using ONLY feminine-ending particles like "ค่ะ" and "คะ". NEVER use masculine particles like "ครับ". All your responses must be safe and appropriate for children, avoiding any violent, adult (18+), or otherwise sensitive topics. Keep your responses concise and conversational.',
        },
        callbacks: {
          onopen: () => {
            setStatusMessage('เชื่อมต่อสำเร็จ! เริ่มพูดได้เลย...');
            setIsSessionActive(true);
            const source = inputAudioContext.createMediaStreamSource(stream);
            mediaStreamSourceRef.current = source;
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob: Blob = {
                  data: encode(new Uint8Array(new Int16Array(inputData.map(v => v * 32768)).buffer)),
                  mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                setIsAITalking(true);
                const audioData = message.serverContent.modelTurn.parts[0].inlineData.data;
                const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContext, 24000, 1);
                
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);

                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.start(nextStartTimeRef.current);

                nextStartTimeRef.current += audioBuffer.duration;
                audioSourcesRef.current.add(source);
                source.onended = () => {
                    audioSourcesRef.current.delete(source);
                    if (audioSourcesRef.current.size === 0) {
                        setIsAITalking(false);
                    }
                };
            }
            if (message.serverContent?.inputTranscription) {
                currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
                currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
            }
            if (message.serverContent?.turnComplete) {
                const userInput = currentInputTranscriptionRef.current.trim();
                const aiResponse = currentOutputTranscriptionRef.current.trim();

                setTranscripts(prev => [
                    ...prev,
                    ...(userInput ? [{ speaker: 'user', text: userInput }] : []),
                    ...(aiResponse ? [{ speaker: 'ai', text: aiResponse }] : [])
                ]);

                currentInputTranscriptionRef.current = '';
                currentOutputTranscriptionRef.current = '';
                setIsAITalking(false);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Session error:', e);
            setStatusMessage(`เกิดข้อผิดพลาด: ${e.message}`);
            stopSessionCleanup();
          },
          onclose: () => {
             stopSessionCleanup();
          },
        },
      });
      sessionPromiseRef.current = sessionPromise;

    } catch (error) {
      console.error('Failed to start session:', error);
      setStatusMessage('ไม่สามารถเข้าถึงไมโครโฟนได้');
      stopSessionCleanup();
    }
  }, [stopSessionCleanup]);

  const stopSession = useCallback(async () => {
    setStatusMessage('กำลังตัดการเชื่อมต่อ...');
    if (sessionPromiseRef.current) {
        try {
            const session = await sessionPromiseRef.current;
            session.close();
        } catch (error) {
            console.error('Error closing session:', error);
        } finally {
            sessionPromiseRef.current = null;
        }
    }
    stopSessionCleanup();
  }, [stopSessionCleanup]);
  
  useEffect(() => {
    return () => {
        if(isSessionActive) {
            stopSession();
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { transcripts, isSessionActive, isAITalking, statusMessage, startSession, stopSession };
};

export default useGeminiLive;

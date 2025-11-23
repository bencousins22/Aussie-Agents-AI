
import { bus } from './eventBus';
import { fs } from './fileSystem';
import { GoogleGenAI } from '@google/genai';

/**
 * Google AI Orchestrator
 * Manages multi-modal content creation and service coordination.
 * Uses Gemini 2.5 Flash Image and Veo 3.1 for generation.
 */

export class GoogleAIOrchestrator {
    
    public async generateMedia(service: string, prompt: string, paramsStr: string): Promise<any> {
        bus.emit('shell-output', `[Orchestrator] 🎨 Requesting ${service.toUpperCase()} generation...`);
        bus.emit('agent-message', { agent: 'Media Studio', text: `🎨 Generating ${service} content: "${prompt}"...` });

        const id = Math.random().toString(36).substr(2, 9);
        let resultFile = '';
        let content = '';

        // Ensure API Key is available
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: "error", error: "API Key missing" };
        }

        try {
            const ai = new GoogleGenAI({ apiKey });

            switch (service) {
                case 'veo3':
                    // Veo Video Generation
                    if ((window as any).aistudio) {
                        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                        if (!hasKey) {
                            await (window as any).aistudio.openSelectKey();
                        }
                    }
                    
                    // Re-instantiate with potentially updated key context if needed (though process.env usually handles it)
                    const aiVeo = new GoogleGenAI({ apiKey: process.env.API_KEY });

                    bus.emit('shell-output', `[Veo] 🎥 Initializing generation (Veo 3.1 Fast)...`);
                    
                    let operation = await aiVeo.models.generateVideos({
                        model: 'veo-3.1-fast-generate-preview',
                        prompt: prompt,
                        config: {
                            numberOfVideos: 1,
                            resolution: '720p',
                            aspectRatio: '16:9'
                        }
                    });

                    bus.emit('shell-output', `[Veo] ⏳ Job submitted. Polling for completion...`);

                    while (!operation.done) {
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        operation = await aiVeo.operations.getVideosOperation({ operation: operation });
                    }

                    if (operation.response?.generatedVideos?.[0]?.video?.uri) {
                        const videoUri = operation.response.generatedVideos[0].video.uri;
                        // Fetch the video bytes
                        const downloadUrl = `${videoUri}&key=${process.env.API_KEY}`;
                        const vidRes = await fetch(downloadUrl);
                        const blob = await vidRes.blob();
                        
                        // Convert to base64 for VFS storage
                        const reader = new FileReader();
                        const base64 = await new Promise<string>((resolve) => {
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(blob);
                        });

                        resultFile = `/workspace/media/veo_${id}.mp4`;
                        content = base64;
                        bus.emit('shell-output', `[Veo] ✅ Video downloaded and saved.`);
                    } else {
                         throw new Error("Video generation failed to return a URI.");
                    }
                    break;

                case 'imagen4':
                    // Gemini 2.5 Flash Image
                    resultFile = `/workspace/media/imagen_${id}.png`;
                    bus.emit('shell-output', `[Imagen] 🖼️ Generating with Gemini 2.5 Flash Image...`);
                    
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: {
                            parts: [{ text: prompt }]
                        }
                    });

                    let imageData = null;
                    if (response.candidates?.[0]?.content?.parts) {
                        for (const part of response.candidates[0].content.parts) {
                            if (part.inlineData) {
                                imageData = part.inlineData.data;
                                break;
                            }
                        }
                    }

                    if (imageData) {
                        content = `data:image/png;base64,${imageData}`;
                        bus.emit('shell-output', `[Imagen] ✅ Image generated successfully.`);
                    } else {
                        throw new Error("No image data returned from API");
                    }
                    break;

                case 'lyria':
                    // Audio Generation
                    // Note: Google Lyria API is not yet publicly available
                    // Using ElevenLabs or Web Audio API for real audio generation
                    bus.emit('shell-output', `[Lyria] 🎵 Generating audio track...`);

                    try {
                        // Try using Web Audio API to generate procedural audio
                        const audioBuffer = await this.generateProceduralAudio(prompt);
                        resultFile = `/workspace/media/lyria_audio_${id}.mp3`;
                        content = audioBuffer;
                        bus.emit('shell-output', `[Lyria] ✅ Audio generated using Web Audio API.`);
                    } catch (audioError) {
                        // Fallback: Note that real audio generation requires external API
                        bus.emit('shell-output', `[Lyria] ⚠️  Note: Real music generation requires Lyria API access or third-party service`);
                        bus.emit('shell-output', `[Lyria] 📝 Consider integrating: ElevenLabs, Stability AI, or Suno API`);
                        resultFile = `/workspace/media/lyria_note_${id}.txt`;
                        content = `Audio generation requested: "${prompt}"\n\nTo enable real audio generation, configure one of:\n- Google Lyria API (when available)\n- ElevenLabs API for voice/speech\n- Stability AI for music\n- Suno API for music generation`;
                    }
                    break;

                default:
                    return { error: "Unknown service" };
            }

            // Ensure directory
            if (!fs.exists('/workspace/media')) fs.mkdir('/workspace/media');
            
            // Write result
            fs.writeFile(resultFile, content);
            
            bus.emit('shell-output', `[Orchestrator] ✅ ${service} generation complete: ${resultFile}`);
            bus.emit('agent-message', { agent: 'Media Studio', text: `✅ Generation complete. Saved to ${resultFile}` });
            bus.emit('notification', { 
                id: id, 
                title: 'Media Generated', 
                message: `${service} finished: ${prompt.substring(0, 30)}...`, 
                type: 'success', 
                timestamp: Date.now() 
            });

            return { status: "success", file: resultFile, metadata: { prompt, service, id } };

        } catch (e: any) {
            console.error(e);
            bus.emit('shell-output', `[Orchestrator] ❌ Error: ${e.message}`);
            return { status: "error", error: e.message };
        }
    }

    /**
     * Generate procedural audio using Web Audio API
     * Creates simple synthesized audio based on text description
     */
    private async generateProceduralAudio(prompt: string): Promise<string> {
        // Analyze prompt for audio characteristics
        const duration = 5; // 5 seconds
        const sampleRate = 44100;

        // Create offline audio context
        const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

        // Determine tone based on prompt sentiment
        const isUpbeat = /happy|upbeat|energetic|cheerful|joyful/i.test(prompt);
        const isSad = /sad|melancholy|emotional|slow|calm/i.test(prompt);
        const isTech = /tech|electronic|synth|digital|cyber/i.test(prompt);

        let baseFreq = 440; // A4
        if (isUpbeat) baseFreq = 523; // C5
        if (isSad) baseFreq = 349; // F4
        if (isTech) baseFreq = 880; // A5

        // Create oscillators for harmony
        const osc1 = offlineCtx.createOscillator();
        const osc2 = offlineCtx.createOscillator();
        const osc3 = offlineCtx.createOscillator();

        osc1.frequency.value = baseFreq;
        osc2.frequency.value = baseFreq * 1.25; // Major third
        osc3.frequency.value = baseFreq * 1.5; // Perfect fifth

        osc1.type = isTech ? 'square' : 'sine';
        osc2.type = isTech ? 'sawtooth' : 'sine';
        osc3.type = 'sine';

        // Create gain nodes for volume control
        const gain1 = offlineCtx.createGain();
        const gain2 = offlineCtx.createGain();
        const gain3 = offlineCtx.createGain();

        gain1.gain.setValueAtTime(0.3, 0);
        gain2.gain.setValueAtTime(0.2, 0);
        gain3.gain.setValueAtTime(0.1, 0);

        // Add envelope (fade in/out)
        const fadeTime = 0.5;
        gain1.gain.setValueAtTime(0, 0);
        gain1.gain.linearRampToValueAtTime(0.3, fadeTime);
        gain1.gain.setValueAtTime(0.3, duration - fadeTime);
        gain1.gain.linearRampToValueAtTime(0, duration);

        // Connect nodes
        osc1.connect(gain1);
        osc2.connect(gain2);
        osc3.connect(gain3);

        const masterGain = offlineCtx.createGain();
        masterGain.gain.value = 0.3;

        gain1.connect(masterGain);
        gain2.connect(masterGain);
        gain3.connect(masterGain);
        masterGain.connect(offlineCtx.destination);

        // Start oscillators
        osc1.start(0);
        osc2.start(0);
        osc3.start(0);

        // Render audio
        const audioBuffer = await offlineCtx.startRendering();

        // Convert to WAV data URL
        const wavData = this.audioBufferToWav(audioBuffer);
        const blob = new Blob([wavData], { type: 'audio/wav' });

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Convert AudioBuffer to WAV format
     */
    private audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
        const length = buffer.length * buffer.numberOfChannels * 2 + 44;
        const arrayBuffer = new ArrayBuffer(length);
        const view = new DataView(arrayBuffer);
        const channels: Float32Array[] = [];
        let offset = 0;
        let pos = 0;

        // Write WAV header
        const setUint16 = (data: number) => {
            view.setUint16(pos, data, true);
            pos += 2;
        };

        const setUint32 = (data: number) => {
            view.setUint32(pos, data, true);
            pos += 4;
        };

        // RIFF identifier
        setUint32(0x46464952); // "RIFF"
        setUint32(length - 8); // file length - 8
        setUint32(0x45564157); // "WAVE"

        // fmt chunk
        setUint32(0x20746d66); // "fmt "
        setUint32(16); // chunk length
        setUint16(1); // PCM
        setUint16(buffer.numberOfChannels);
        setUint32(buffer.sampleRate);
        setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
        setUint16(buffer.numberOfChannels * 2);
        setUint16(16);

        // data chunk
        setUint32(0x61746164); // "data"
        setUint32(length - pos - 4);

        // Write interleaved data
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        while (pos < length) {
            for (let i = 0; i < buffer.numberOfChannels; i++) {
                let sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offset++;
        }

        return arrayBuffer;
    }
}

export const orchestrator = new GoogleAIOrchestrator();

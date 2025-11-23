
/**
 * Audio Processing Utilities for Gemini Live API & TTS
 * Handles conversion between Web Audio API (Float32) and Live API (PCM Int16).
 */

export const audioUtils = {
    /**
     * Convert Float32Array (Web Audio) to Int16Array (PCM)
     */
    floatTo16BitPCM: (float32Array: Float32Array): ArrayBuffer => {
        const buffer = new ArrayBuffer(float32Array.length * 2);
        const view = new DataView(buffer);
        let offset = 0;
        for (let i = 0; i < float32Array.length; i++, offset += 2) {
            let s = Math.max(-1, Math.min(1, float32Array[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }
        return buffer;
    },

    /**
     * Convert Base64 string to Uint8Array
     */
    base64ToUint8Array: (base64: string): Uint8Array => {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    },

    /**
     * Convert array buffer to base64
     */
    arrayBufferToBase64: (buffer: ArrayBuffer): string => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },

    /**
     * Decode PCM Data to AudioBuffer for playback
     */
    convertPCMToAudioBuffer: async (
        base64Data: string, 
        audioContext: AudioContext,
        sampleRate: number = 24000
    ): Promise<AudioBuffer> => {
        const binary = atob(base64Data);
        const len = binary.length;
        const buffer = new ArrayBuffer(len);
        const view = new DataView(buffer);
        
        for (let i = 0; i < len; i++) {
            view.setUint8(i, binary.charCodeAt(i));
        }

        const int16Data = new Int16Array(buffer);
        const float32Data = new Float32Array(int16Data.length);

        for (let i = 0; i < int16Data.length; i++) {
            float32Data[i] = int16Data[i] / 32768.0;
        }

        const audioBuffer = audioContext.createBuffer(1, float32Data.length, sampleRate);
        audioBuffer.getChannelData(0).set(float32Data);
        return audioBuffer;
    },

    /**
     * Play standard Base64 Audio (MP3/WAV/Raw) via AudioContext
     * Used for TTS playback
     */
    playBase64: async (base64Data: string) => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            // Convert base64 to array buffer
            const binaryString = atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Try standard decode first (for WAV/MP3 containers typical of TTS)
            try {
                // Clone buffer because decodeAudioData detaches it
                const buffer = await audioContext.decodeAudioData(bytes.buffer.slice(0));
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start(0);
                return source;
            } catch (e) {
                console.warn("Standard decode failed, falling back to raw PCM decode for Live API compatibility.");
                // Fallback to Raw PCM if standard decode fails
                const buffer = await audioUtils.convertPCMToAudioBuffer(base64Data, audioContext, 24000);
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start(0);
                return source;
            }
        } catch (e) {
            console.error("Audio Playback Error:", e);
        }
    }
};

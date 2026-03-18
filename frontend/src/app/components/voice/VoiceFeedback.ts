export class VoiceFeedback {
  private static synth = window.speechSynthesis;
  private static voice: SpeechSynthesisVoice | null = null;
  private static loaded = false;

  static async init() {
    if (this.loaded) return;
    
    return new Promise<void>((resolve) => {
      const loadVoices = () => {
        const voices = this.synth.getVoices();
        if (voices.length > 0) {
          this.voice = voices.find(v => v.lang === 'es-HN' || v.lang.startsWith('es')) || null;
          this.loaded = true;
          resolve();
        }
      };

      loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = loadVoices;
      }
    });
  }

  static speak(text: string): Promise<void> {
    return new Promise(async (resolve) => {
      await this.init();
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) {
        utterance.voice = this.voice;
      }
      utterance.lang = 'es-HN';
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve(); // continue even if error
      if (this.synth.speaking) {
         this.synth.cancel();
      }
      this.synth.speak(utterance);
    });
  }

  static async confirmMethod(name: string) {
    await this.speak(`Entendido, usaremos ${name}`);
  }

  static async askParameter(label: string) {
    await this.speak(`Por favor ingresa ${label}`);
  }

  static async confirmValue(v: any) {
    await this.speak(`Recibido: ${v}`);
  }

  static async readResult(result: any) {
    let msg = '';
    if (result.method_used) {
      msg += `Usando ${result.method_used}. `;
    }
    if (result.result !== undefined && result.result !== null) {
      msg += `El resultado es ${result.result}`;
    } else if (result.value !== undefined && result.value !== null) {
      msg += `El valor es ${result.value}`;
    }
    if (result.iterations !== undefined) {
      msg += `, con ${result.iterations} iteraciones`;
    }
    if (result.error !== undefined) {
      msg += ` y un error de ${result.error}`;
    }
    if (result.converged !== undefined) {
      msg += result.converged ? '. El método convergió' : '. El método no convergió';
    }
    if (!msg) msg = 'Cálculo completado exitosamente';
    await this.speak(msg);
  }

  static async readError(msg: string) {
    await this.speak(`Ocurrió un error: ${msg}`);
  }
}

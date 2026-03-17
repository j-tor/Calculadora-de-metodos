import { MethodMeta } from './types'
import { ParameterInspector } from './ParameterInspector'

export class MethodDetector {
  static removeAccents(str: string) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  static async detectMethod(transcript: string): Promise<MethodMeta | MethodMeta[] | null> {
    const methods = await ParameterInspector.getAllMethodsMeta();
    const normalizedTranscript = this.removeAccents(transcript);
    
    let matches: MethodMeta[] = [];
    
    for (const method of methods) {
      for (const keyword of method.keywords) {
        if (normalizedTranscript.includes(this.removeAccents(keyword))) {
          if (!matches.some(m => m.id === method.id)) {
            matches.push(method);
          }
        }
      }
    }
    
    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];
    return matches;
  }
}

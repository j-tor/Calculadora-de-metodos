import { MethodMeta } from './types'

export class ParameterInspector {
  private static cache: MethodMeta[] | null = null;
  private static readonly API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  static async getAllMethodsMeta(): Promise<MethodMeta[]> {
    if (this.cache) return this.cache;
    try {
      const res = await fetch(`${this.API_URL}/api/methods/meta`);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      this.cache = data.methods;
      return this.cache || [];
    } catch (e) {
      console.error("Failed to fetch method metadata", e);
      return [];
    }
  }

  static async getMethodMeta(methodId: string): Promise<MethodMeta | null> {
    const methods = await this.getAllMethodsMeta();
    return methods.find(m => m.id === methodId) || null;
  }
}

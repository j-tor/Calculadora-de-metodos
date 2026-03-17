export interface ParameterMeta {
  name: string
  type: "function" | "scalar" | "vector" | "matrix"
  label: string
  required: boolean
  default?: number | string
}

export interface MethodMeta {
  id: string
  display_name: string
  category: string
  keywords: string[]
  parameters: ParameterMeta[]
}

export interface CalculationResult {
  value: number | string | number[] | number[][]
  iterations?: number
  error?: number
  [key: string]: any
}

export interface VoiceFlowState {
  status: "idle" | "listening" | "detected" | "collecting" | "executing" | "done" | "error"
  detectedMethod: MethodMeta | null
  collectedParams: Record<string, any>
  result: CalculationResult | null
}

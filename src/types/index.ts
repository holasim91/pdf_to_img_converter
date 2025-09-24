export interface ConversionOptions {
  format: 'png' | 'jpeg'
  quality?: number
  scale?: number
}

export interface ConversionProgress {
  currentPage: number
  totalPages: number
  fileName: string
  status: 'processing' | 'completed' | 'error'
  imageUrl?: string
  error?: string
}

export interface FileProgress {
  file: File
  progress: ConversionProgress
  images: string[]
}

export interface PdfConverterState {
  files: File[]
  isConverting: boolean
  fileProgresses: FileProgress[]
  options: ConversionOptions
}

export interface PdfConverterActions {
  handleFileUpload: (files: File[]) => void
  startConversion: () => Promise<void>
  downloadImages: (fileIndex: number) => Promise<void>
  downloadAllAsZip: () => Promise<void>
  updateOptions: (options: Partial<ConversionOptions>) => void
  removeFile: (fileIndex: number) => void
  reset: () => void
}
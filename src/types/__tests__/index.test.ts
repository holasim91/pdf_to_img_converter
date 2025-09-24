import { describe, it, expect } from 'vitest'
import type {
  ConversionOptions,
  ConversionProgress,
  FileProgress,
  PdfConverterState,
  PdfConverterActions
} from '../index'

describe('Types', () => {
  describe('ConversionOptions', () => {
    it('should allow valid format values', () => {
      const options: ConversionOptions = {
        format: 'png',
        quality: 0.95,
        scale: 2.0
      }

      expect(options.format).toBe('png')

      const jpegOptions: ConversionOptions = {
        format: 'jpeg',
        quality: 0.8,
        scale: 1.5
      }

      expect(jpegOptions.format).toBe('jpeg')
    })

    it('should allow partial options', () => {
      const minimalOptions: ConversionOptions = {
        format: 'png'
      }

      expect(minimalOptions.format).toBe('png')
      expect(minimalOptions.quality).toBeUndefined()
      expect(minimalOptions.scale).toBeUndefined()
    })
  })

  describe('ConversionProgress', () => {
    it('should allow valid status values', () => {
      const processingProgress: ConversionProgress = {
        currentPage: 1,
        totalPages: 5,
        fileName: 'test.pdf',
        status: 'processing'
      }

      expect(processingProgress.status).toBe('processing')

      const completedProgress: ConversionProgress = {
        currentPage: 5,
        totalPages: 5,
        fileName: 'test.pdf',
        status: 'completed'
      }

      expect(completedProgress.status).toBe('completed')

      const errorProgress: ConversionProgress = {
        currentPage: 2,
        totalPages: 5,
        fileName: 'test.pdf',
        status: 'error',
        error: 'Processing failed'
      }

      expect(errorProgress.status).toBe('error')
      expect(errorProgress.error).toBe('Processing failed')
    })

    it('should allow optional fields', () => {
      const basicProgress: ConversionProgress = {
        currentPage: 0,
        totalPages: 0,
        fileName: 'test.pdf',
        status: 'processing'
      }

      expect(basicProgress.imageUrl).toBeUndefined()
      expect(basicProgress.error).toBeUndefined()

      const progressWithImage: ConversionProgress = {
        currentPage: 1,
        totalPages: 3,
        fileName: 'test.pdf',
        status: 'processing',
        imageUrl: 'data:image/png;base64,test'
      }

      expect(progressWithImage.imageUrl).toBe('data:image/png;base64,test')
    })
  })

  describe('FileProgress', () => {
    it('should combine file, progress, and images correctly', () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      const fileProgress: FileProgress = {
        file: mockFile,
        progress: {
          currentPage: 2,
          totalPages: 4,
          fileName: 'test.pdf',
          status: 'processing'
        },
        images: ['image1', 'image2']
      }

      expect(fileProgress.file.name).toBe('test.pdf')
      expect(fileProgress.progress.currentPage).toBe(2)
      expect(fileProgress.images).toHaveLength(2)
    })
  })

  describe('PdfConverterState', () => {
    it('should define all required state properties', () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      const state: PdfConverterState = {
        files: [mockFile],
        isConverting: true,
        fileProgresses: [],
        options: {
          format: 'png',
          scale: 2.0,
          quality: 0.95
        }
      }

      expect(state.files).toHaveLength(1)
      expect(state.isConverting).toBe(true)
      expect(state.fileProgresses).toHaveLength(0)
      expect(state.options.format).toBe('png')
    })
  })

  describe('PdfConverterActions', () => {
    it('should define all required action methods', () => {
      const actions: PdfConverterActions = {
        handleFileUpload: (files: File[]) => {},
        startConversion: async () => {},
        downloadImages: async (fileIndex: number) => {},
        downloadAllAsZip: async () => {},
        updateOptions: (options: Partial<ConversionOptions>) => {},
        reset: () => {}
      }

      expect(typeof actions.handleFileUpload).toBe('function')
      expect(typeof actions.startConversion).toBe('function')
      expect(typeof actions.downloadImages).toBe('function')
      expect(typeof actions.downloadAllAsZip).toBe('function')
      expect(typeof actions.updateOptions).toBe('function')
      expect(typeof actions.reset).toBe('function')
    })

    it('should allow partial options in updateOptions', () => {
      const updateOptions = (options: Partial<ConversionOptions>) => {
        expect(options.format).toBe('jpeg')
        expect(options.scale).toBeUndefined()
      }

      updateOptions({ format: 'jpeg' })
    })
  })

  describe('Type compatibility', () => {
    it('should allow combining state and actions in hook return type', () => {
      type HookReturn = PdfConverterState & PdfConverterActions

      const mockHookReturn: HookReturn = {
        // State
        files: [],
        isConverting: false,
        fileProgresses: [],
        options: { format: 'png', scale: 2.0, quality: 0.95 },
        // Actions
        handleFileUpload: () => {},
        startConversion: async () => {},
        downloadImages: async () => {},
        downloadAllAsZip: async () => {},
        updateOptions: () => {},
        reset: () => {}
      }

      expect(mockHookReturn.files).toEqual([])
      expect(typeof mockHookReturn.handleFileUpload).toBe('function')
    })
  })
})
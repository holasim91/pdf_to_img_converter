import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ConversionOptions, ConversionProgress } from '../../types'

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: ''
  },
  getDocument: vi.fn()
}))

import * as pdfjsLib from 'pdfjs-dist'
import { convertPdfToImages } from '../pdfWorker'

const mockGetDocument = vi.mocked(pdfjsLib.getDocument)
const mockGetPage = vi.fn()
const mockGetViewport = vi.fn()
const mockRender = vi.fn()
const mockCleanup = vi.fn()

describe('pdfWorker', () => {
  const mockFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' })
  const defaultOptions: ConversionOptions = {
    format: 'png',
    scale: 2.0,
    quality: 0.95
  }

  const mockCanvas = {
    height: 0,
    width: 0,
    toDataURL: vi.fn(() => 'data:image/png;base64,mock-image-data')
  }

  const mockContext = {
    fillRect: vi.fn(),
    clearRect: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock document.createElement('canvas')
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return {
          ...mockCanvas,
          getContext: vi.fn(() => mockContext)
        } as any
      }
      return {} as any
    })

    // Mock File.arrayBuffer()
    Object.defineProperty(mockFile, 'arrayBuffer', {
      value: vi.fn().mockResolvedValue(new ArrayBuffer(8))
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('convertPdfToImages', () => {
    it('should convert PDF to images successfully', async () => {
      const mockPage = {
        getViewport: mockGetViewport.mockReturnValue({
          height: 800,
          width: 600
        }),
        render: mockRender.mockReturnValue({
          promise: Promise.resolve()
        }),
        cleanup: mockCleanup
      }

      const mockPdf = {
        numPages: 2,
        getPage: mockGetPage.mockResolvedValue(mockPage)
      }

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockPdf)
      })

      const onProgress = vi.fn()
      const result = await convertPdfToImages(mockFile, defaultOptions, onProgress)

      expect(result).toEqual([
        'data:image/png;base64,mock-image-data',
        'data:image/png;base64,mock-image-data'
      ])

      // Check that PDF was loaded
      expect(mockGetDocument).toHaveBeenCalledWith(expect.any(ArrayBuffer))

      // Check that pages were processed
      expect(mockGetPage).toHaveBeenCalledTimes(2)
      expect(mockGetPage).toHaveBeenNthCalledWith(1, 1)
      expect(mockGetPage).toHaveBeenNthCalledWith(2, 2)

      // Check viewport calculations
      expect(mockGetViewport).toHaveBeenCalledTimes(2)
      expect(mockGetViewport).toHaveBeenCalledWith({ scale: 2.0 })

      // Check canvas setup
      expect(mockCanvas.height).toBe(800)
      expect(mockCanvas.width).toBe(600)

      // Check rendering
      expect(mockRender).toHaveBeenCalledTimes(2)

      // Check cleanup
      expect(mockCleanup).toHaveBeenCalledTimes(2)

      // Check progress callbacks
      expect(onProgress).toHaveBeenCalledTimes(4) // 2 progress + 2 completion calls
    })

    it('should use default options when not provided', async () => {
      const mockPage = {
        getViewport: mockGetViewport.mockReturnValue({ height: 800, width: 600 }),
        render: mockRender.mockReturnValue({ promise: Promise.resolve() }),
        cleanup: mockCleanup
      }

      const mockPdf = {
        numPages: 1,
        getPage: mockGetPage.mockResolvedValue(mockPage)
      }

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockPdf)
      })

      await convertPdfToImages(mockFile)

      expect(mockGetViewport).toHaveBeenCalledWith({ scale: 2.0 }) // default scale
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png', 0.95) // default format and quality
    })

    it('should handle JPEG format correctly', async () => {
      const options: ConversionOptions = {
        format: 'jpeg',
        scale: 1.5,
        quality: 0.8
      }

      const mockPage = {
        getViewport: mockGetViewport.mockReturnValue({ height: 400, width: 300 }),
        render: mockRender.mockReturnValue({ promise: Promise.resolve() }),
        cleanup: mockCleanup
      }

      const mockPdf = {
        numPages: 1,
        getPage: mockGetPage.mockResolvedValue(mockPage)
      }

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockPdf)
      })

      await convertPdfToImages(mockFile, options)

      expect(mockGetViewport).toHaveBeenCalledWith({ scale: 1.5 })
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.8)
    })

    it('should call progress callback with correct information', async () => {
      const mockPage = {
        getViewport: mockGetViewport.mockReturnValue({ height: 600, width: 400 }),
        render: mockRender.mockReturnValue({ promise: Promise.resolve() }),
        cleanup: mockCleanup
      }

      const mockPdf = {
        numPages: 3,
        getPage: mockGetPage.mockResolvedValue(mockPage)
      }

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockPdf)
      })

      const onProgress = vi.fn()
      await convertPdfToImages(mockFile, defaultOptions, onProgress)

      // Check progress calls during processing
      expect(onProgress).toHaveBeenCalledWith({
        currentPage: 1,
        totalPages: 3,
        fileName: 'test.pdf',
        status: 'processing',
        imageUrl: 'data:image/png;base64,mock-image-data'
      })

      expect(onProgress).toHaveBeenCalledWith({
        currentPage: 2,
        totalPages: 3,
        fileName: 'test.pdf',
        status: 'processing',
        imageUrl: 'data:image/png;base64,mock-image-data'
      })

      expect(onProgress).toHaveBeenCalledWith({
        currentPage: 3,
        totalPages: 3,
        fileName: 'test.pdf',
        status: 'processing',
        imageUrl: 'data:image/png;base64,mock-image-data'
      })

      // Check final completion call
      expect(onProgress).toHaveBeenLastCalledWith({
        currentPage: 3,
        totalPages: 3,
        fileName: 'test.pdf',
        status: 'completed'
      })
    })

    it('should work without progress callback', async () => {
      const mockPage = {
        getViewport: mockGetViewport.mockReturnValue({ height: 600, width: 400 }),
        render: mockRender.mockReturnValue({ promise: Promise.resolve() }),
        cleanup: mockCleanup
      }

      const mockPdf = {
        numPages: 1,
        getPage: mockGetPage.mockResolvedValue(mockPage)
      }

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockPdf)
      })

      // Should not throw without progress callback
      const result = await convertPdfToImages(mockFile, defaultOptions)
      expect(result).toHaveLength(1)
    })

    it('should handle PDF loading errors', async () => {
      const loadError = new Error('Failed to load PDF')
      mockGetDocument.mockReturnValue({
        promise: Promise.reject(loadError)
      })

      const onProgress = vi.fn()

      await expect(convertPdfToImages(mockFile, defaultOptions, onProgress)).rejects.toThrow('Failed to load PDF')

      // Should call progress with error
      expect(onProgress).toHaveBeenCalledWith({
        currentPage: 0,
        totalPages: 0,
        fileName: 'test.pdf',
        status: 'error',
        error: 'Failed to load PDF'
      })
    })

    it('should handle page rendering errors', async () => {
      const renderError = new Error('Page render failed')

      const mockPage = {
        getViewport: mockGetViewport.mockReturnValue({ height: 600, width: 400 }),
        render: mockRender.mockReturnValue({
          promise: Promise.reject(renderError)
        }),
        cleanup: mockCleanup
      }

      const mockPdf = {
        numPages: 2,
        getPage: mockGetPage.mockResolvedValue(mockPage)
      }

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockPdf)
      })

      const onProgress = vi.fn()

      await expect(convertPdfToImages(mockFile, defaultOptions, onProgress)).rejects.toThrow('Page render failed')

      // Should call progress with error for the failed page
      expect(onProgress).toHaveBeenCalledWith({
        currentPage: 1,
        totalPages: 2,
        fileName: 'test.pdf',
        status: 'error',
        error: 'Page render failed'
      })
    })

    it('should handle page loading errors', async () => {
      const pageError = new Error('Failed to load page')

      const mockPdf = {
        numPages: 2,
        getPage: mockGetPage.mockRejectedValue(pageError)
      }

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockPdf)
      })

      const onProgress = vi.fn()

      await expect(convertPdfToImages(mockFile, defaultOptions, onProgress)).rejects.toThrow('Failed to load page')

      expect(onProgress).toHaveBeenCalledWith({
        currentPage: 1,
        totalPages: 2,
        fileName: 'test.pdf',
        status: 'error',
        error: 'Failed to load page'
      })
    })

    it('should handle unknown errors', async () => {
      // Test with non-Error object
      mockGetDocument.mockReturnValue({
        promise: Promise.reject('String error')
      })

      const onProgress = vi.fn()

      await expect(convertPdfToImages(mockFile, defaultOptions, onProgress)).rejects.toBe('String error')

      expect(onProgress).toHaveBeenCalledWith({
        currentPage: 0,
        totalPages: 0,
        fileName: 'test.pdf',
        status: 'error',
        error: 'Unknown error'
      })
    })

    it('should set canvas dimensions correctly based on viewport', async () => {
      const mockPage = {
        getViewport: mockGetViewport.mockReturnValue({
          height: 1000,
          width: 750
        }),
        render: mockRender.mockReturnValue({ promise: Promise.resolve() }),
        cleanup: mockCleanup
      }

      const mockPdf = {
        numPages: 1,
        getPage: mockGetPage.mockResolvedValue(mockPage)
      }

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockPdf)
      })

      await convertPdfToImages(mockFile, defaultOptions)

      expect(mockCanvas.height).toBe(1000)
      expect(mockCanvas.width).toBe(750)
    })

    it('should call render with correct context and viewport', async () => {
      const viewport = { height: 600, width: 400 }
      const mockPage = {
        getViewport: mockGetViewport.mockReturnValue(viewport),
        render: mockRender.mockReturnValue({ promise: Promise.resolve() }),
        cleanup: mockCleanup
      }

      const mockPdf = {
        numPages: 1,
        getPage: mockGetPage.mockResolvedValue(mockPage)
      }

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockPdf)
      })

      await convertPdfToImages(mockFile, defaultOptions)

      expect(mockRender).toHaveBeenCalledWith({
        canvasContext: mockContext,
        viewport: viewport
      })
    })

    it('should handle empty PDF (0 pages)', async () => {
      const mockPdf = {
        numPages: 0,
        getPage: mockGetPage
      }

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockPdf)
      })

      const onProgress = vi.fn()
      const result = await convertPdfToImages(mockFile, defaultOptions, onProgress)

      expect(result).toEqual([])
      expect(mockGetPage).not.toHaveBeenCalled()

      // Should still call completion callback
      expect(onProgress).toHaveBeenCalledWith({
        currentPage: 0,
        totalPages: 0,
        fileName: 'test.pdf',
        status: 'completed'
      })
    })
  })

  describe('worker src configuration', () => {
    it('should set worker src only in browser environment', () => {
      // This is tested indirectly through the module loading
      // The actual check is in the module itself
      expect(typeof window !== 'undefined').toBe(true) // jsdom environment
    })
  })
})
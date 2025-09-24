import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePdfConverter } from '../usePdfConverter'
import * as pdfWorker from '../../utils/pdfWorker'
import * as downloadUtils from '../../utils/downloadUtils'

// Mock dependencies
vi.mock('../../utils/pdfWorker')
vi.mock('../../utils/downloadUtils')

const mockConvertPdfToImages = vi.mocked(pdfWorker.convertPdfToImages)
const mockDownloadFileImages = vi.mocked(downloadUtils.downloadFileImages)
const mockDownloadAllFilesAsZip = vi.mocked(downloadUtils.downloadAllFilesAsZip)

describe('usePdfConverter', () => {
  const mockFile1 = new File(['pdf content'], 'test1.pdf', { type: 'application/pdf' })
  const mockFile2 = new File(['pdf content'], 'test2.pdf', { type: 'application/pdf' })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => usePdfConverter())

      expect(result.current.files).toEqual([])
      expect(result.current.isConverting).toBe(false)
      expect(result.current.fileProgresses).toEqual([])
      expect(result.current.options).toEqual({
        format: 'png',
        scale: 2.0,
        quality: 0.95
      })
    })
  })

  describe('handleFileUpload', () => {
    it('should update files and reset progresses', () => {
      const { result } = renderHook(() => usePdfConverter())

      act(() => {
        result.current.handleFileUpload([mockFile1, mockFile2])
      })

      expect(result.current.files).toEqual([mockFile1, mockFile2])
      expect(result.current.fileProgresses).toEqual([])
    })

    it('should handle empty file array', () => {
      const { result } = renderHook(() => usePdfConverter())

      // First add some files
      act(() => {
        result.current.handleFileUpload([mockFile1])
      })

      expect(result.current.files).toEqual([mockFile1])

      // Then clear them
      act(() => {
        result.current.handleFileUpload([])
      })

      expect(result.current.files).toEqual([])
      expect(result.current.fileProgresses).toEqual([])
    })
  })

  describe('updateOptions', () => {
    it('should update options partially', () => {
      const { result } = renderHook(() => usePdfConverter())

      act(() => {
        result.current.updateOptions({ format: 'jpeg' })
      })

      expect(result.current.options).toEqual({
        format: 'jpeg',
        scale: 2.0,
        quality: 0.95
      })
    })

    it('should update multiple options at once', () => {
      const { result } = renderHook(() => usePdfConverter())

      act(() => {
        result.current.updateOptions({ format: 'jpeg', scale: 3.0 })
      })

      expect(result.current.options).toEqual({
        format: 'jpeg',
        scale: 3.0,
        quality: 0.95
      })
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => usePdfConverter())

      // Set some state
      act(() => {
        result.current.handleFileUpload([mockFile1])
        result.current.updateOptions({ format: 'jpeg', scale: 3.0 })
      })

      expect(result.current.files.length).toBe(1)
      expect(result.current.options.format).toBe('jpeg')

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.files).toEqual([])
      expect(result.current.fileProgresses).toEqual([])
      expect(result.current.isConverting).toBe(false)
      expect(result.current.options).toEqual({
        format: 'png',
        scale: 2.0,
        quality: 0.95
      })
    })
  })

  describe('startConversion', () => {
    it('should return early if no files', async () => {
      const { result } = renderHook(() => usePdfConverter())

      await act(async () => {
        await result.current.startConversion()
      })

      expect(result.current.isConverting).toBe(false)
      expect(mockConvertPdfToImages).not.toHaveBeenCalled()
    })

    it('should set isConverting state correctly', async () => {
      const { result } = renderHook(() => usePdfConverter())

      act(() => {
        result.current.handleFileUpload([mockFile1])
      })

      mockConvertPdfToImages.mockResolvedValue(['image1'])

      const conversionPromise = act(async () => {
        await result.current.startConversion()
      })

      // Should be converting during the process
      expect(result.current.isConverting).toBe(true)

      await conversionPromise

      // Should not be converting after completion
      expect(result.current.isConverting).toBe(false)
    })

    it('should initialize file progresses', async () => {
      const { result } = renderHook(() => usePdfConverter())

      act(() => {
        result.current.handleFileUpload([mockFile1, mockFile2])
      })

      mockConvertPdfToImages.mockResolvedValue(['image1'])

      await act(async () => {
        await result.current.startConversion()
      })

      expect(result.current.fileProgresses).toHaveLength(2)
      expect(result.current.fileProgresses[0]).toEqual({
        file: mockFile1,
        progress: {
          currentPage: 0,
          totalPages: 0,
          fileName: 'test1.pdf',
          status: 'processing'
        },
        images: ['image1']
      })
    })

    it('should call convertPdfToImages for each file', async () => {
      const { result } = renderHook(() => usePdfConverter())

      act(() => {
        result.current.handleFileUpload([mockFile1, mockFile2])
      })

      mockConvertPdfToImages.mockResolvedValue(['image1'])

      await act(async () => {
        await result.current.startConversion()
      })

      expect(mockConvertPdfToImages).toHaveBeenCalledTimes(2)
      expect(mockConvertPdfToImages).toHaveBeenNthCalledWith(
        1,
        mockFile1,
        result.current.options,
        expect.any(Function)
      )
      expect(mockConvertPdfToImages).toHaveBeenNthCalledWith(
        2,
        mockFile2,
        result.current.options,
        expect.any(Function)
      )
    })

    it('should update progress callback correctly', async () => {
      const { result } = renderHook(() => usePdfConverter())

      act(() => {
        result.current.handleFileUpload([mockFile1])
      })

      const mockProgress = {
        currentPage: 1,
        totalPages: 2,
        fileName: 'test1.pdf',
        status: 'processing' as const
      }

      mockConvertPdfToImages.mockImplementation(async (file, options, onProgress) => {
        onProgress?.(mockProgress)
        return ['image1']
      })

      await act(async () => {
        await result.current.startConversion()
      })

      expect(result.current.fileProgresses[0].progress).toEqual(mockProgress)
    })

    it('should handle conversion errors gracefully', async () => {
      const { result } = renderHook(() => usePdfConverter())

      act(() => {
        result.current.handleFileUpload([mockFile1])
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockConvertPdfToImages.mockRejectedValue(new Error('Conversion failed'))

      await act(async () => {
        await result.current.startConversion()
      })

      expect(result.current.isConverting).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Conversion error:', expect.any(Error))

      consoleErrorSpy.mockRestore()
    })

    it('should handle mixed success/failure results', async () => {
      const { result } = renderHook(() => usePdfConverter())

      act(() => {
        result.current.handleFileUpload([mockFile1, mockFile2])
      })

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockConvertPdfToImages
        .mockResolvedValueOnce(['image1'])
        .mockRejectedValueOnce(new Error('Failed'))

      await act(async () => {
        await result.current.startConversion()
      })

      expect(result.current.isConverting).toBe(false)
      expect(consoleLogSpy).toHaveBeenCalledWith('Conversion completed:', expect.any(Array))
      expect(consoleErrorSpy).toHaveBeenCalledWith('Conversion error:', expect.any(Error))

      consoleLogSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('downloadImages', () => {
    it('should call downloadFileImages with correct parameters', async () => {
      const { result } = renderHook(() => usePdfConverter())

      // Set up file progresses
      act(() => {
        result.current.handleFileUpload([mockFile1])
      })

      mockConvertPdfToImages.mockResolvedValue(['image1'])

      await act(async () => {
        await result.current.startConversion()
      })

      // Download images
      await act(async () => {
        await result.current.downloadImages(0)
      })

      expect(mockDownloadFileImages).toHaveBeenCalledWith(
        result.current.fileProgresses[0],
        result.current.options
      )
    })

    it('should handle invalid file index gracefully', async () => {
      const { result } = renderHook(() => usePdfConverter())

      await act(async () => {
        await result.current.downloadImages(999)
      })

      expect(mockDownloadFileImages).toHaveBeenCalledWith(undefined, result.current.options)
    })
  })

  describe('downloadAllAsZip', () => {
    it('should call downloadAllFilesAsZip with correct parameters', async () => {
      const { result } = renderHook(() => usePdfConverter())

      act(() => {
        result.current.handleFileUpload([mockFile1, mockFile2])
      })

      mockConvertPdfToImages.mockResolvedValue(['image1'])

      await act(async () => {
        await result.current.startConversion()
      })

      await act(async () => {
        await result.current.downloadAllAsZip()
      })

      expect(mockDownloadAllFilesAsZip).toHaveBeenCalledWith(
        result.current.fileProgresses,
        result.current.options
      )
    })

    it('should work with empty file progresses', async () => {
      const { result } = renderHook(() => usePdfConverter())

      await act(async () => {
        await result.current.downloadAllAsZip()
      })

      expect(mockDownloadAllFilesAsZip).toHaveBeenCalledWith([], result.current.options)
    })
  })

  describe('hook dependencies and memoization', () => {
    it('should maintain stable references for actions', () => {
      const { result, rerender } = renderHook(() => usePdfConverter())

      const initialActions = {
        handleFileUpload: result.current.handleFileUpload,
        startConversion: result.current.startConversion,
        downloadImages: result.current.downloadImages,
        downloadAllAsZip: result.current.downloadAllAsZip,
        updateOptions: result.current.updateOptions,
        reset: result.current.reset
      }

      rerender()

      expect(result.current.handleFileUpload).toBe(initialActions.handleFileUpload)
      expect(result.current.startConversion).toBe(initialActions.startConversion)
      expect(result.current.downloadImages).toBe(initialActions.downloadImages)
      expect(result.current.downloadAllAsZip).toBe(initialActions.downloadAllAsZip)
      expect(result.current.updateOptions).toBe(initialActions.updateOptions)
      expect(result.current.reset).toBe(initialActions.reset)
    })

    it('should update dependent callbacks when dependencies change', () => {
      const { result } = renderHook(() => usePdfConverter())

      const initialStartConversion = result.current.startConversion
      const initialDownloadImages = result.current.downloadImages
      const initialDownloadAllAsZip = result.current.downloadAllAsZip

      // Change files (should update startConversion)
      act(() => {
        result.current.handleFileUpload([mockFile1])
      })

      expect(result.current.startConversion).not.toBe(initialStartConversion)

      // Change options (should update downloadImages and downloadAllAsZip)
      act(() => {
        result.current.updateOptions({ format: 'jpeg' })
      })

      expect(result.current.downloadImages).not.toBe(initialDownloadImages)
      expect(result.current.downloadAllAsZip).not.toBe(initialDownloadAllAsZip)
    })
  })
})
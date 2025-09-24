import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import JSZip from 'jszip'
import {
  downloadSingleImage,
  downloadImagesAsZip,
  downloadFileImages,
  downloadAllFilesAsZip
} from '../downloadUtils'
import type { FileProgress, ConversionOptions } from '../../types'

// Mock JSZip
vi.mock('jszip')

describe('downloadUtils', () => {
  const mockCreateElement = vi.spyOn(document, 'createElement')
  const mockClick = vi.fn()
  const mockCreateObjectURL = vi.spyOn(URL, 'createObjectURL')

  beforeEach(() => {
    vi.clearAllMocks()

    mockCreateElement.mockReturnValue({
      href: '',
      download: '',
      click: mockClick
    } as any)

    mockCreateObjectURL.mockReturnValue('mock-blob-url')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('downloadSingleImage', () => {
    it('should create download link with correct DPI in filename', () => {
      const imageUrl = 'data:image/png;base64,test'
      const fileName = 'test-file'
      const format = 'png'
      const scale = 2.0

      downloadSingleImage(imageUrl, fileName, format, scale)

      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockClick).toHaveBeenCalled()

      const mockElement = mockCreateElement.mock.results[0].value
      expect(mockElement.href).toBe(imageUrl)
      expect(mockElement.download).toBe('test-file_300dpi_page_1.png')
    })

    it('should handle different scales correctly', () => {
      downloadSingleImage('test-url', 'file', 'jpeg', 3.0)

      const mockElement = mockCreateElement.mock.results[0].value
      expect(mockElement.download).toBe('file_450dpi_page_1.jpeg')
    })

    it('should handle scale 1.0 correctly', () => {
      downloadSingleImage('test-url', 'file', 'png', 1.0)

      const mockElement = mockCreateElement.mock.results[0].value
      expect(mockElement.download).toBe('file_150dpi_page_1.png')
    })
  })

  describe('downloadImagesAsZip', () => {
    const mockZipFile = vi.fn()
    const mockGenerateAsync = vi.fn().mockResolvedValue(new Blob())

    beforeEach(() => {
      const MockedJSZip = vi.mocked(JSZip)
      MockedJSZip.mockImplementation(() => ({
        file: mockZipFile,
        generateAsync: mockGenerateAsync
      } as any))
    })

    it('should create ZIP with correct filenames and DPI', async () => {
      const images = [
        'data:image/png;base64,image1data',
        'data:image/png;base64,image2data'
      ]
      const fileName = 'test-document'
      const format = 'png'
      const scale = 2.0

      await downloadImagesAsZip(images, fileName, format, scale)

      expect(mockZipFile).toHaveBeenCalledTimes(2)
      expect(mockZipFile).toHaveBeenNthCalledWith(1,
        'test-document_300dpi_page_1.png',
        'image1data',
        { base64: true }
      )
      expect(mockZipFile).toHaveBeenNthCalledWith(2,
        'test-document_300dpi_page_2.png',
        'image2data',
        { base64: true }
      )

      expect(mockGenerateAsync).toHaveBeenCalledWith({ type: 'blob' })
      expect(mockClick).toHaveBeenCalled()

      const mockElement = mockCreateElement.mock.results[0].value
      expect(mockElement.download).toBe('test-document_300dpi_images.zip')
    })

    it('should handle different DPI scales', async () => {
      const images = ['data:image/jpeg;base64,test']

      await downloadImagesAsZip(images, 'file', 'jpeg', 3.0)

      expect(mockZipFile).toHaveBeenCalledWith(
        'file_450dpi_page_1.jpeg',
        'test',
        { base64: true }
      )

      const mockElement = mockCreateElement.mock.results[0].value
      expect(mockElement.download).toBe('file_450dpi_images.zip')
    })

    it('should handle empty images array', async () => {
      await downloadImagesAsZip([], 'file', 'png', 2.0)

      expect(mockZipFile).not.toHaveBeenCalled()
      expect(mockGenerateAsync).toHaveBeenCalled()
    })
  })

  describe('downloadFileImages', () => {
    const mockOptions: ConversionOptions = {
      format: 'png',
      scale: 2.0,
      quality: 0.95
    }

    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })

    it('should return early if fileProgress is null', async () => {
      await downloadFileImages(null as any, mockOptions)
      expect(mockCreateElement).not.toHaveBeenCalled()
    })

    it('should return early if no images', async () => {
      const fileProgress: FileProgress = {
        file: mockFile,
        progress: { currentPage: 0, totalPages: 0, fileName: 'test.pdf', status: 'processing' },
        images: []
      }

      await downloadFileImages(fileProgress, mockOptions)
      expect(mockCreateElement).not.toHaveBeenCalled()
    })

    it('should download single image directly', async () => {
      const fileProgress: FileProgress = {
        file: mockFile,
        progress: { currentPage: 1, totalPages: 1, fileName: 'test.pdf', status: 'completed' },
        images: ['data:image/png;base64,test']
      }

      await downloadFileImages(fileProgress, mockOptions)

      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockClick).toHaveBeenCalled()

      const mockElement = mockCreateElement.mock.results[0].value
      expect(mockElement.download).toBe('test_300dpi_page_1.png')
    })

    it('should create ZIP for multiple images', async () => {
      const mockZipFile = vi.fn()
      const mockGenerateAsync = vi.fn().mockResolvedValue(new Blob())

      const MockedJSZip = vi.mocked(JSZip)
      MockedJSZip.mockImplementation(() => ({
        file: mockZipFile,
        generateAsync: mockGenerateAsync
      } as any))

      const fileProgress: FileProgress = {
        file: mockFile,
        progress: { currentPage: 2, totalPages: 2, fileName: 'test.pdf', status: 'completed' },
        images: ['data:image/png;base64,img1', 'data:image/png;base64,img2']
      }

      await downloadFileImages(fileProgress, mockOptions)

      expect(mockZipFile).toHaveBeenCalledTimes(2)
      expect(mockGenerateAsync).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
    })

    it('should use default scale if not provided', async () => {
      const optionsWithoutScale: ConversionOptions = {
        format: 'jpeg',
        quality: 0.8
      }

      const fileProgress: FileProgress = {
        file: mockFile,
        progress: { currentPage: 1, totalPages: 1, fileName: 'test.pdf', status: 'completed' },
        images: ['data:image/jpeg;base64,test']
      }

      await downloadFileImages(fileProgress, optionsWithoutScale)

      const mockElement = mockCreateElement.mock.results[0].value
      expect(mockElement.download).toBe('test_300dpi_page_1.jpeg') // 2.0 is default
    })
  })

  describe('downloadAllFilesAsZip', () => {
    const mockZipFile = vi.fn()
    const mockGenerateAsync = vi.fn().mockResolvedValue(new Blob())

    beforeEach(() => {
      const MockedJSZip = vi.mocked(JSZip)
      MockedJSZip.mockImplementation(() => ({
        file: mockZipFile,
        generateAsync: mockGenerateAsync
      } as any))
    })

    it('should return early if no files have images', async () => {
      const fileProgresses: FileProgress[] = [
        {
          file: new File(['test'], 'test1.pdf'),
          progress: { currentPage: 0, totalPages: 0, fileName: 'test1.pdf', status: 'processing' },
          images: []
        }
      ]

      const options: ConversionOptions = { format: 'png', scale: 2.0 }

      await downloadAllFilesAsZip(fileProgresses, options)

      expect(mockZipFile).not.toHaveBeenCalled()
      expect(mockGenerateAsync).not.toHaveBeenCalled()
    })

    it('should create ZIP with all images from multiple files', async () => {
      const fileProgresses: FileProgress[] = [
        {
          file: new File(['test'], 'doc1.pdf'),
          progress: { currentPage: 2, totalPages: 2, fileName: 'doc1.pdf', status: 'completed' },
          images: ['data:image/png;base64,doc1img1', 'data:image/png;base64,doc1img2']
        },
        {
          file: new File(['test'], 'doc2.pdf'),
          progress: { currentPage: 1, totalPages: 1, fileName: 'doc2.pdf', status: 'completed' },
          images: ['data:image/png;base64,doc2img1']
        }
      ]

      const options: ConversionOptions = { format: 'png', scale: 3.0 }

      await downloadAllFilesAsZip(fileProgresses, options)

      expect(mockZipFile).toHaveBeenCalledTimes(3)

      // Check individual file calls
      expect(mockZipFile).toHaveBeenNthCalledWith(1,
        'doc1_450dpi_page_1.png',
        'doc1img1',
        { base64: true }
      )
      expect(mockZipFile).toHaveBeenNthCalledWith(2,
        'doc1_450dpi_page_2.png',
        'doc1img2',
        { base64: true }
      )
      expect(mockZipFile).toHaveBeenNthCalledWith(3,
        'doc2_450dpi_page_1.png',
        'doc2img1',
        { base64: true }
      )

      expect(mockGenerateAsync).toHaveBeenCalledWith({ type: 'blob' })
      expect(mockClick).toHaveBeenCalled()

      const mockElement = mockCreateElement.mock.results[0].value
      expect(mockElement.download).toBe('all_converted_450dpi_images.zip')
    })

    it('should use default scale if not provided', async () => {
      const fileProgresses: FileProgress[] = [
        {
          file: new File(['test'], 'test.pdf'),
          progress: { currentPage: 1, totalPages: 1, fileName: 'test.pdf', status: 'completed' },
          images: ['data:image/jpeg;base64,test']
        }
      ]

      const options: ConversionOptions = { format: 'jpeg' }

      await downloadAllFilesAsZip(fileProgresses, options)

      expect(mockZipFile).toHaveBeenCalledWith(
        'test_300dpi_page_1.jpeg',
        'test',
        { base64: true }
      )

      const mockElement = mockCreateElement.mock.results[0].value
      expect(mockElement.download).toBe('all_converted_300dpi_images.zip')
    })

    it('should filter out files without images', async () => {
      const fileProgresses: FileProgress[] = [
        {
          file: new File(['test'], 'empty.pdf'),
          progress: { currentPage: 0, totalPages: 0, fileName: 'empty.pdf', status: 'processing' },
          images: []
        },
        {
          file: new File(['test'], 'with-images.pdf'),
          progress: { currentPage: 1, totalPages: 1, fileName: 'with-images.pdf', status: 'completed' },
          images: ['data:image/png;base64,test']
        }
      ]

      const options: ConversionOptions = { format: 'png', scale: 1.0 }

      await downloadAllFilesAsZip(fileProgresses, options)

      expect(mockZipFile).toHaveBeenCalledTimes(1)
      expect(mockZipFile).toHaveBeenCalledWith(
        'with-images_150dpi_page_1.png',
        'test',
        { base64: true }
      )
    })
  })
})
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// Mock the usePdfConverter hook
vi.mock('../hooks/usePdfConverter', () => ({
  usePdfConverter: vi.fn()
}))

import { usePdfConverter } from '../hooks/usePdfConverter'
const mockUsePdfConverter = vi.mocked(usePdfConverter)

describe('App', () => {
  const defaultHookReturn = {
    files: [],
    isConverting: false,
    fileProgresses: [],
    options: {
      format: 'png' as const,
      scale: 2.0,
      quality: 0.95
    },
    handleFileUpload: vi.fn(),
    startConversion: vi.fn(),
    downloadImages: vi.fn(),
    downloadAllAsZip: vi.fn(),
    updateOptions: vi.fn(),
    reset: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePdfConverter.mockReturnValue(defaultHookReturn)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initial render', () => {
    it('should render the main header and description', () => {
      render(<App />)

      expect(screen.getByRole('heading', { name: /pdf to image converter/i })).toBeInTheDocument()
      expect(screen.getByText(/convert pdf files to high-quality images/i)).toBeInTheDocument()
    })

    it('should render file upload section', () => {
      render(<App />)

      expect(screen.getByLabelText(/click to select pdf files/i)).toBeInTheDocument()
      expect(screen.getByText(/click to select pdf files or drag & drop here/i)).toBeInTheDocument()
    })

    it('should not render options or file list when no files selected', () => {
      render(<App />)

      expect(screen.queryByText(/conversion options/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/selected files/i)).not.toBeInTheDocument()
    })
  })

  describe('file upload', () => {
    it('should call handleFileUpload when files are selected', async () => {
      const user = userEvent.setup()
      const mockFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' })

      render(<App />)

      const fileInput = screen.getByLabelText(/click to select pdf files/i)

      await user.upload(fileInput, mockFile)

      expect(defaultHookReturn.handleFileUpload).toHaveBeenCalledWith([mockFile])
    })

    it('should handle multiple files', async () => {
      const user = userEvent.setup()
      const mockFiles = [
        new File(['pdf1'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['pdf2'], 'test2.pdf', { type: 'application/pdf' })
      ]

      render(<App />)

      const fileInput = screen.getByLabelText(/click to select pdf files/i)

      await user.upload(fileInput, mockFiles)

      expect(defaultHookReturn.handleFileUpload).toHaveBeenCalledWith(mockFiles)
    })

    it('should update upload label when files are selected', () => {
      const mockFiles = [
        new File(['pdf1'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['pdf2'], 'test2.pdf', { type: 'application/pdf' })
      ]

      mockUsePdfConverter.mockReturnValue({
        ...defaultHookReturn,
        files: mockFiles
      })

      render(<App />)

      expect(screen.getByText('2 file(s) selected')).toBeInTheDocument()
    })
  })

  describe('options section', () => {
    const mockFilesSelected = [
      new File(['pdf'], 'test.pdf', { type: 'application/pdf' })
    ]

    beforeEach(() => {
      mockUsePdfConverter.mockReturnValue({
        ...defaultHookReturn,
        files: mockFilesSelected
      })
    })

    it('should render options section when files are selected', () => {
      render(<App />)

      expect(screen.getByText(/conversion options/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/format/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/quality \(dpi\)/i)).toBeInTheDocument()
    })

    it('should show current format selection', () => {
      render(<App />)

      const formatSelect = screen.getByLabelText(/format/i)
      expect(formatSelect).toHaveValue('png')
    })

    it('should show current quality selection', () => {
      render(<App />)

      const qualitySelect = screen.getByLabelText(/quality \(dpi\)/i)
      expect(qualitySelect).toHaveValue('2.0')
    })

    it('should call updateOptions when format changes', async () => {
      const user = userEvent.setup()
      render(<App />)

      const formatSelect = screen.getByLabelText(/format/i)
      await user.selectOptions(formatSelect, 'jpeg')

      expect(defaultHookReturn.updateOptions).toHaveBeenCalledWith({ format: 'jpeg' })
    })

    it('should call updateOptions when quality changes', async () => {
      const user = userEvent.setup()
      render(<App />)

      const qualitySelect = screen.getByLabelText(/quality \(dpi\)/i)
      await user.selectOptions(qualitySelect, '3.0')

      expect(defaultHookReturn.updateOptions).toHaveBeenCalledWith({ scale: 3.0 })
    })

    it('should display correct DPI options', () => {
      render(<App />)

      expect(screen.getByRole('option', { name: /150 dpi \(normal\)/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /300 dpi \(high\)/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /450 dpi \(very high\)/i })).toBeInTheDocument()
    })
  })

  describe('file list section', () => {
    const mockFiles = [
      new File(['pdf1'], 'document1.pdf', { type: 'application/pdf' }),
      new File(['pdf2'], 'document2.pdf', { type: 'application/pdf' })
    ]

    beforeEach(() => {
      // Mock file size calculation
      Object.defineProperty(mockFiles[0], 'size', { value: 1024 * 1024 * 2.5 }) // 2.5MB
      Object.defineProperty(mockFiles[1], 'size', { value: 1024 * 1024 * 1.2 }) // 1.2MB
    })

    it('should render file list when files are selected', () => {
      mockUsePdfConverter.mockReturnValue({
        ...defaultHookReturn,
        files: mockFiles
      })

      render(<App />)

      expect(screen.getByText(/selected files/i)).toBeInTheDocument()
      expect(screen.getByText('document1.pdf')).toBeInTheDocument()
      expect(screen.getByText('document2.pdf')).toBeInTheDocument()
    })

    it('should display file sizes correctly', () => {
      mockUsePdfConverter.mockReturnValue({
        ...defaultHookReturn,
        files: mockFiles
      })

      render(<App />)

      expect(screen.getByText('(2.5 MB)')).toBeInTheDocument()
      expect(screen.getByText('(1.2 MB)')).toBeInTheDocument()
    })

    it('should render convert button', () => {
      mockUsePdfConverter.mockReturnValue({
        ...defaultHookReturn,
        files: mockFiles
      })

      render(<App />)

      const convertButton = screen.getByRole('button', { name: /start conversion/i })
      expect(convertButton).toBeInTheDocument()
      expect(convertButton).not.toBeDisabled()
    })

    it('should disable convert button when converting', () => {
      mockUsePdfConverter.mockReturnValue({
        ...defaultHookReturn,
        files: mockFiles,
        isConverting: true
      })

      render(<App />)

      const convertButton = screen.getByRole('button', { name: /converting/i })
      expect(convertButton).toBeDisabled()
    })

    it('should call startConversion when convert button is clicked', async () => {
      const user = userEvent.setup()

      mockUsePdfConverter.mockReturnValue({
        ...defaultHookReturn,
        files: mockFiles
      })

      render(<App />)

      const convertButton = screen.getByRole('button', { name: /start conversion/i })
      await user.click(convertButton)

      expect(defaultHookReturn.startConversion).toHaveBeenCalled()
    })
  })

  describe('file progress display', () => {
    const mockFiles = [new File(['pdf'], 'test.pdf', { type: 'application/pdf' })]
    const mockFileProgresses = [
      {
        file: mockFiles[0],
        progress: {
          currentPage: 2,
          totalPages: 5,
          fileName: 'test.pdf',
          status: 'processing' as const
        },
        images: []
      }
    ]

    beforeEach(() => {
      mockUsePdfConverter.mockReturnValue({
        ...defaultHookReturn,
        files: mockFiles,
        fileProgresses: mockFileProgresses
      })
    })

    it('should display progress information', () => {
      render(<App />)

      expect(screen.getByText(/status: processing/i)).toBeInTheDocument()
      expect(screen.getByText(/page: 2\/5/i)).toBeInTheDocument()
    })

    it('should display progress bar', () => {
      render(<App />)

      const progressBar = screen.getByRole('progressbar', { hidden: true })
      expect(progressBar).toHaveStyle({ width: '40%' }) // 2/5 = 40%
    })

    it('should not display progress bar when totalPages is 0', () => {
      mockUsePdfConverter.mockReturnValue({
        ...defaultHookReturn,
        files: mockFiles,
        fileProgresses: [{
          ...mockFileProgresses[0],
          progress: {
            ...mockFileProgresses[0].progress,
            totalPages: 0
          }
        }]
      })

      render(<App />)

      expect(screen.queryByRole('progressbar', { hidden: true })).not.toBeInTheDocument()
    })

    it('should display download button when images are available', () => {
      mockUsePdfConverter.mockReturnValue({
        ...defaultHookReturn,
        files: mockFiles,
        fileProgresses: [{
          ...mockFileProgresses[0],
          images: ['image1', 'image2']
        }]
      })

      render(<App />)

      expect(screen.getByRole('button', { name: /download \(2 images\)/i })).toBeInTheDocument()
    })

    it('should call downloadImages when download button is clicked', async () => {
      const user = userEvent.setup()

      mockUsePdfConverter.mockReturnValue({
        ...defaultHookReturn,
        files: mockFiles,
        fileProgresses: [{
          ...mockFileProgresses[0],
          images: ['image1']
        }]
      })

      render(<App />)

      const downloadButton = screen.getByRole('button', { name: /download \(1 images\)/i })
      await user.click(downloadButton)

      expect(defaultHookReturn.downloadImages).toHaveBeenCalledWith(0)
    })
  })

  describe('bulk download', () => {
    const mockFiles = [
      new File(['pdf1'], 'test1.pdf', { type: 'application/pdf' }),
      new File(['pdf2'], 'test2.pdf', { type: 'application/pdf' })
    ]

    const mockFileProgressesWithImages = [
      {
        file: mockFiles[0],
        progress: {
          currentPage: 1,
          totalPages: 1,
          fileName: 'test1.pdf',
          status: 'completed' as const
        },
        images: ['image1']
      },
      {
        file: mockFiles[1],
        progress: {
          currentPage: 2,
          totalPages: 2,
          fileName: 'test2.pdf',
          status: 'completed' as const
        },
        images: ['image2', 'image3']
      }
    ]

    it('should display download all button when some files have images', () => {
      mockUsePdfConverter.mockReturnValue({
        ...defaultHookReturn,
        files: mockFiles,
        fileProgresses: mockFileProgressesWithImages
      })

      render(<App />)

      expect(screen.getByRole('button', { name: /download all as zip/i })).toBeInTheDocument()
    })

    it('should not display download all button when no files have images', () => {
      mockUsePdfConverter.mockReturnValue({
        ...defaultHookReturn,
        files: mockFiles,
        fileProgresses: mockFileProgressesWithImages.map(fp => ({
          ...fp,
          images: []
        }))
      })

      render(<App />)

      expect(screen.queryByRole('button', { name: /download all as zip/i })).not.toBeInTheDocument()
    })

    it('should call downloadAllAsZip when download all button is clicked', async () => {
      const user = userEvent.setup()

      mockUsePdfConverter.mockReturnValue({
        ...defaultHookReturn,
        files: mockFiles,
        fileProgresses: mockFileProgressesWithImages
      })

      render(<App />)

      const downloadAllButton = screen.getByRole('button', { name: /download all as zip/i })
      await user.click(downloadAllButton)

      expect(defaultHookReturn.downloadAllAsZip).toHaveBeenCalled()
    })
  })

  describe('edge cases and error states', () => {
    it('should handle empty file input gracefully', async () => {
      const user = userEvent.setup()
      render(<App />)

      const fileInput = screen.getByLabelText(/click to select pdf files/i)

      // Simulate selecting no files (empty FileList)
      await user.upload(fileInput, [])

      expect(defaultHookReturn.handleFileUpload).toHaveBeenCalledWith([])
    })

    it('should handle missing file progress gracefully', () => {
      const mockFiles = [new File(['pdf'], 'test.pdf', { type: 'application/pdf' })]

      mockUsePdfConverter.mockReturnValue({
        ...defaultHookReturn,
        files: mockFiles,
        fileProgresses: [] // No progress data yet
      })

      render(<App />)

      // Should still render the file name
      expect(screen.getByText('test.pdf')).toBeInTheDocument()
      // But no progress information should be shown
      expect(screen.queryByText(/status:/i)).not.toBeInTheDocument()
    })

    it('should handle partial file progress data', () => {
      const mockFiles = [
        new File(['pdf1'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['pdf2'], 'test2.pdf', { type: 'application/pdf' })
      ]

      const partialProgresses = [
        {
          file: mockFiles[0],
          progress: {
            currentPage: 1,
            totalPages: 3,
            fileName: 'test1.pdf',
            status: 'processing' as const
          },
          images: []
        }
        // No progress for second file
      ]

      mockUsePdfConverter.mockReturnValue({
        ...defaultHookReturn,
        files: mockFiles,
        fileProgresses: partialProgresses
      })

      render(<App />)

      // First file should have progress
      expect(screen.getByText(/status: processing/i)).toBeInTheDocument()

      // Both files should still be listed
      expect(screen.getByText('test1.pdf')).toBeInTheDocument()
      expect(screen.getByText('test2.pdf')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper form labels', () => {
      const mockFiles = [new File(['pdf'], 'test.pdf', { type: 'application/pdf' })]

      mockUsePdfConverter.mockReturnValue({
        ...defaultHookReturn,
        files: mockFiles
      })

      render(<App />)

      expect(screen.getByLabelText(/format/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/quality \(dpi\)/i)).toBeInTheDocument()
    })

    it('should have proper button roles and names', () => {
      const mockFiles = [new File(['pdf'], 'test.pdf', { type: 'application/pdf' })]

      mockUsePdfConverter.mockReturnValue({
        ...defaultHookReturn,
        files: mockFiles
      })

      render(<App />)

      expect(screen.getByRole('button', { name: /start conversion/i })).toBeInTheDocument()
    })

    it('should have semantic HTML structure', () => {
      render(<App />)

      expect(screen.getByRole('banner')).toBeInTheDocument() // header
      expect(screen.getByRole('main')).toBeInTheDocument() // main
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument() // h1
    })
  })
})
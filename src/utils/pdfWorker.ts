import * as pdfjsLib from 'pdfjs-dist'
import type { ConversionOptions, ConversionProgress } from '../types'

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js'
}

export async function convertPdfToImages(
  file: File,
  options: ConversionOptions = { format: 'png', scale: 2.0 },
  onProgress?: (progress: ConversionProgress) => void
): Promise<string[]> {
  const imageUrls: string[] = []

  console.log('🚀 Starting PDF conversion:', {
    fileName: file.name,
    fileSize: file.size,
    options
  })

  try {
    console.log('📄 Reading file as array buffer...')
    const arrayBuffer = await file.arrayBuffer()

    console.log('🔄 Loading PDF document...', arrayBuffer.byteLength, 'bytes')
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
    const totalPages = pdf.numPages

    console.log('📋 PDF loaded successfully!', { totalPages })

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: options.scale || 2.0 })

        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')!
        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas
        }

        await page.render(renderContext).promise

        const imageDataUrl = canvas.toDataURL(
          options.format === 'jpeg' ? 'image/jpeg' : 'image/png',
          options.quality || 0.95
        )

        imageUrls.push(imageDataUrl)

        onProgress?.({
          currentPage: pageNum,
          totalPages,
          fileName: file.name,
          status: 'processing',
          imageUrl: imageDataUrl
        })

        page.cleanup()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        onProgress?.({
          currentPage: pageNum,
          totalPages,
          fileName: file.name,
          status: 'error',
          error: errorMessage
        })
        throw error
      }
    }

    onProgress?.({
      currentPage: totalPages,
      totalPages,
      fileName: file.name,
      status: 'completed'
    })

    return imageUrls
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    onProgress?.({
      currentPage: 0,
      totalPages: 0,
      fileName: file.name,
      status: 'error',
      error: errorMessage
    })
    throw error
  }
}
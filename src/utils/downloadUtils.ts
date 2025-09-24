import JSZip from 'jszip'
import type { FileProgress, ConversionOptions } from '../types'

const getDpiFromScale = (scale: number): number => {
  return Math.round(scale * 150) // 150 DPI is base scale of 1.0
}

const formatFileName = (baseName: string, dpi: number, format: string, pageNum?: number): string => {
  const pageStr = pageNum ? `_page_${pageNum}` : ''
  return `${baseName}_${dpi}dpi${pageStr}.${format}`
}

export const downloadSingleImage = (
  imageUrl: string,
  fileName: string,
  format: string,
  scale: number
) => {
  const dpi = getDpiFromScale(scale)
  const link = document.createElement('a')
  link.href = imageUrl
  link.download = formatFileName(fileName, dpi, format, 1)
  link.click()
}

export const downloadImagesAsZip = async (
  images: string[],
  fileName: string,
  format: string,
  scale: number
): Promise<void> => {
  const dpi = getDpiFromScale(scale)
  const zip = new JSZip()

  images.forEach((imageUrl, index) => {
    const base64Data = imageUrl.split(',')[1]
    const individualFileName = formatFileName(fileName, dpi, format, index + 1)
    zip.file(individualFileName, base64Data, { base64: true })
  })

  const content = await zip.generateAsync({ type: 'blob' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(content)
  link.download = `${fileName}_${dpi}dpi_images.zip`
  link.click()
}

export const downloadFileImages = async (
  fileProgress: FileProgress,
  options: ConversionOptions
): Promise<void> => {
  if (!fileProgress || fileProgress.images.length === 0) return

  const fileName = fileProgress.file.name.replace('.pdf', '')
  const scale = options.scale || 2.0

  if (fileProgress.images.length === 1) {
    downloadSingleImage(fileProgress.images[0], fileName, options.format, scale)
  } else {
    await downloadImagesAsZip(fileProgress.images, fileName, options.format, scale)
  }
}

export const downloadAllFilesAsZip = async (
  fileProgresses: FileProgress[],
  options: ConversionOptions
): Promise<void> => {
  const allImages = fileProgresses.filter(fp => fp.images.length > 0)
  if (allImages.length === 0) return

  const dpi = getDpiFromScale(options.scale || 2.0)
  const zip = new JSZip()

  allImages.forEach((fileProgress) => {
    const fileName = fileProgress.file.name.replace('.pdf', '')
    fileProgress.images.forEach((imageUrl, index) => {
      const base64Data = imageUrl.split(',')[1]
      const individualFileName = formatFileName(fileName, dpi, options.format, index + 1)
      zip.file(individualFileName, base64Data, { base64: true })
    })
  })

  const content = await zip.generateAsync({ type: 'blob' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(content)
  link.download = `all_converted_${dpi}dpi_images.zip`
  link.click()
}
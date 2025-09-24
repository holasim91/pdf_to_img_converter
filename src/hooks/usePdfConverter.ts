import { useState, useCallback, useEffect } from 'react'
import type {
  PdfConverterState,
  PdfConverterActions,
  ConversionOptions,
  FileProgress
} from '../types'
import { convertPdfToImages } from '../utils/pdfWorker'
import { downloadFileImages, downloadAllFilesAsZip } from '../utils/downloadUtils'

const DEFAULT_OPTIONS: ConversionOptions = {
  format: 'png',
  scale: 2.0,    // 2.0 = 300 DPI (기본값)
  quality: 0.95  // JPEG 압축 품질 (0.0-1.0), PNG에는 영향 없음
}

export const usePdfConverter = (): PdfConverterState & PdfConverterActions => {
  const [files, setFiles] = useState<File[]>([])
  const [isConverting, setIsConverting] = useState(false)
  const [fileProgresses, setFileProgresses] = useState<FileProgress[]>([])
  const [options, setOptions] = useState<ConversionOptions>(DEFAULT_OPTIONS)

  // DPI나 포맷 변경 시 진행상황 초기화 (변환 중이 아닐 때만)
  useEffect(() => {
    if (fileProgresses.length > 0 && !isConverting) {
      console.log('Options changed, resetting progress:', { format: options.format, scale: options.scale })
      setFileProgresses([])
    }
  }, [options.scale, options.format])

  const handleFileUpload = useCallback((newFiles: File[]) => {
    const uniqueNewFiles: File[] = []
    const duplicateFileNames: string[] = []

    newFiles.forEach(newFile => {
      // 중복 파일 체크: 이름과 크기가 모두 같으면 중복으로 판단
      const isDuplicate = files.some(existingFile =>
        existingFile.name === newFile.name &&
        existingFile.size === newFile.size
      )

      if (isDuplicate) {
        duplicateFileNames.push(newFile.name)
      } else {
        uniqueNewFiles.push(newFile)
      }
    })

    // 중복 파일이 있으면 알림
    if (duplicateFileNames.length > 0) {
      const message = duplicateFileNames.length === 1
        ? `"${duplicateFileNames[0]}" 파일이 이미 업로드되어 있습니다.`
        : `${duplicateFileNames.length}개 파일이 이미 업로드되어 있습니다: ${duplicateFileNames.join(', ')}`

      alert(message)
      console.log('Duplicate files detected:', duplicateFileNames)
    }

    // 새 파일이 있으면 기존 파일에 추가
    if (uniqueNewFiles.length > 0) {
      setFiles(prev => [...prev, ...uniqueNewFiles])
      console.log(`${uniqueNewFiles.length}개 파일이 추가되었습니다.`)
    }
  }, [files])

  const startConversion = useCallback(async () => {
    console.log('🚨 ENTERING startConversion function!!!')
    console.log('🎬 startConversion called!', { filesLength: files.length })

    if (files.length === 0) {
      console.log('❌ No files to convert')
      return
    }

    console.log('📂 Files to convert:', files.map(f => f.name))
    setIsConverting(true)
    console.log('🔄 isConverting set to true')

    // 기존 fileProgresses와 새로 추가된 파일들을 매칭
    const updatedProgresses = files.map((file, fileIndex) => {
      const existingProgress = fileProgresses[fileIndex]

      // 기존에 변환 완료된 파일이면 그대로 유지
      if (existingProgress && existingProgress.images.length > 0) {
        return existingProgress
      }

      // 새로운 파일이거나 아직 변환되지 않은 파일이면 초기화
      return {
        file,
        progress: {
          currentPage: 0,
          totalPages: 0,
          fileName: file.name,
          status: 'processing' as const
        },
        images: []
      }
    })

    setFileProgresses(updatedProgresses)

    // 변환이 필요한 파일들만 필터링 (이미 변환된 파일 제외)
    console.log('🔍 Checking files to convert...')
    console.log('📊 Current fileProgresses:', fileProgresses.length)
    console.log('📄 Current files:', files.length)

    const filesToConvert = files.filter((_, fileIndex) => {
      const existingProgress = fileProgresses[fileIndex]
      const needsConversion = !existingProgress || existingProgress.images.length === 0
      console.log(`📝 File ${fileIndex}: needs conversion = ${needsConversion}`)
      return needsConversion
    })

    console.log('📋 Files to convert:', filesToConvert.length)

    if (filesToConvert.length === 0) {
      console.log('❌ All files are already converted')
      setIsConverting(false)
      return
    }

    console.log(`✅ Converting ${filesToConvert.length} new files...`)

    try {
      const results = await Promise.allSettled(
        filesToConvert.map(async (file) => {
          const fileIndex = files.indexOf(file)
          const images = await convertPdfToImages(file, options, (progress) => {
            setFileProgresses(prev =>
              prev.map((fp, idx) =>
                idx === fileIndex ? { ...fp, progress } : fp
              )
            )
          })

          setFileProgresses(prev => {
            const updated = prev.map((fp, idx) =>
              idx === fileIndex ? { ...fp, images } : fp
            )
            console.log('🖼️ Updated fileProgresses:', updated)
            return updated
          })

          return { file, images }
        })
      )

      console.log('Conversion completed:', results)
    } catch (error) {
      console.error('Conversion error:', error)
    } finally {
      setIsConverting(false)
    }
  }, [files, options, fileProgresses])

  const downloadImages = useCallback(async (fileIndex: number) => {
    const fileProgress = fileProgresses[fileIndex]
    await downloadFileImages(fileProgress, options)
  }, [fileProgresses, options])

  const downloadAllAsZip = useCallback(async () => {
    await downloadAllFilesAsZip(fileProgresses, options)
  }, [fileProgresses, options])

  const updateOptions = useCallback((newOptions: Partial<ConversionOptions>) => {
    console.log('Hook updateOptions called with:', newOptions)
    setOptions(prev => {
      const updated = { ...prev, ...newOptions }
      console.log('Options updated from', prev, 'to', updated)
      return updated
    })
  }, [])

  const removeFile = useCallback((fileIndex: number) => {
    console.log('Removing file at index:', fileIndex)
    setFiles(prev => prev.filter((_, index) => index !== fileIndex))
    setFileProgresses(prev => prev.filter((_, index) => index !== fileIndex))
  }, [])

  const reset = useCallback(() => {
    setFiles([])
    setFileProgresses([])
    setIsConverting(false)
    setOptions(DEFAULT_OPTIONS)
  }, [])

  return {
    // State
    files,
    isConverting,
    fileProgresses,
    options,
    // Actions
    handleFileUpload,
    startConversion,
    downloadImages,
    downloadAllAsZip,
    updateOptions,
    removeFile,
    reset
  }
}
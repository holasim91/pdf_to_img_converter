import type { FileProgress, ConversionOptions } from '../types'
import { isTauriEnvironment } from './textUtils'


// Tauri API wrapper - only loaded in Tauri environment
let tauriApi: any = null

// Check if running in Tauri environment and load APIs
const initTauriApi = async () => {
  console.log('=== Tauri API 로딩 시도 ===')
  console.log('isTauriEnvironment():', isTauriEnvironment())

  try {
    // Only attempt to load Tauri APIs if we're in a Tauri environment
    if (isTauriEnvironment()) {
      console.log('Tauri 환경 감지됨. API 로딩 시작...')

      // pathUtils에서 성공한 방식과 동일하게 직접 import 사용
      console.log('직접 import 시도...')
      const [dialogModule, fsModule] = await Promise.all([
        import('@tauri-apps/plugin-dialog'),
        import('@tauri-apps/plugin-fs')
      ])

      console.log('직접 import 완료:', { dialogModule, fsModule })
      console.log('dialogModule.save:', typeof dialogModule.save)
      console.log('fsModule:', fsModule)
      console.log('fsModule 키들:', Object.keys(fsModule))

      // writeFile 또는 다른 write 함수들 확인
      console.log('fsModule.writeFile:', typeof fsModule.writeFile)
      console.log('fsModule.writeTextFile:', typeof fsModule.writeTextFile)
      console.log('fsModule.create:', typeof fsModule.create)
      console.log('fsModule.open:', typeof fsModule.open)

      tauriApi = {
        dialog: { save: dialogModule.save },
        fs: {
          writeFile: fsModule.writeFile,
          mkdir: fsModule.mkdir
        }
      }

      console.log('✅ Tauri APIs loaded successfully')
    } else {
      console.log('❌ 브라우저 환경 감지됨')
    }
  } catch (error) {
    console.log('❌ Tauri API 로딩 실패:', error)
  }
}

// Initialize Tauri API only when needed
let tauriInitialized = false

const ensureTauriApi = async () => {
  if (!tauriInitialized) {
    await initTauriApi()
    tauriInitialized = true
  }
}

// Initialize immediately when module loads to debug
if (typeof window !== 'undefined' && isTauriEnvironment()) {
  console.log('💡 downloadUtils.ts 모듈이 로드됨 (Tauri 환경)')
  initTauriApi().then(() => {
    console.log('💡 initTauriApi 완료')
  }).catch((error) => {
    console.error('💡 initTauriApi 실패:', error)
  })
} else if (typeof window !== 'undefined') {
  console.log('💡 downloadUtils.ts 모듈이 로드됨 (브라우저 환경)')
}

const getDpiFromScale = (scale: number): number => {
  return Math.round(scale * 150) // 150 DPI is base scale of 1.0
}

const formatFileName = (baseName: string, dpi: number, format: string, pageNum?: number): string => {
  const pageStr = pageNum ? `_page_${pageNum}` : ''
  return `${baseName}_${dpi}dpi${pageStr}.${format}`
}

// Tauri에서 단일 이미지 저장
const saveSingleImageTauri = async (
  imageUrl: string,
  fileName: string,
  format: string,
  scale: number
): Promise<void> => {
  console.log('🚀 saveSingleImageTauri 함수 시작됨')

  if (!tauriApi) {
    console.log('❌ tauriApi가 로드되지 않았음')
    throw new Error('Tauri API not loaded')
  }

  const dpi = getDpiFromScale(scale)
  const defaultFileName = formatFileName(fileName, dpi, format, 1)
  console.log('🔍 파일명 생성 완료:', defaultFileName)

  try {
    // Base64 데이터 추출
    const base64Data = imageUrl.split(',')[1]
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

    // save 다이얼로그를 통해 직접 저장
    const filePath = await tauriApi.dialog.save({
      defaultPath: defaultFileName,
      filters: [
        {
          name: `${format.toUpperCase()} Images`,
          extensions: [format]
        }
      ]
    })

    if (filePath) {
      await tauriApi.fs.writeFile(filePath, binaryData)
      console.log('✅ 이미지 저장 완료:', filePath)
      alert(`✅ 이미지가 성공적으로 저장되었습니다!\n\n경로: ${filePath}`)
    }
  } catch (error) {
    console.error('Failed to save image:', error)
    throw error
  }
}

// Tauri에서 디렉토리에 개별 이미지 저장
const saveImagesAsDirectoryTauri = async (
  images: string[],
  fileName: string,
  format: string,
  scale: number
): Promise<void> => {
  if (!tauriApi) {
    throw new Error('Tauri API not loaded')
  }

  const dpi = getDpiFromScale(scale)

  try {
    // 첫 번째 파일의 저장 경로를 정하고, 그것의 부모 디렉토리에 나머지 파일들도 저장
    const firstFileName = formatFileName(fileName, dpi, format, 1)
    const firstFilePath = await tauriApi.dialog.save({
      defaultPath: firstFileName,
      filters: [
        {
          name: `${format.toUpperCase()} Images`,
          extensions: [format]
        }
      ]
    })

    if (!firstFilePath) return

    // 첫 번째 파일의 디렉토리를 가져와서 나머지 파일들을 같은 디렉토리에 저장
    const parentPath = firstFilePath.substring(0, firstFilePath.lastIndexOf('/'))
    console.log('📁 부모 디렉토리:', parentPath)

    // 각 이미지를 개별 파일로 저장
    for (let index = 0; index < images.length; index++) {
      const imageUrl = images[index]
      console.log(`🖼️ 이미지 ${index + 1} 저장 시작:`, imageUrl.substring(0, 50) + '...')

      const base64Data = imageUrl.split(',')[1]
      console.log('📦 Base64 데이터 길이:', base64Data.length)

      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
      console.log('🔢 Binary 데이터 크기:', binaryData.length)

      const individualFileName = `${fileName}_${dpi}dpi_${format}_page_${index + 1}.${format}`
      const fullPath = `${parentPath}/${individualFileName}`
      console.log('📁 저장 경로:', fullPath)

      try {
        await tauriApi.fs.writeFile(fullPath, binaryData)
        console.log('✅ 파일 저장 성공:', individualFileName)
      } catch (fileError) {
        console.error('❌ 파일 저장 실패:', individualFileName, fileError)
        throw fileError
      }
    }

    console.log('✅ 이미지들 저장 완료:', parentPath)
    alert(`✅ ${images.length}개의 이미지가 성공적으로 저장되었습니다!\n\n경로: ${parentPath}`)
  } catch (error) {
    console.error('Failed to save images:', error)
    throw error
  }
}

export const downloadSingleImage = async (
  imageUrl: string,
  fileName: string,
  format: string,
  scale: number
): Promise<void> => {
  console.log('🎯 downloadSingleImage 호출됨:', { fileName, format, scale })
  console.log('🔍 환경 체크:', isTauriEnvironment())

  try {
    // Tauri 환경에서는 네이티브 저장
    if (isTauriEnvironment()) {
      console.log('✅ Tauri 환경 - saveSingleImageTauri 호출')
      // Ensure Tauri APIs are loaded
      await ensureTauriApi()
      await saveSingleImageTauri(imageUrl, fileName, format, scale)
      return
    }

    // 웹 브라우저 환경에서는 다운로드
    const dpi = getDpiFromScale(scale)
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = formatFileName(fileName, dpi, format, 1)
    link.click()
    // 브라우저에서는 다운로드 시작만 가능 (완료 확인 어려움)
  } catch (error) {
    console.error('이미지 저장/다운로드 실패:', error)
    alert('❌ 이미지 저장/다운로드에 실패했습니다.')
  }
}

export const downloadImagesAsDirectory = async (
  images: string[],
  fileName: string,
  format: string,
  scale: number
): Promise<void> => {
  try {
    // Tauri 환경에서는 디렉토리에 저장
    if (isTauriEnvironment()) {
      await ensureTauriApi()
      await saveImagesAsDirectoryTauri(images, fileName, format, scale)
      return
    }

    // 웹 브라우저 환경에서는 개별 파일 다운로드
    const dpi = getDpiFromScale(scale)

    // 각 이미지를 개별적으로 다운로드
    images.forEach((imageUrl, index) => {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = formatFileName(fileName, dpi, format, index + 1)
      link.click()
    })

    // 약간의 지연을 주어 모든 다운로드가 시작되도록 함
  } catch (error) {
    console.error('이미지 저장/다운로드 실패:', error)
    alert('❌ 이미지 저장/다운로드에 실패했습니다.')
  }
}

export const downloadFileImages = async (
  fileProgress: FileProgress,
  options: ConversionOptions
): Promise<void> => {
  if (!fileProgress || fileProgress.images.length === 0) return

  const fileName = fileProgress.file.name.replace('.pdf', '')
  const scale = options.scale || 2.0

  // 항상 디렉토리에 저장 (단일 페이지든 다중 페이지든)
  await downloadImagesAsDirectory(fileProgress.images, fileName, options.format, scale)
}

export const downloadAllAsDirectory = async (
  fileProgresses: FileProgress[],
  options: ConversionOptions
): Promise<void> => {
  const allImages = fileProgresses.filter(fp => fp.images.length > 0)
  if (allImages.length === 0) return

  const dpi = getDpiFromScale(options.scale || 2.0)

  // Tauri 환경에서는 하나의 디렉토리에 모든 파일들을 저장
  if (isTauriEnvironment()) {
    await ensureTauriApi()

    if (!tauriApi) {
      throw new Error('Tauri API not loaded')
    }

    try {
      // 첫 번째 파일의 저장 경로를 정하고, 그 디렉토리에 모든 파일들을 저장
      const firstFileName = formatFileName(allImages[0].file.name.replace('.pdf', ''), dpi, options.format, 1)
      const firstFilePath = await tauriApi.dialog.save({
        defaultPath: firstFileName,
        filters: [
          {
            name: `${options.format.toUpperCase()} Images`,
            extensions: [options.format]
          }
        ]
      })

      if (!firstFilePath) return

      // 첫 번째 파일의 디렉토리를 가져와서 모든 파일들을 같은 디렉토리에 저장
      const parentPath = firstFilePath.substring(0, firstFilePath.lastIndexOf('/'))
      console.log('📁 부모 디렉토리:', parentPath)

      // 모든 파일의 이미지들을 저장
      for (const fileProgress of allImages) {
        const fileName = fileProgress.file.name.replace('.pdf', '')
        console.log(`📂 파일 처리 시작: ${fileName} (${fileProgress.images.length}개 이미지)`)

        for (let index = 0; index < fileProgress.images.length; index++) {
          const imageUrl = fileProgress.images[index]
          console.log(`🖼️ 이미지 ${index + 1} 저장 시작:`, imageUrl.substring(0, 50) + '...')

          const base64Data = imageUrl.split(',')[1]
          console.log('📦 Base64 데이터 길이:', base64Data.length)

          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
          console.log('🔢 Binary 데이터 크기:', binaryData.length)

          const individualFileName = formatFileName(fileName, dpi, options.format, index + 1)
          const fullPath = `${parentPath}/${individualFileName}`
          console.log('📁 저장 경로:', fullPath)

          try {
            await tauriApi.fs.writeFile(fullPath, binaryData)
            console.log('✅ 파일 저장 성공:', individualFileName)
          } catch (fileError) {
            console.error('❌ 파일 저장 실패:', individualFileName, fileError)
            throw fileError
          }
        }
      }

      console.log('✅ 전체 이미지들 저장 완료:', parentPath)
      alert(`✅ 전체 이미지들이 성공적으로 저장되었습니다!\n\n경로: ${parentPath}`)
    } catch (error) {
      console.error('전체 이미지 저장 실패:', error)
      alert('❌ 전체 이미지 저장에 실패했습니다.')
      throw error
    }
    return
  }

  // 웹 브라우저 환경에서는 개별 파일 다운로드
  try {
    allImages.forEach((fileProgress) => {
      const fileName = fileProgress.file.name.replace('.pdf', '')
      fileProgress.images.forEach((imageUrl, index) => {
        const link = document.createElement('a')
        link.href = imageUrl
        link.download = formatFileName(fileName, dpi, options.format, index + 1)
        link.click()
      })
    })
  } catch (error) {
    console.error('전체 이미지 다운로드 실패:', error)
    alert('❌ 전체 이미지 다운로드에 실패했습니다.')
    throw error
  }
}
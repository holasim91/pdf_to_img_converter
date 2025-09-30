import React, { useEffect } from 'react'
import './App.css'
import { usePdfConverter } from './hooks/usePdfConverter'
import { useDragAndDrop } from './hooks/useDragAndDrop'
import { getSaveButtonText, getSaveAllButtonText } from './utils/textUtils'

function App() {
  const {
    files,
    isConverting,
    fileProgresses,
    options,
    handleFileUpload,
    startConversion,
    downloadImages,
    downloadAllAsZip,
    updateOptions,
    removeFile
  } = usePdfConverter()

  const{
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  } = useDragAndDrop(handleFileUpload)


  // 옵션 변화 모니터링
  useEffect(() => {
    console.log('Options changed in App component:', options)
  }, [options])

  // fileProgresses 상태 모니터링
  useEffect(() => {
    console.log('📊 fileProgresses changed:', fileProgresses)
  }, [fileProgresses])

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || [])
    handleFileUpload(uploadedFiles)
  }

  const handleFormatChange = (format: 'png' | 'jpeg') => {
    updateOptions({ format })
  }

  const handleScaleChange = (scale: number) => {
    console.log('Scale changing to:', scale)
    updateOptions({ scale })
  }



  return (
    <div className="app">
      <header className="app-header">
        <h1>PDF to Image Converter</h1>
        <p>Convert PDF files to high-quality images (JPG/PNG)</p>
      </header>

      <main
        className={`app-main ${isDragging ? 'drag-over' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept=".pdf"
          onChange={handleFileInputChange}
          className="file-input"
          id="pdf-upload"
        />
        <label htmlFor="pdf-upload" className="upload-section">
          <div className="upload-label">
            {files.length === 0
              ? "Click to select PDF files or drag & drop here"
              : `${files.length} file(s) uploaded • Click to add more files`
            }
          </div>
        </label>

        {files.length > 0 && (
          <div className="options-section">
            <h3>Conversion Options</h3>
            {/* <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
              Debug: format={options.format}, scale={options.scale}, quality={options.quality}
            </div> */}
            <div className="options-grid">
              <div className="option-group">
                <label htmlFor="format-select">Format:</label>
                <select
                  id="format-select"
                  value={options.format}
                  onChange={(e) => handleFormatChange(e.target.value as 'png' | 'jpeg')}
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                </select>
              </div>
              <div className="option-group">
                <label htmlFor="quality-select">Quality (DPI):</label>
                <select
                  id="quality-select"
                  value={options.scale}
                  onChange={(e) => {
                    console.log('Select onChange triggered:', e.target.value)
                    handleScaleChange(Number(e.target.value))
                  }}
                >
                  <option value={1.0}>150 DPI (Normal)</option>
                  <option value={2.0}>300 DPI (High)</option>
                  <option value={3.0}>450 DPI (Very High)</option>
                </select>
              </div>

            </div>
          </div>
        )}

        {files.length > 0 && (
          <div className="file-list">
            <div className="list-header">
              <h3>Selected Files:</h3>
              <button
                onClick={() => {
                  console.log('🔥 BUTTON CLICKED!')
                  console.log('🔍 startConversion function type:', typeof startConversion)
                  startConversion()
                }}
                disabled={isConverting}
                className="convert-btn"
              >
                {isConverting ? 'Converting...' : 'Start Conversion'}
              </button>
            </div>

            {files.map((file, index) => {
              const fileProgress = fileProgresses[index]
              return (
                <div key={index} className="file-item">
                  <div className="file-info">
                    <div className="file-details">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">
                        ({Math.round(file.size / 1024 / 1024 * 100) / 100} MB)
                      </span>
                    </div>
                    <button
                      className="remove-file-btn"
                      onClick={() => removeFile(index)}
                      title="Remove file"
                      disabled={isConverting}
                    >
                      ×
                    </button>
                  </div>

                  {fileProgress && (
                    <div className="progress-section">
                      <div className="progress-info">
                        <span>Status: {fileProgress.progress.status}</span>
                        {fileProgress.progress.totalPages > 0 && (
                          <span>
                            Page: {fileProgress.progress.currentPage}/{fileProgress.progress.totalPages}
                          </span>
                        )}
                      </div>
                      {/* 프로그래스 바 */}
                      {fileProgress.progress.totalPages > 0 && (
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${(fileProgress.progress.currentPage / fileProgress.progress.totalPages) * 100}%`
                            }}
                          />
                        </div>
                      )}
                      {/* 개별 파일 다운로드 버튼 */}
                      {fileProgress.images.length > 0 && (
                        <button
                          onClick={() => downloadImages(index)}
                          className="download-btn"
                        >
                          {getSaveButtonText(fileProgress.images.length)}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {/* 전체 파일 다운로드 버튼 */}

            {fileProgresses.some(fp => fp.images.length > 0) && (
              <div className="bulk-download">
                <button onClick={downloadAllAsZip} className="download-all-btn">
                  {getSaveAllButtonText()}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
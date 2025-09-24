import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock DOMMatrix for pdfjs
global.DOMMatrix = class DOMMatrix {
  constructor() {}
}

// Mock PDF.js worker
Object.defineProperty(window, 'Worker', {
  value: class MockWorker {
    constructor() {}
    postMessage() {}
    terminate() {}
  }
})

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock document.createElement('a').click()
Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
  value: vi.fn()
})

// Mock canvas methods
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({ data: new Array(4) })),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
  }))
})

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: vi.fn(() => 'data:image/png;base64,mock-image-data')
})
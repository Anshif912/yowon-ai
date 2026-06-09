import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Presentation, Upload, X, CheckCircle2 } from 'lucide-react'

interface FileDropZoneProps {
  accept: string
  label: string
  hint: string
  type: 'pdf' | 'ppt'
  file: File | null
  onFile: (file: File | null) => void
}

export default function FileDropZone({
  accept,
  label,
  hint,
  type,
  file,
  onFile,
}: FileDropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const Icon = type === 'pdf' ? FileText : Presentation
  const maxBytes = 50 * 1024 * 1024
  const allowedExtensions = type === 'pdf' ? ['.pdf'] : ['.ppt', '.pptx']
  const executableExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.ps1', '.sh', '.js', '.jar', '.msi']

  const validateFile = (f: File): string | null => {
    const lowerName = f.name.toLowerCase()
    const parts = lowerName.split('.').filter(Boolean)
    const finalExt = parts.length > 1 ? `.${parts[parts.length - 1]}` : ''
    if (!allowedExtensions.includes(finalExt)) return `${label} must be ${allowedExtensions.join(' or ')}`
    const earlierExts = parts.slice(1, -1).map(part => `.${part}`)
    if (earlierExts.some(ext => executableExtensions.includes(ext))) return 'Executable or double-extension files are not allowed'
    if (earlierExts.length && earlierExts.some(ext => !allowedExtensions.includes(ext))) return 'Double-extension files are not allowed'
    if (f.size > maxBytes) return `${label} must be 50MB or smaller`
    if (f.type && type === 'pdf' && !['application/pdf', 'application/x-pdf'].includes(f.type)) return 'Invalid PDF file type'
    if (f.type && type === 'ppt' && ![
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/octet-stream',
    ].includes(f.type)) return 'Invalid PowerPoint file type'
    return null
  }

  const handleFile = useCallback(
    (f: File | null) => {
      if (!f) {
        onFile(null)
        setUploadProgress(0)
        setError(null)
        return
      }
      const validationError = validateFile(f)
      if (validationError) {
        onFile(null)
        setUploadProgress(0)
        setError(validationError)
        return
      }
      setError(null)
      setUploadProgress(0)
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            onFile(f)
            return 100
          }
          return prev + 12
        })
      }, 60)
    },
    [onFile],
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-yowon-muted mb-2 font-display">
        {label}
      </label>
      <motion.div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 overflow-hidden ${
          dragging
            ? 'border-violet-400/50 bg-violet-500/5 scale-[1.01]'
            : file
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-yowon-border hover:border-pink-500/35'
        }`}
        onDragOver={e => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = accept
          input.onchange = () => handleFile(input.files?.[0] ?? null)
          input.click()
        }}
        whileTap={{ scale: 0.99 }}
      >
        <AnimatePresence mode="wait">
          {file ? (
            <motion.div
              key="file"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <CheckCircle2 size={22} className="text-emerald-400 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-emerald-400 truncate">{file.name}</p>
                  <p className="text-xs text-yowon-muted">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  handleFile(null)
                }}
                className="p-1.5 rounded-lg hover:bg-white/5 text-yowon-muted hover:text-red-400 transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Icon
                size={28}
                className={`mx-auto mb-3 ${dragging ? 'text-violet-400' : 'text-yowon-muted'}`}
              />
              <p className="text-sm text-yowon-muted">
                <Upload size={14} className="inline mr-1.5 -mt-0.5" />
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-yowon-muted/70 mt-1">{hint}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-yowon-border">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 via-pink-500 to-amber-400"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </motion.div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  )
}

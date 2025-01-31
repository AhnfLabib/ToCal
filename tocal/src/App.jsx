import { useState, useCallback, useEffect, useRef } from 'react'
import { initializeWorker, recognizeImage } from './ocrWorker'
import './App.css'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [extractedSchedule, setExtractedSchedule] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [isWorkerReady, setIsWorkerReady] = useState(false)
  const [rawText, setRawText] = useState('')
  const [manualEntries, setManualEntries] = useState([
    { course: '', title: '', days: '', time: '', location: '' }
  ])

  const fileInputRef = useRef(null)

  useEffect(() => {
    const setupOCR = async () => {
      try {
        await initializeWorker()
        setIsWorkerReady(true)
      } catch (error) {
        console.error('Failed to initialize OCR:', error)
        alert('Failed to initialize OCR. Please refresh the page.')
      }
    }

    setupOCR()
  }, [])

  const handleFile = (file) => {
    if (file) {
      setSelectedFile(file)
      setExtractedSchedule(null)
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      }
    }
  }

  const handleFileSelect = (event) => {
    handleFile(event.target.files[0])
  }

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handleFile(file)
    } else {
      alert('Please drop an image or PDF file')
    }
  }, [])

  const processImageWithOCR = async (imageFile) => {
    if (!isWorkerReady) {
      throw new Error('OCR not initialized. Please wait...')
    }

    try {
      const imageUrl = URL.createObjectURL(imageFile)
      const result = await recognizeImage(null, imageUrl)
      
      // Use structured data if available, otherwise fall back to text
      const textToProcess = result.data.structured?.length > 0 
        ? result.data.structured.map(item => item.raw).join('\n')
        : result.data.text

      return textToProcess
    } catch (error) {
      console.error('OCR Error:', error)
      throw error
    }
  }

  const parseScheduleText = (text) => {
    // Split text into lines and filter out empty lines
    const lines = text.split('\n').filter(line => line.trim())
    
    // More specific patterns for your schedule format
    const coursePattern = /([A-Z]{2,4})\s*(\d{3}[A-Z]*)/i  // e.g., BUSA 285A
    const timePattern = /(\d{1,2}:?\d{2})\s*-\s*(\d{1,2}:?\d{2})\s*([MTWRF]+)/i  // e.g., 10:00-11:30 TR
    const roomPattern = /([A-Z]+)\s*(\d+)/i  // e.g., ROW 205
    const instructorPattern = /([A-Z]\.\s*[A-Z][a-zA-Z]+)/  // e.g., M. Lamb

    const courses = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      const courseMatch = line.match(coursePattern)
      
      if (courseMatch) {
        const course = {
          dept: courseMatch[1].toUpperCase(),
          course: courseMatch[2],
          title: '',
          time: '',
          location: '',
          instructor: ''
        }

        // Look at current line and next few lines for details
        const contextLines = [
          line,
          lines[i + 1] || '',
          lines[i + 2] || ''
        ].join(' ')

        // Extract time
        const timeMatch = contextLines.match(timePattern)
        if (timeMatch) {
          course.time = `${timeMatch[1]}-${timeMatch[2]} ${timeMatch[3].toUpperCase()}`
        }

        // Extract location
        const roomMatch = contextLines.match(roomPattern)
        if (roomMatch) {
          course.location = `${roomMatch[1]} ${roomMatch[2]}`
        }

        // Extract title (everything between course number and time/location)
        let titleText = line.substring(courseMatch[0].length).trim()
        if (timeMatch) {
          titleText = titleText.split(timeMatch[0])[0].trim()
        }
        if (roomMatch) {
          titleText = titleText.split(roomMatch[0])[0].trim()
        }
        course.title = titleText.replace(/\s+/g, ' ').trim()

        // Extract instructor
        const instructorMatch = contextLines.match(instructorPattern)
        if (instructorMatch) {
          course.instructor = instructorMatch[1]
        }

        // Only add if we have at least some basic information
        if (course.dept && course.course) {
          courses.push(course)
        }
      }
    }

    return courses
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first!')
      return
    }
    
    setIsProcessing(true)
    
    try {
      const imageUrl = URL.createObjectURL(selectedFile)
      const result = await recognizeImage(null, imageUrl)
      URL.revokeObjectURL(imageUrl)
      
      setRawText(result.data.text)
      
      // Use suggestions to pre-fill manual entries
      if (result.data.suggestions && result.data.suggestions.length > 0) {
        setManualEntries(result.data.suggestions.map(s => ({
          course: s.course || '',
          title: s.title || '',
          days: s.days || '',
          time: s.time || '',
          location: s.location || ''
        })))
      } else {
        setManualEntries([{ course: '', title: '', days: '', time: '', location: '' }])
      }
      setExtractedSchedule(null)
    } catch (error) {
      alert('Error processing image: ' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateEvents = () => {
    // TODO: Implement calendar event creation
    console.log('Creating calendar events for:', extractedSchedule)
  }

  // Update the process button to show OCR progress
  const getProcessButtonText = () => {
    if (isProcessing) {
      return ocrProgress > 0 ? `Processing... ${ocrProgress}%` : 'Processing...'
    }
    return 'Process Schedule'
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const addEntry = () => {
    setManualEntries([...manualEntries, { course: '', title: '', days: '', time: '', location: '' }])
  }

  const updateEntry = (index, field, value) => {
    const newEntries = [...manualEntries]
    newEntries[index][field] = value
    setManualEntries(newEntries)
  }

  const removeEntry = (index) => {
    setManualEntries(manualEntries.filter((_, i) => i !== index))
  }

  const handleSaveEntries = () => {
    // Filter out empty entries
    const validEntries = manualEntries.filter(entry => 
      entry.course.trim() && entry.title.trim()
    )
    setExtractedSchedule(validEntries)
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>ToCal</h1>
        <p>Convert your class schedule to calendar events</p>
      </header>

      <main className="main-content">
        <div className="upload-section">
          <div 
            className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleFileClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
              className="file-input"
              id="file-input"
            />
            <label className="file-label">
              {previewUrl ? (
                <img src={previewUrl} alt="Schedule preview" className="preview-image" />
              ) : (
                <>
                  <span className="upload-icon">📄</span>
                  <span>Drop your schedule here or click to browse</span>
                  <span className="file-types">Accepts images and PDFs</span>
                </>
              )}
            </label>
          </div>
          
          <button 
            className="process-button"
            onClick={handleUpload}
            disabled={!selectedFile || isProcessing || !isWorkerReady}
          >
            {!isWorkerReady ? 'Initializing OCR...' : 
             isProcessing ? getProcessButtonText() : 
             'Process Schedule'}
          </button>
        </div>

        {rawText && !extractedSchedule && (
          <div className="manual-entry-section">
            <h2>Manual Schedule Entry</h2>
            <div className="extracted-text">
              <h3>Extracted Text (Reference):</h3>
              <pre>{rawText}</pre>
            </div>
            
            <div className="manual-entries">
              {manualEntries.map((entry, index) => (
                <div key={index} className="entry-row">
                  <input
                    placeholder="Course (e.g., CSE 143)"
                    value={entry.course}
                    onChange={(e) => updateEntry(index, 'course', e.target.value)}
                  />
                  <input
                    placeholder="Title"
                    value={entry.title}
                    onChange={(e) => updateEntry(index, 'title', e.target.value)}
                  />
                  <input
                    placeholder="Days (e.g., MWF or TR)"
                    value={entry.days}
                    onChange={(e) => updateEntry(index, 'days', e.target.value.toUpperCase())}
                  />
                  <input
                    placeholder="Time (e.g., 10:30-11:20)"
                    value={entry.time}
                    onChange={(e) => updateEntry(index, 'time', e.target.value)}
                  />
                  <input
                    placeholder="Location"
                    value={entry.location}
                    onChange={(e) => updateEntry(index, 'location', e.target.value)}
                  />
                  <button onClick={() => removeEntry(index)} className="remove-button">
                    ✕
                  </button>
                </div>
              ))}
              
              <div className="entry-actions">
                <button onClick={addEntry} className="add-button">
                  Add Course
                </button>
                <button onClick={handleSaveEntries} className="save-button">
                  Save Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {extractedSchedule && (
          <div className="preview-section">
            <h2>Schedule Preview</h2>
            <div className="schedule-preview">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Title</th>
                    <th>Days</th>
                    <th>Time</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedSchedule.map((course, index) => (
                    <tr key={index}>
                      <td>{course.course}</td>
                      <td>{course.title}</td>
                      <td>{course.days}</td>
                      <td>{course.time}</td>
                      <td>{course.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button 
                className="create-events-button"
                onClick={handleCreateEvents}
              >
                Create Calendar Events
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App

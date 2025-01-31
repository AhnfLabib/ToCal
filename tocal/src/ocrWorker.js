export const initializeWorker = async () => {
  // Check if Ollama is running
  try {
    const response = await fetch('http://localhost:11434/api/tags')
    const data = await response.json()
    
    // Check if we got a valid response
    if (!data) {
      throw new Error('Invalid response from Ollama server')
    }

    console.log('Available models:', data) // Debug log
    
    // Check if llava model is installed (handle different possible model names)
    const hasLlava = data.models?.some(model => 
      model.name?.toLowerCase().includes('llava') || 
      model.toLowerCase?.().includes('llava')
    )
    
    if (!hasLlava) {
      throw new Error('Llava model not found. Please run: ollama pull llava')
    }
    
    return true
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Could not connect to Ollama. Please make sure Ollama is running (ollama serve)')
    }
    console.error('Ollama initialization error:', error)
    throw error
  }
}

export const recognizeImage = async (_, imageUrl) => {
  try {
    // Convert image URL to base64
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const base64Image = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result.split(',')[1])
      reader.readAsDataURL(blob)
    })

    // Call Ollama API with Llava model
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llava',
        prompt: `Extract the following information from this class schedule image and return it as a JSON array of objects with these exact fields:
                - course: the course number (e.g., "CSE 143")
                - title: the course title
                - days: the days in MWF or TR format
                - time: the class time
                - location: the room location
                Only include these fields and ensure the response is valid JSON.`,
        images: [base64Image],
        stream: false
      })
    })

    const result = await ollamaResponse.json()
    
    try {
      // Parse the response text as JSON
      const suggestions = JSON.parse(result.response)
      return {
        data: {
          text: result.response,
          confidence: 1,
          suggestions: Array.isArray(suggestions) ? suggestions : []
        }
      }
    } catch (error) {
      console.error('Failed to parse JSON response:', result.response)
      return {
        data: {
          text: result.response,
          confidence: 1,
          suggestions: []
        }
      }
    }
  } catch (error) {
    console.error('Recognition error:', error)
    throw error
  }
}

export const expandDays = (days) => {
  const dayMap = {
    'M': 'Monday',
    'T': 'Tuesday',
    'W': 'Wednesday',
    'R': 'Thursday',
    'F': 'Friday'
  }
  return days.split('').map(d => dayMap[d] || d).join(', ')
}
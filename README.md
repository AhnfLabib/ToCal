# ToCal - Schedule to Calendar Converter

ToCal is a web application that converts class schedule images into calendar events. It utilizes Ollama with the Llava model for image recognition and text extraction, making it easy to digitize your class schedules.

## Prerequisites

Before running the application, ensure you have the following installed:

1. [Node.js](https://nodejs.org/) (v16 or higher)
2. [Ollama](https://ollama.ai/) installed
3. The Llava model pulled and ready

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/tocal.git
   cd tocal
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000` to view the application.

## Usage

1. Upload your class schedule image or PDF by dragging and dropping it into the designated area or by clicking to browse your files.
2. The application will process the file using OCR (Optical Character Recognition) to extract the schedule details.
3. Review the extracted information and make any necessary manual adjustments.
4. Save the schedule entries to create calendar events.

## Features

- Image and PDF upload support
- OCR processing to extract course details
- Manual entry for additional schedule information
- Preview of the extracted schedule
- Create calendar events from the extracted data

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Ollama](https://ollama.ai/) for providing the OCR capabilities.
- [React](https://reactjs.org/) for building the user interface.
- [Vite](https://vitejs.dev/) for the development environment.

## Contact

For any inquiries, please reach out to [your-email@example.com].
import pyttsx3

engine = pyttsx3.init()
engine.save_to_file('Hello! This is a test audio file for transcription.', 'test_audio.mp3')
engine.runAndWait()

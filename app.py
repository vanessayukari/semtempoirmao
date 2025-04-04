import os
from dotenv import load_dotenv
import ffmpeg
from flask import Flask, render_template, request, jsonify
from pytubefix import YouTube
import openai
import whisper

app = Flask(__name__)

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
whisper_model = whisper.load_model("base")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analise', methods=['POST'])
def analyze_video():
    video_url = request.form['url']

# Baixar vídeo
    video = YouTube(video_url)
    stream = video.streams.filter(progressive=True, file_extension="mp4").first()
    arquivo_video = "video.mp4"
    stream.download(filename=arquivo_video)

# Extrair áudio
    arquivo_audio = "audio.wav"
    try:
        ffmpeg.input(arquivo_video).output(arquivo_audio).run()
    except ffmpeg.Error as e:
        print(f"Erro ao converter o vídeo para áudio: {e}")
        return jsonify({"error": "Erro ao converter o vídeo para áudio."})
    if not os.path.exists(arquivo_audio):
        return jsonify({"error": "Áudio não foi salvo corretamente."})

# Dividir o áudio em partes menores
    segment_duration = 30
    segments = []
    try:
        total_duration = float(ffmpeg.probe(arquivo_audio, v='quiet', show_entries='format=duration')['format']['duration'])
        start_time = 0
        while start_time < total_duration:
            segment_file = f"audio_segment_{start_time}.wav"
            ffmpeg.input(arquivo_audio, ss=start_time, t=segment_duration).output(segment_file).run()
            segments.append(segment_file)
            start_time += segment_duration
    except Exception as e:
        print(f"Erro ao dividir o áudio: {e}")
        return jsonify({"error": "Erro ao dividir o áudio."})

# Transcrever
    transcribed_text = ""
    for segment in segments:
        try:
            audio = whisper.load_audio(segment)
            audio = whisper.pad_or_trim(audio)
            result = whisper_model.transcribe(audio)
            transcribed_text += result['text'] + " "
            os.remove(segment)
        except Exception as e:
            print(f"Erro ao transcrever segmento de áudio: {e}")
            return jsonify({"error": f"Erro ao transcrever segmento {segment}."})

# Solicitar resumo
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Você é um assistente de análise de vídeo."},
                {"role": "user", "content": f"Resuma o conteúdo do vídeo inteiro usando uma linguagem simples. Não se esqueça de dar detalhes ao que foi falado. Especifique os assuntos e separe eles em tópicos. Se possível, destaque os sentimentos que ele pode gerar de acordo com o contexto: {transcribed_text}"}
            ]
        )
        analysis = response['choices'][0]['message']['content'].strip()
    except openai.error.OpenAIError as e:
        print(f"Erro ao chamar a API do OpenAI: {e}")
        return jsonify({"error": "Erro ao chamar OpenAI."})

# Limpar arquivos temporários
    os.remove(arquivo_video)
    os.remove(arquivo_audio)

    return jsonify({"analysis": analysis})

if __name__ == '__main__':
    app.run(debug=True)

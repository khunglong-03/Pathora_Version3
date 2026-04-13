# Voice Recording for Claude Code

Hệ thống ghi âm giọng nói → text để input vào Claude Code, chạy trực tiếp từ project root.

---

## 📦 Installation

**Lần đầu sử dụng**, cài dependencies:

```bash
# Windows PowerShell / CMD
voice.bat

# Git Bash / WSL
./voice.sh
```

Script sẽ tự động cài các package:
- `openai-whisper` - Speech-to-text (hỗ trợ tiếng Việt)
- `sounddevice` - Microphone access
- `numpy` - Audio processing
- `pyperclip` - Copy to clipboard

---

## 🚀 Usage

### Basic Usage

```bash
# Record 10 seconds (default)
voice.bat

# Record custom duration (seconds)
voice.bat 15

# Use different Whisper model (tiny/base/small/medium/large)
voice.bat 10 small
```

```bash
# Git Bash / WSL
./voice.sh
./voice.sh 20
./voice.sh 15 medium
```

### Workflow

1. **Run command** → microphone开启
2. **Speak** vào mic (ví dụ: "find all authentication handlers in the codebase")
3. **Wait** ~5-10 giây để transcription
4. **Get output**:
   - Text được in ra console
   - Tự động copy vào clipboard
   - Lưu vào temp file: `%TEMP%\claude_voice_transcript.txt`
5. **Paste** text vào Claude Code và tiếp tục!

---

## ⚙️ Configuration

### Model Sizes

| Model  | Size  | Speed | Accuracy | RAM Required |
|--------|-------|-------|----------|--------------|
| tiny   | 75MB  | ⚡⚡⚡  | Good     | ~500MB       |
| base   | 142MB | ⚡⚡    | Better   | ~1GB         |
| small  | 466MB | ⚡     | Good     | ~2GB         |
| medium | 1.5GB | 🐢    | Very Good| ~4GB         |
| large  | 2.9GB | 🐌    | Best     | ~8GB         |

**Recommend:** Dùng `tiny` hoặc `base` để nhanh. Chỉ dùng `medium/large` nếu cần accuracy cao và máy mạnh.

### Language

Mặc định: **tiếng Việt** (`language='vi'`). Để tiếng Anh, sửa file `record_and_transcribe.py` dòng 32:
```python
result = model.transcribe(audio, fp16=False, language='en')
```

---

## 🔧 Aliases (Optional)

Thêm vào PowerShell profile (`$PROFILE`) hoặc `.bashrc`:

```powershell
# PowerShell
function vc { voice.bat $args }
Set-Alias -Name vc -Value voice.bat
```

```bash
# Git Bash
alias vc='./voice.sh'
```

Sau đó dùng: `vc 15` để record 15 seconds.

---

## 🐛 Troubleshooting

### `sounddevice` lỗiPortAudio

Nếu gặp lỗi `PortAudio library not found`, cài đặt PortAudio:
- **Windows**: Download từ http://portaudio.com/archives/ hoặc dùng conda: `conda install -c anaconda portaudio`
- **macOS**: `brew install portaudio`
- **Linux**: `sudo apt-get install libportaudio2`

### Không tìm thấy microphone

Kiểm tra device:
```python
python -c "import sounddevice as sd; print(sd.query_devices())"
```

Nếu cần specify device, sửa script: `sd.rec(..., device=DEVICE_INDEX)`

### Whisper model download lần đầu

Lần đầu chạy, Whisper sẽ download model (tự động). Có thể mất vài phút tùy model size và internet speed.

Để pre-download:
```python
import whisper
whisper.load_model("tiny")  # hoặc base/small/medium/large
```

### Clipboard not working

Nếu `pyperclip` không copy được (Linux environment thiếu xclip/xsel):
```bash
# Ubuntu/Debian
sudo apt-get install xclip
# hoặc
sudo apt-get install xsel
```

---

## 📁 Files Structure

```
D:\Doan2\
├── voice.bat              ← Windows wrapper
├── voice.sh               ← Git Bash wrapper (executable)
├── .voice-tools/
│   ├── record_and_transcribe.py
│   └── requirements.txt
└── VOICE-README.md        ← File này
```

---

## 💡 Tips

- Nói rõ ràng, tốc độ vừa phải
- Tránh ồn nền
- Record ngắn (~10s) cho mỗi câu để accuracy tốt
- Dùng `tiny` model cho speed, `base` để cân bằng

---

## 🔄 Update

Cập nhật Whisper và dependencies:
```bash
pip install --upgrade openai-whisper sounddevice numpy pyperclip
```

---

**Enjoy voice input for Claude Code!** 🎤

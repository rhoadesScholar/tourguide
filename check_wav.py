import scipy.io.wavfile

sr, data = scipy.io.wavfile.read('test_output.wav')
print(f'WAV file sample rate: {sr} Hz')
print(f'Data shape: {data.shape}')
print(f'Duration: {len(data)/sr:.2f} seconds')
print(f'Data type: {data.dtype}')

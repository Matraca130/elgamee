import sys


def baixar_modelo():
    from huggingface_hub import hf_hub_download
    from huggingface_hub.errors import LocalEntryNotFoundError

    repo = "onnx-community/embeddinggemma-300m-ONNX"
    files = ("onnx/model_quantized.onnx", "onnx/model_quantized.onnx_data", "tokenizer.json")
    for filename in files:
        try:
            hf_hub_download(repo, filename, local_files_only=True, token=False)
        except LocalEntryNotFoundError:
            hf_hub_download(repo, filename, token=False)
    print("Modelo público EmbeddingGemma disponível localmente.")


def bloquear_conexao(event, _args):
    if event in ("socket.connect", "socket.getaddrinfo", "socket.gethostbyname",
                 "socket.gethostbyaddr", "socket.sendto"):
        raise PermissionError("A memória do Atlas é consultada localmente.")


if __name__ == "__main__":
    if sys.argv[1:] == ["--baixar-modelo"]:
        baixar_modelo()
    else:
        sys.addaudithook(bloquear_conexao)

        import onnxruntime

        onnxruntime.disable_telemetry_events()

        from mempalace.cli import main

        sys.exit(main())

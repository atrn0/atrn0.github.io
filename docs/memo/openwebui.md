---
title: "Open WebUI を試す"
description: ""
date: 2025-01-04T16:23:10+0900
draft: false
aliases: []
tags: []
slug: openwebui
---

# Open WebUI を試す

家に余っていたThinkpadで動かしてみる。

## 環境

```shell
$ cat /etc/os-release
NAME="Ubuntu"
VERSION="20.04.3 LTS (Focal Fossa)"
ID=ubuntu
ID_LIKE=debian
PRETTY_NAME="Ubuntu 20.04.3 LTS"
VERSION_ID="20.04"
...

$ uname -a
Linux ien20s 5.15.0-92-generic #102~20.04.1-Ubuntu SMP Mon Jan 15 13:09:14 UTC 2024 x86_64 x86_64 x86_64 GNU/Linux
```

## Open WebUI

https://github.com/open-webui/open-webui

- もともとのOllama WebUI
- クイックスタート[^1]どおりで動く
- Ollama [^2] に繋いで利用する他に、OpenAIのAPIを利用することなどもできるようになった
- Docker Composeで立てた
- `ghcr.io/open-webui/open-webui:ollama` というイメージを使用することでOllamaを同じイメージの中で立ててくれるオプションもあるが、GPUが使えなかったので別サービスとして立てた

[^1]: https://docs.openwebui.com/getting-started/quick-start/
[^2]: https://github.com/ollama/ollama


## AMD の GPU を使う

- そのままではGPUが使えない
    ```text
    INFO source=gpu.go:226 msg="looking for compatible GPUs"
    WARN source=amd_linux.go:61 msg="ollama recommends running the https://www.amd.com/en/support/linux-drivers" error="amdgpu version file missing: /sys/module/amdgpu/version stat /sys/module/amdgpu/version: no such file or directory"
    WARN source=amd_linux.go:445 msg="amdgpu detected, but no compatible rocm library found.  Either install rocm v6, or follow manual install instructions at https://github.com/ollama/ollama/blob/main/docs/linux.md#manual-install"
    WARN source=amd_linux.go:349 msg="unable to verify rocm library: no suitable rocm found, falling back to CPU"
    INFO source=gpu.go:392 msg="no compatible GPUs were discovered"
    ```
- `amdgpu version file missing`
    - GPUがAMD ROCm ライブラリで対応していないバージョンの場合、HSA_OVERRIDE_GFX_VERSION で近いバージョンを指定すると動くことがある [^3] 
    - gfx\<数字\> というフォーマットのバージョンから指定
        - これはAMD GPUのアーキテクチャ、ISA的なものらしい [^4]
- AMD Ryzen 5 5500U はどうやら Radeon RX Vega 7 というモデルのiGPUらしい [^5]
    - Vega 7についての情報はあまり得られなかったが、LLVMのページ [^6] によるとおそらくgfx900っぽい
    - Docker Composeの内部でホストのGPUを利用するには、/dev/kfdと/dev/driをボリュームマウントする [^7]
    - ollamaにはROCmが入ったバージョンのimage [^8] が用意されているので、イメージはそれを指定
    - Ollama起動時にGPUが認識されるようになる
        ```
        INFO source=gpu.go:226 msg="looking for compatible GPUs"
        WARN source=amd_linux.go:61 msg="ollama recommends running the https://www.amd.com/en/support/linux-drivers" error="amdgpu version file missing: /sys/module/amdgpu/version stat /sys/module/amdgpu/version: no such file or directory"
        INFO source=amd_linux.go:391 msg="skipping rocm gfx compatibility check" HSA_OVERRIDE_GFX_VERSION=9.0.0
        INFO source=types.go:131 msg="inference compute" id=0 library=rocm variant="" compute=gfx902 driver=0.0 name=1002:164c total="1.0 GiB" available="945.9 MiB"
        ```
        
[^3]: https://github.com/ollama/ollama/blob/main/docs/gpu.md#overrides-on-linux
[^4]: https://www.coelacanth-dream.com/posts/2020/06/22/amdgpu-gpuid-mean/
[^5]: https://www.notebookcheck.net/AMD-Ryzen-5-5500U-Processor-Benchmarks-and-Specs.510988.0.html
[^6]: https://llvm.org/docs/AMDGPUUsage.html#:~:text=TBA-,GCN%20GFX9%20(Vega),-%5BAMD%2DGCN%2DGFX900
[^7]: https://github.com/open-webui/open-webui/blob/4bc9904b3cd0726d3f9c3cbaeade972cf167b6c4/docker-compose.amdgpu.yaml
[^8]: https://hub.docker.com/layers/ollama/ollama/rocm/images/sha256-1520cd180d3b1fa2a23c8883852b70586e1893d541b7a10f2745982dcd9b6a6d
    

## compose.yaml

こんな感じ
    
```yaml
services:
    ollama:
    image: ollama/ollama:rocm
    devices:
        - /dev/kfd:/dev/kfd
        - /dev/dri:/dev/dri
    volumes:
        - ollama:/root/.ollama
    environment:
        - HSA_OVERRIDE_GFX_VERSION=9.0.0
openwebui:
    image: ghcr.io/open-webui/open-webui:main
    volumes:
        - open-webui:/app/backend/data
    environment:
        - PORT=8080
        - OLLAMA_BASE_URL=http://localhost:11434
volumes:
    open-webui:
    ollama:
```
    
## Llama を動かす

- https://www.llama.com/
- llama3.3 は70Bのモデルで、今回の環境ではかなり出力に時間がかかる模様
- llama3.2 は1B, 3Bのライトなモデルがあり、こちらなら数秒で答えが返ってくる
    - https://ollama.com/library/llama3.2
- 以下のようなコマンドでモデルを pull
```shell
docker compose exec -it ollama ollama pull llama3.2:latest
```
        
## あとがき

- NvidiaだとDocker Composeの機能でGPUをアタッチするシンタックスがサポートされており、楽っぽい
    - https://docs.docker.jp/compose/gpu-support.html
- GPUが欲しくなった

## 参考

- https://zenn.dev/karaage0703/articles/c271ca65b91bdb
- https://www.notebookcheck.net/AMD-Ryzen-5-5500U-Processor-Benchmarks-and-Specs.510988.0.html

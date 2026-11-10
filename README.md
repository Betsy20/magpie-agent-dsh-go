# magpie-agent-dsh-go

把 [DSH Go](https://github.com/ccch1mneyyy/dsh-Go)（DeepSeek Harness 的 Android 客户端）加到 [magpie](https://github.com/yetone/magpie) 的 **Agent 页**。

装上之后，magpie 的侧边栏会出现 **使用 → Agent**，里面有一行 **DSH Go**。给它选一个 magpie 的模型，magpie 就把网关地址和这个 Agent 专属的 key 写进 DSH 的配置，DSH 的模型请求走 magpie 的网关。

```
┌─ DSH Go（Android 客户端）──────────────┐
│  DSH 引擎（PRoot Linux 里）            │
│    └─ 模型请求 ──> magpie 网关          │
└────────────────────────────────────────┘
                        │
              ┌─────────┴──────────┐
              │ 你配的 provider     │
              │ DeepSeek / Kimi …  │
              └────────────────────┘
```

## 安装

```sh
magpie plugin add magpie-agent-dsh-go
```

或者从本地文件夹（开发时用）：

```sh
magpie plugin add ./magpie-agent-dsh-go
```

装好后打开 magpie 的 **Agent** 页，找到 **DSH Go** 那一行，打开开关、选一个模型。

## 它写什么

magpie 会写 `~/.dsh/magpie-agent.yml`（`$DSH_HOME` 展开后）：

```yaml
providers:
  magpie:
    displayName: magpie
    api: openai-completions
    apiKeyEnv: MAGPIE_API_KEY
    baseURL: http://127.0.0.1:3425/v1
    apiKey: <magpie 给这个 Agent 的 key>
models:
  - provider: magpie
    id: deepseek/deepseek-chat
    name: DeepSeek Chat
```

## 为什么是「抄过去」而不是「直接生效」

DSH 的配置在 **PRoot rootfs 里的 `~/.dsh/`**，而 rootfs 在 DSH Go 的**私有目录**（`/data/user/0/io.github.ccch1mneyyy.dsh_app/files/`）。

magpie 是另一个 App —— Android 的沙箱让普通 App 读不到别人的私有目录。所以：

| 设备 | 行为 |
| --- | --- |
| **有 root** | magpie 用 `su` 直接写进 DSH Go 的 rootfs，**全程自动** |
| **没 root** | 写到 `/sdcard/Download/magpie-dsh-go/magpie-agent.yml`，你在 DSH Go 的模型设置里按它填 |

## 为什么不用 `model` 字段

magpie 的 Agent 插件可以用 `model` 声明「配置文件里某个键 = 模型」。但 DSH 的配置是一张 **YAML patch 列表**：

```yaml
- id: llm-pi-ai
  config:
    providers: {...}
```

不是单键，点分路径到不了数组里的 `[0].config.providers`。所以这一行**只做连接**，具体模型在 DSH Go 里选。

## 为什么配置文件叫 `magpie-agent.yml`

不用 `config.yaml` 或 `profiles/web/cordis.patch.yml` —— 那是 magpie 内置的 dsh 支持（`internal/agent/dsh.go` 的 `dshBeforeProfiles`）用来判断「这个 dsh 是 profiles 之前的版本」的，占用那些名字会误导那套逻辑。

## 已知限制

- **DSH Go 只有 arm64 包**，x86_64 设备和模拟器装不了。
- **非 root 设备上不算「自动」**，只是把配置放到一个方便找到的地方。
- **DSH Go 的版本会变**，rootfs 的子目录名（`ubuntu` / `rootfs` / `distro`）没有稳定约定，插件用 `find` 扫。

## 开发

插件是**纯 ESM，无依赖**。magpie 用自己的 moejs 引擎加载 Agent 插件（不是 Bun），所以不需要 `npm install`，也没有构建步骤。

```sh
# 在 magpie 的沙箱里试
magpie plugin add ./magpie-agent-dsh-go
magpie plugin            # 应该列出 magpie-agent-dsh-go  on
```

改了 `agent.js` 之后，在 magpie 里把插件**关掉再打开**（或重开 magpie）就会重新加载。

## 许可证

MIT，见 [LICENSE](LICENSE)。

DSH Go 是 [ccch1mneyyy](https://github.com/ccch1mneyyy) 的项目，以 AGPL-3.0 发布。本插件只是它的 magpie 适配层，不含 DSH Go 的任何代码。

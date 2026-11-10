// DSH Go 的 magpie Agent 插件。
//
// ## 它解决什么
//
// DSH Go 是 DeepSeek Harness 的 Android 客户端，DSH 引擎跑在它内置的
// PRoot Linux 环境里，模型配置在 `$DSH_HOME`（默认 `~/.dsh`）。magpie
// 的 Agent 页本来就能管 dsh —— 但那要求 magpie 和 dsh 有同一个 `~`。
//
// 这里把 DSH Go 作为独立的一行加进 Agent 页：magpie 给这一行分配一个
// 网关 key、一个以 `/v1` 结尾的地址，写进 `~/.dsh/magpie-agent.yml`。
// 用户把那个文件的内容抄进 DSH Go 的模型设置即可（见 README）。
//
// ## 为什么不用 `model` 字段
//
// `model` 表达的是"配置文件里某个键 = 模型"，而 DSH 的配置是一张
// YAML patch 列表（`[{id: "llm-pi-ai", config: {providers: {…}}}]`），
// 不是单键，点分路径到不了。所以这一行只做连接，模型在 DSH Go 里选。
//
// ## 为什么文件叫 magpie-agent.yml
//
// 不用 `config.yaml` 或 `profiles/web/cordis.patch.yml`：那是 magpie
// 内置 dsh 支持（internal/agent/dsh.go 的 dshBeforeProfiles）用来判断
// "这个 dsh 是 profiles 之前的版本"的，动它会误导那套逻辑。

export const agent = {
  id: "dsh-go",
  name: "DSH Go",
  // DSH 的 CLI 名。PATH 上没有它时这一行显示"未安装"，
  // 但 DSH Go 是 app 不是 CLI —— 所以这里额外给了 `dir` 作为存在依据。
  bin: "dsh",
  dir: "~/.dsh",
  // 这一行写到的文件。DSH 读它自己的配置，这个文件是给用户抄的。
  config: "~/.dsh/magpie-agent.yml",
  format: "yaml",
  notice:
    "把 ~/.dsh/magpie-agent.yml 里的 baseURL 和 key 填进 DSH Go 的模型设置；" +
    "改了要重开 DSH Go 才生效。",
  // 请求没带 key 时，用量里靠它认出是 DSH Go 发的。
  ua: ["dsh-go", "deepseek-harness"],
}

// connect 在用户打开这一行的开关时调用，返回要写进 config 的键。
//
// 键是 DSH 的模型设置形状：一个 OpenAI 兼容的 provider 叫 magpie。
// 用户照抄时，baseURL 和 apiKey 就是要填的两项。
export function connect({ gateway, model, models }) {
  const list = models && models.length ? models : model ? [model] : []
  return {
    // DSH 的 provider 表。magpie 这一项和用户自己的 provider 并列。
    providers: {
      magpie: {
        displayName: "magpie",
        // DSH 从环境变量读 key，避免把它写进配置文件的明文里。
        apiKeyEnv: "MAGPIE_API_KEY",
        // OpenAI 兼容的 chat completions。
        api: "openai-completions",
        // gateway.v1 以 /v1 结尾，正是 OpenAI 兼容 API 的基地址。
        baseURL: gateway.v1,
      },
    },
    // magpie 给这一行开放的模型，抄进 DSH 的模型列表。
    models: list.map((m) => ({
      provider: "magpie",
      id: m.id,
      name: m.name || m.id,
      ...(m.context ? { contextWindow: m.context } : {}),
      ...(m.output ? { maxTokens: m.output } : {}),
    })),
  }
}

import Script from "next/script";

import DocShell from "../_components/doc-shell";

function normalizeLang(value) {
  return value === "zh" ? "zh" : "en";
}

function buildMetadata(lang) {
  const zh = lang === "zh";
  const title = zh ? "MCP 协议说明 | AI Skills Hub" : "MCP Protocol Guide | AI Skills Hub";
  const description = zh
    ? "了解 MCP（Model Context Protocol）的架构、价值、安全模型与落地路径。"
    : "Understand Model Context Protocol (MCP): architecture, benefits, security model, and practical integration patterns for AI applications.";
  const keywords = zh
    ? "MCP, 模型上下文协议, AI工具协议, LLM集成"
    : "MCP, Model Context Protocol, AI tooling protocol, LLM integration";

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `https://www.ai-skills.xyz/mcp-protocol.html?lang=${lang}`,
      languages: {
        en: "https://www.ai-skills.xyz/mcp-protocol.html?lang=en",
        "zh-CN": "https://www.ai-skills.xyz/mcp-protocol.html?lang=zh",
        "x-default": "https://www.ai-skills.xyz/mcp-protocol.html?lang=en",
      },
    },
    openGraph: {
      type: "article",
      title,
      description: zh
        ? "了解 MCP 的架构、价值、安全模型与落地路径。"
        : "A practical introduction to MCP based on industry explainers and official protocol documentation.",
      url: `https://www.ai-skills.xyz/mcp-protocol.html?lang=${lang}`,
      images: ["/assets/logo.svg"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: zh
        ? "了解 MCP 的架构、价值、安全模型与落地路径。"
        : "Learn what MCP solves, how it works, and how to adopt it in production systems.",
      images: ["/assets/logo.svg"],
    },
  };
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  return buildMetadata(normalizeLang(params?.lang));
}

function Section({ title, children }) {
  return (
    <section className="doc-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default async function McpProtocolPage({ searchParams }) {
  const params = await searchParams;
  const lang = normalizeLang(params?.lang);
  const isZh = lang === "zh";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: isZh ? "MCP 协议说明" : "Model Context Protocol (MCP) Introduction",
    description: isZh
      ? "了解 MCP 的架构、价值、安全模型与落地路径。"
      : "What MCP is, why it matters, and how to integrate it in AI apps.",
    url: `https://www.ai-skills.xyz/mcp-protocol.html?lang=${lang}`,
    author: { "@type": "Organization", name: "AI Skills Hub" },
    publisher: { "@type": "Organization", name: "AI Skills Hub" },
  };

  return (
    <>
      <Script id="mcp-protocol-jsonld" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(jsonLd)}
      </Script>
      <DocShell
        lang={lang}
        eyebrow="AI Skills Hub"
        brandName={isZh ? "MCP 协议说明" : "MCP Protocol Guide"}
        title={isZh ? "什么是 MCP（Model Context Protocol）" : "Model Context Protocol (MCP), Explained"}
        subtitle={
          isZh
            ? "基于行业介绍文章与官方文档，MCP 是一个标准协议，让 AI 助手可以用统一方式连接外部工具与数据。"
            : "Based on industry explainers and official documentation, MCP is a standard protocol that lets AI assistants connect to external tools and data in a consistent way."
        }
        actions={[
          { label: isZh ? "返回首页" : "Back to Home", href: "/" },
          { label: isZh ? "Skills 原理页" : "Skills Mechanism", href: "/skills-mechanism.html" },
        ]}
      >
        {isZh ? (
          <>
            <Section title="为什么需要 MCP">
              <ul>
                <li>没有 MCP 时，AI 应用与每个工具通常都要单独开发对接逻辑。</li>
                <li>MCP 提供统一接口，让客户端用同一种方式对接多种工具服务器。</li>
                <li>可降低集成成本、提升可移植性，并加速生态扩展。</li>
              </ul>
            </Section>
            <Section title="MCP 架构（概念版）">
              <ol>
                <li><strong>Host / Client</strong>：AI 应用或智能体运行环境。</li>
                <li><strong>MCP Server</strong>：按 MCP 标准暴露工具、资源和提示模板。</li>
                <li><strong>外部系统</strong>：SaaS API、内部服务、文件、数据库等。</li>
              </ol>
              <p className="doc-note">可以把 MCP 理解为 AI 工具体系里的统一接口标准。</p>
            </Section>
            <Section title="核心能力">
              <ul>
                <li><strong>Tools</strong>：可调用操作，如创建工单、执行查询。</li>
                <li><strong>Resources</strong>：模型可读取的结构化上下文数据。</li>
                <li><strong>Prompts</strong>：由服务器提供的可复用提示模板。</li>
              </ul>
            </Section>
            <Section title="安全模型（实务）">
              <ul>
                <li>模型运行时与外部系统之间有明确权限边界。</li>
                <li>服务器端可统一做鉴权、范围控制、审计日志和限流。</li>
                <li>相比临时拼接式对接，协议化契约更可追踪、可治理。</li>
              </ul>
            </Section>
            <Section title="落地路径">
              <ol>
                <li>先选一个小场景试点，如 issue 系统或文档检索。</li>
                <li>把后端能力封装成 MCP server，并定义清晰工具契约。</li>
                <li>上线前补齐鉴权与审计日志。</li>
                <li>根据真实提示词迭代工具定义与返回格式。</li>
              </ol>
            </Section>
            <Section title="参考资料">
              <ul>
                <li><a href="https://stytch.com/blog/model-context-protocol-introduction/" target="_blank" rel="noreferrer">Stytch: Model Context Protocol Introduction</a></li>
                <li><a href="https://modelcontextprotocol.io/introduction" target="_blank" rel="noreferrer">MCP 官方文档：Introduction</a></li>
              </ul>
            </Section>
          </>
        ) : (
          <>
            <Section title="Why MCP Exists">
              <ul>
                <li>Without MCP, each AI app and each tool connector usually needs custom integration code.</li>
                <li>MCP defines a shared interface so clients can talk to many tools and servers the same way.</li>
                <li>This reduces integration cost, improves portability, and speeds up ecosystem growth.</li>
              </ul>
            </Section>
            <Section title="MCP Architecture (Conceptual)">
              <ol>
                <li><strong>Host / Client</strong>: the AI app or assistant runtime.</li>
                <li><strong>MCP Server</strong>: exposes tools, resources, and prompts in MCP format.</li>
                <li><strong>External Systems</strong>: SaaS APIs, internal services, files, databases.</li>
              </ol>
              <p className="doc-note">Think of MCP as USB-C for AI tools: one protocol, many compatible integrations.</p>
            </Section>
            <Section title="Core Capabilities">
              <ul>
                <li><strong>Tools</strong>: callable operations such as create ticket or run query.</li>
                <li><strong>Resources</strong>: structured context and data the model can consume.</li>
                <li><strong>Prompts</strong>: reusable prompt templates exposed by the server.</li>
              </ul>
            </Section>
            <Section title="Security Model (Practical)">
              <ul>
                <li>Explicit permission boundaries between model runtime and external systems.</li>
                <li>Server-side policy controls for auth, scope, logging, and rate limits.</li>
                <li>Safer than ad-hoc direct tool wiring because contracts are explicit and auditable.</li>
              </ul>
            </Section>
            <Section title="Adoption Path">
              <ol>
                <li>Start with one narrow use case, such as issue tracking or docs retrieval.</li>
                <li>Wrap the backend capability in an MCP server with a clear tool contract.</li>
                <li>Add authentication and audit logs before broader rollout.</li>
                <li>Iterate tool definitions based on real production prompts.</li>
              </ol>
            </Section>
            <Section title="References">
              <ul>
                <li><a href="https://stytch.com/blog/model-context-protocol-introduction/" target="_blank" rel="noreferrer">Stytch: Model Context Protocol Introduction</a></li>
                <li><a href="https://modelcontextprotocol.io/introduction" target="_blank" rel="noreferrer">Official MCP docs: Introduction</a></li>
              </ul>
            </Section>
          </>
        )}
      </DocShell>
    </>
  );
}

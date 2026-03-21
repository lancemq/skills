import Script from "next/script";

import DocShell from "../_components/doc-shell";

function normalizeLang(value) {
  return value === "zh" ? "zh" : "en";
}

function buildMetadata(lang) {
  const zh = lang === "zh";
  const title = zh ? "Skills 原理与作用 | AI Skills Hub" : "How AI Skills Work | AI Skills Hub";
  const description = zh
    ? "了解 AI Skills 的机制原理、安装与使用方式，以及在实际工作流中的作用。"
    : "Understand what AI skills are, how they work, and why they improve consistency, speed, and quality in real workflows.";
  const keywords = zh
    ? "AI技能原理, 智能体技能, 工作流技能, Codex技能"
    : "AI skills mechanism, agent skills, workflow skills, Codex skills";

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `https://www.ai-skills.xyz/skills-mechanism.html?lang=${lang}`,
      languages: {
        en: "https://www.ai-skills.xyz/skills-mechanism.html?lang=en",
        "zh-CN": "https://www.ai-skills.xyz/skills-mechanism.html?lang=zh",
        "x-default": "https://www.ai-skills.xyz/skills-mechanism.html?lang=en",
      },
    },
    openGraph: {
      type: "article",
      title,
      description: zh
        ? "了解 AI Skills 的机制、安装、使用方法与质量控制要点。"
        : "Understand how AI skills are designed, installed, and used in reliable production workflows.",
      url: `https://www.ai-skills.xyz/skills-mechanism.html?lang=${lang}`,
      images: ["/assets/logo.svg"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: zh
        ? "一份可落地的 Skills 使用与优化实践指南。"
        : "A practical guide to skill mechanism, installation patterns, and execution quality controls.",
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

export default async function SkillsMechanismPage({ searchParams }) {
  const params = await searchParams;
  const lang = normalizeLang(params?.lang);
  const isZh = lang === "zh";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: isZh ? "Skills 原理与作用" : "How AI Skills Work",
    description: isZh
      ? "了解 AI Skills 的机制原理、安装与使用方式，以及在实际工作流中的作用。"
      : "Practical guide to AI skills mechanism, installation, usage, and quality controls.",
    url: `https://www.ai-skills.xyz/skills-mechanism.html?lang=${lang}`,
    author: { "@type": "Organization", name: "AI Skills Hub" },
    publisher: { "@type": "Organization", name: "AI Skills Hub" },
  };

  return (
    <>
      <Script id="skills-mechanism-jsonld" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(jsonLd)}
      </Script>
      <DocShell
        lang={lang}
        eyebrow="AI Skills Hub"
        brandName={isZh ? "Skills 原理说明" : "Skills Mechanism Guide"}
        title={isZh ? "什么是 AI Skill，它解决什么问题" : "What Is an AI Skill, and Why It Matters"}
        subtitle={
          isZh
            ? "Skill 是给 AI 智能体复用的一组能力包，通常包含指令、上下文约束和执行流程，让智能体在同类任务中更稳定地输出结果。"
            : "A skill is a reusable capability package for AI agents. It combines instruction, context, and execution patterns, so the agent can reliably perform a class of tasks."
        }
        actions={[
          { label: isZh ? "返回首页" : "Back to Home", href: "/" },
        ]}
      >
        {isZh ? (
          <>
            <Section title="Skills 的机制原理">
              <ul>
                <li>任务触发：当用户请求命中某个能力域时触发。</li>
                <li>规则加载：智能体读取该 Skill 的规则、步骤和模板。</li>
                <li>上下文绑定：把项目文件、用户约束、运行环境信息绑定到执行过程。</li>
                <li>流程化执行：按预定义顺序完成分析、生成、检查等步骤。</li>
                <li>结果校验：按质量标准验证输出，再返回给用户。</li>
              </ul>
            </Section>
            <Section title="Skills 的作用">
              <ul>
                <li>减少重复提示词编写和初始化成本。</li>
                <li>提升同类任务输出的一致性和可控性。</li>
                <li>沉淀最佳实践，便于团队规模化复用。</li>
                <li>降低新人上手门槛，缩短协作磨合周期。</li>
                <li>把复杂任务模块化，加快迭代速度。</li>
              </ul>
            </Section>
            <Section title="一个 Skill 通常包含">
              <ul>
                <li>角色定义：这个 Skill 负责什么。</li>
                <li>执行清单：按顺序执行的步骤和判断条件。</li>
                <li>约束条件：安全、风格、规范等限制。</li>
                <li>输出格式：结果应采用的结构和字段。</li>
                <li>参考资源：可调用的数据源、工具或模板。</li>
              </ul>
            </Section>
            <Section title="Skills 如何安装（实操步骤）">
              <ul>
                <li>获取包含 `SKILL.md` 的技能包。</li>
                <li>将其放入本地 skills 目录，Codex 常见为 `$CODEX_HOME/skills/...`。</li>
                <li>保持目录名稳定，很多系统会把目录名作为 skill 标识。</li>
                <li>若包含 `scripts/`、`assets/`、`references/`，请保持相对路径不变。</li>
                <li>如运行时有缓存，重启会话后再验证技能是否可被发现。</li>
              </ul>
            </Section>
            <Section title="Skills 如何使用（工作流方式）">
              <ul>
                <li>显式调用：在提示词里直接写 skill 名称，例如 `$vercel-deploy`。</li>
                <li>隐式触发：描述与 skill 强相关任务，例如“把项目部署到 Vercel”。</li>
                <li>补全上下文：提供仓库路径、目标平台、约束条件、输出格式。</li>
                <li>结果校验：检查链接、日志、测试结果、异常分支。</li>
                <li>二次迭代：若结果接近但不完整，明确指出缺口并要求二次执行。</li>
              </ul>
            </Section>
            <Section title="详细示例">
              <p><strong>示例 1：使用 Skill 完成部署</strong></p>
              <p>提示词：</p>
              <pre><code>{`使用 $vercel-deploy 部署当前仓库，并返回生产环境 URL。
仓库路径：/Users/maqi/code/skills
要求：验证首页可访问，并给出最终链接。`}</code></pre>
              <p>期望产出：</p>
              <ul>
                <li>可访问的部署 URL。</li>
                <li>关键校验信息，含状态码和核心页面检查结果。</li>
                <li>若缺少环境变量，给出后续处理项。</li>
              </ul>
              <p><strong>示例 2：给团队新增一个可复用 Skill</strong></p>
              <p>提示词：</p>
              <pre><code>{`使用 $skill-creator 新建一个 "seo-audit" skill。
要求包含：检查清单、输出模板、风险边界。
目标场景：静态网站与文档站。`}</code></pre>
              <p>期望产出：</p>
              <ul>
                <li>新增 skill 目录和 `SKILL.md` 文件。</li>
                <li>可复用的 SEO 审核流程。</li>
                <li>结构化报告输出格式。</li>
              </ul>
            </Section>
            <Section title="常见失败模式（及修复建议）">
              <ul>
                <li>目标不清：把宽泛任务拆成可衡量的子目标。</li>
                <li>约束缺失：明确时限、质量标准和输出格式。</li>
                <li>缺少验收：在交付前先定义通过/失败规则。</li>
                <li>指令过泛：补充技术栈、用户场景和风险等级。</li>
                <li>没有反馈回路：低置信度结果必须二次迭代。</li>
              </ul>
            </Section>
            <Section title="可复用执行模板">
              <pre><code>{`目标：
- 需要达成的结果是什么？

上下文：
- 仓库/文件：
- 业务/产品背景：

约束：
- 截止时间：
- 风险/合规：
- 输出格式要求：

验收：
- 什么检查才算完成？
- 需要返回哪些证据？`}</code></pre>
              <p style={{ marginTop: 8 }}>
                如果你需要协议级工具互操作，可继续阅读{" "}
                <a href={`/mcp-protocol.html?lang=${lang}`}>MCP 说明页</a>。
              </p>
            </Section>
          </>
        ) : (
          <>
            <Section title="How Skills Work (Mechanism)">
              <ul>
                <li>Task trigger: a user request matches a known skill domain.</li>
                <li>Instruction loading: the agent loads the skill instructions, rules, and templates.</li>
                <li>Context binding: project files, user constraints, and current environment are injected into execution.</li>
                <li>Structured execution: the agent follows the skill workflow in a deterministic order.</li>
                <li>Output validation: results are checked against quality rules before delivery.</li>
              </ul>
            </Section>
            <Section title="What Skills Actually Do">
              <ul>
                <li>Reduce repeated prompting and setup work.</li>
                <li>Improve output consistency across similar tasks.</li>
                <li>Encode best practices so teams can scale quality.</li>
                <li>Lower onboarding cost for new contributors.</li>
                <li>Enable faster iteration with reusable task modules.</li>
              </ul>
            </Section>
            <Section title="Typical Skill Components">
              <ul>
                <li>Role definition: what the skill is responsible for.</li>
                <li>Execution checklist: ordered steps and decision gates.</li>
                <li>Constraints: safety, style, or policy requirements.</li>
                <li>Output format: expected structure for final results.</li>
                <li>References: related data sources, tools, or templates.</li>
              </ul>
            </Section>
            <Section title="How to Install Skills (Practical Steps)">
              <ul>
                <li>Get a skill package that contains a `SKILL.md` file.</li>
                <li>Place it in your local skills directory, often under `$CODEX_HOME/skills/...`.</li>
                <li>Keep the folder name stable because it is often used as the skill id.</li>
                <li>If the skill includes `scripts/`, `assets/`, or `references/`, keep relative paths unchanged.</li>
                <li>Restart your client or session if the runtime caches skill discovery.</li>
              </ul>
            </Section>
            <Section title="How to Use Skills in Real Work">
              <ul>
                <li>Invoke directly: mention the skill name in prompt, for example `$vercel-deploy`.</li>
                <li>Auto-trigger: request a task that matches the skill domain.</li>
                <li>Pass context: provide repo path, target platform, constraints, and expected output format.</li>
                <li>Validate output: check links, logs, tests, and edge cases before production use.</li>
                <li>Iterate: if output is close but not complete, ask for a second pass with explicit gaps.</li>
              </ul>
            </Section>
            <Section title="Detailed Examples">
              <p><strong>Example 1: Deploy Website with a Skill</strong></p>
              <p>Prompt:</p>
              <pre><code>{`Use $vercel-deploy to deploy this repository and return the production URL.
Repository path: /Users/maqi/code/skills
Requirements: verify homepage works and provide final URL.`}</code></pre>
              <p>Expected result:</p>
              <ul>
                <li>A successful deployment URL.</li>
                <li>Validation output including status code and key route checks.</li>
                <li>Any follow-up actions if environment variables are missing.</li>
              </ul>
              <p><strong>Example 2: Extend a Skill Set for a Team</strong></p>
              <p>Prompt:</p>
              <pre><code>{`Use $skill-creator to create a new "seo-audit" skill.
Include: checklist, output template, and risk guardrails.
Target: static websites and docs portals.`}</code></pre>
              <p>Expected result:</p>
              <ul>
                <li>A new skill folder with `SKILL.md`.</li>
                <li>Reusable workflow for repeated SEO checks.</li>
                <li>Clear output schema for reports.</li>
              </ul>
            </Section>
            <Section title="Common Failure Modes (And Fixes)">
              <ul>
                <li>Ambiguous objective: split one broad request into measurable sub-goals.</li>
                <li>Missing constraints: always provide deadline, quality bar, and output format.</li>
                <li>No validation step: add explicit pass/fail checks before final delivery.</li>
                <li>Overly generic instructions: include domain context such as stack and risk level.</li>
                <li>No feedback loop: require second-pass refinement when confidence is low.</li>
              </ul>
            </Section>
            <Section title="Execution Template You Can Reuse">
              <pre><code>{`Goal:
- What outcome is needed?

Context:
- Repo/files:
- Product/domain:

Constraints:
- Deadline:
- Risk/compliance:
- Format requirements:

Validation:
- What checks define "done"?
- What evidence should be returned?`}</code></pre>
              <p style={{ marginTop: 8 }}>
                Need protocol-level tool interoperability? See{" "}
                <a href={`/mcp-protocol.html?lang=${lang}`}>MCP Guide</a>.
              </p>
            </Section>
          </>
        )}
      </DocShell>
    </>
  );
}

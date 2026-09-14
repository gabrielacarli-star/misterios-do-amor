import { useEffect, useState, type FormEvent, type ReactNode } from "react";

type Step = "intro" | "perfil" | "tema" | "intencao" | "mensagem" | "revisao" | "resultado";

const QUIZ_STEPS: Step[] = ["intro", "perfil", "tema", "intencao", "mensagem", "revisao", "resultado"];

const STEP_COPY: Record<Exclude<Step, "intro" | "resultado">, { label: string; title: string; text: string }> = {
  perfil: {
    label: "Etapa 1",
    title: "Vamos conhecer sua intenção",
    text: "Escolha uma referência fictícia para avançar neste exemplo visual.",
  },
  tema: {
    label: "Etapa 2",
    title: "Qual caminho deseja explorar?",
    text: "As opções existem apenas para demonstrar cartões de seleção.",
  },
  intencao: {
    label: "Etapa 3",
    title: "Defina o foco da experiência",
    text: "Nenhuma escolha é armazenada ou enviada para fora desta página.",
  },
  mensagem: {
    label: "Etapa 4",
    title: "Escreva uma anotação demonstrativa",
    text: "O conteúdo permanece em memória até a página ser atualizada.",
  },
  revisao: {
    label: "Etapa 5",
    title: "Tudo pronto para concluir",
    text: "Este é apenas o encerramento visual do fluxo local.",
  },
};

function usePath() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return path;
}

function go(to: string) {
  if (window.location.pathname === to) return;
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function LocalLink({ to, children, className = "" }: { to: string; children: ReactNode; className?: string }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        go(to);
      }}
    >
      {children}
    </a>
  );
}

function Brand() {
  return (
    <div className="brand" aria-label="Experiência Guiada">
      <span className="brand-mark" aria-hidden="true">✦</span>
      <span>Experiência Guiada</span>
    </div>
  );
}

function PageShell({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <main className={compact ? "app-shell compact" : "app-shell"}>
      <header className="site-header">
        <LocalLink to="/" className="brand-link"><Brand /></LocalLink>
        <span className="demo-badge">Template demonstrativo</span>
      </header>
      {children}
      <Footer />
    </main>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <span>Estrutura visual editável</span>
      <nav aria-label="Links institucionais">
        <LocalLink to="/privacidade">Privacidade</LocalLink>
        <LocalLink to="/termos">Termos</LocalLink>
      </nav>
    </footer>
  );
}

function AmbientVisual({ variant = "gold" }: { variant?: "gold" | "violet" | "mint" }) {
  return (
    <div className={`ambient ambient-${variant}`} aria-hidden="true">
      <span className="orb orb-a" />
      <span className="orb orb-b" />
      <span className="orb orb-c" />
      <span className="ambient-card">✦</span>
    </div>
  );
}

function Quiz() {
  const [step, setStep] = useState<Step>("intro");
  const [choice, setChoice] = useState("");
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");
  const index = QUIZ_STEPS.indexOf(step);
  const next = () => setStep(QUIZ_STEPS[Math.min(index + 1, QUIZ_STEPS.length - 1)]);
  const previous = () => setStep(QUIZ_STEPS[Math.max(index - 1, 0)]);

  if (step === "intro") {
    return (
      <PageShell compact>
        <section className="hero quiz-hero">
          <div className="hero-copy">
            <p className="eyebrow">Uma jornada visual</p>
            <h1>Descubra uma experiência feita para o seu momento</h1>
            <p className="lead">Um fluxo local, leve e personalizável para apresentar ideias, produtos ou serviços com uma narrativa guiada.</p>
            <div className="trust-row"><span>✓ Sem cadastro</span><span>✓ Sem envio de dados</span><span>✓ 100% demonstrativo</span></div>
            <button type="button" className="primary-button" onClick={next}>Começar experiência <span>→</span></button>
          </div>
          <AmbientVisual />
        </section>
        <section className="feature-grid">
          {[["01", "Fluxo guiado", "Etapas curtas e objetivas para conduzir a atenção."], ["02", "Visual acolhedor", "Cartões, cores e ritmo pensados para mobile."], ["03", "Pronto para editar", "Altere textos, cores e blocos para o seu projeto."]].map(([number, title, text]) => (
            <article className="feature-card" key={number}><span>{number}</span><h2>{title}</h2><p>{text}</p></article>
          ))}
        </section>
      </PageShell>
    );
  }

  if (step === "resultado") {
    return (
      <PageShell compact>
        <section className="result-card">
          <div className="result-icon">✦</div>
          <p className="eyebrow">Experiência concluída</p>
          <h1>Seu percurso visual está pronto</h1>
          <p>Esta tela encerra a demonstração sem criar cadastro, pedido, cobrança ou comunicação externa.</p>
          <div className="result-summary"><span>Referência: {choice || "não selecionada"}</span><span>Tema: {topic || "não selecionado"}</span></div>
          <button type="button" className="primary-button" onClick={() => setStep("intro")}>Reiniciar demonstração</button>
        </section>
      </PageShell>
    );
  }

  const copy = STEP_COPY[step];
  const canContinue = step === "mensagem" || step === "revisao" || Boolean(choice || topic);
  return (
    <PageShell compact>
      <section className="quiz-panel">
        <div className="progress-wrap">
          <button type="button" className="back-button" onClick={previous} aria-label="Voltar">‹</button>
          <div className="progress-text"><span>{copy.label}</span><strong>{index} de {QUIZ_STEPS.length - 2}</strong></div>
          <div className="progress-bar"><span style={{ width: `${(index / (QUIZ_STEPS.length - 2)) * 100}%` }} /></div>
        </div>
        <div className="question-content">
          <p className="eyebrow">{copy.label}</p>
          <h1>{copy.title}</h1>
          <p className="lead small">{copy.text}</p>
          {step === "perfil" && <OptionList value={choice} onChange={setChoice} options={["Projeto pessoal", "Pequeno negócio", "Portfólio criativo", "Outro cenário"]} />}
          {step === "tema" && <OptionList value={topic} onChange={setTopic} options={["Lançamento de ideia", "História da marca", "Convite especial", "Apresentação de serviço"]} icons={["✦", "◌", "⌁", "◇"]} />}
          {step === "intencao" && <div className="intent-grid">{["Clareza", "Conexão", "Descoberta", "Organização"].map((item) => <button className="intent-card" type="button" key={item} onClick={() => setTopic(item)} data-selected={topic === item}><span>✦</span>{item}</button>)}</div>}
          {step === "mensagem" && <label className="text-field"><span>Anotação opcional</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Escreva uma frase para visualizar este campo..." rows={5} /></label>}
          {step === "revisao" && <div className="review-card"><span className="review-icon">✓</span><div><strong>Visual pronto para concluir</strong><p>As escolhas ficam somente nesta sessão da página e desaparecem ao recarregar.</p></div></div>}
          <button type="button" className="primary-button" onClick={next} disabled={!canContinue}>{step === "revisao" ? "Concluir demonstração" : "Continuar"} <span>→</span></button>
        </div>
      </section>
    </PageShell>
  );
}

function OptionList({ value, onChange, options, icons = ["◌", "◇", "✦", "⌁"] }: { value: string; onChange: (value: string) => void; options: string[]; icons?: string[] }) {
  return <div className="option-list">{options.map((item, index) => <button key={item} type="button" className="option-card" data-selected={value === item} onClick={() => onChange(item)}><span className="option-icon">{icons[index]}</span><span>{item}</span><i>{value === item ? "✓" : ""}</i></button>)}</div>;
}

function InfoPage({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return <PageShell><section className="page-hero"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></section>{children}</PageShell>;
}

function HowItWorks() {
  return <InfoPage eyebrow="Conheça o fluxo" title="Uma estrutura pensada para orientar cada passo"><section className="timeline">{[["01", "Apresente o contexto", "Comece com uma capa clara e uma mensagem que convide a pessoa a explorar."], ["02", "Conduza escolhas", "Use cartões de seleção para criar uma experiência interativa sem complicar a interface."], ["03", "Mostre uma síntese", "Finalize com uma tela de resultado ou um próximo passo que você pode personalizar."], ["04", "Adapte ao seu projeto", "Substitua cores, textos e blocos de conteúdo para criar a sua própria versão."]].map(([number, title, text]) => <article className="timeline-item" key={number}><span>{number}</span><div><h2>{title}</h2><p>{text}</p></div></article>)}</section></InfoPage>;
}

function LetterEditor() {
  const [text, setText] = useState("");
  const [theme, setTheme] = useState("Mensagem breve");
  return <InfoPage eyebrow="Editor demonstrativo" title="Transforme uma ideia em uma composição visual"><section className="editor-layout"><div className="editor-card"><div className="choice-pills">{["Mensagem breve", "Narrativa", "Convite", "Anotação"].map((item) => <button type="button" key={item} data-selected={theme === item} onClick={() => setTheme(item)}>{item}</button>)}</div><label className="text-field"><span>Seu texto</span><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Digite para visualizar a composição..." rows={9} /></label><p className="input-note">O texto não é salvo nem enviado.</p></div><article className="paper-preview"><p className="paper-kicker">{theme}</p><h2>Uma página para sua ideia</h2><div className="paper-line" /><p>{text || "Seu conteúdo aparecerá aqui em uma prévia somente visual."}</p><span>Template demonstrativo</span></article></section></InfoPage>;
}

function Completion() {
  return <PageShell compact><section className="result-card standalone"><div className="result-icon">✓</div><p className="eyebrow">Etapa concluída</p><h1>Obrigado por explorar o template</h1><p>Esta é uma página de conclusão genérica. Personalize-a para a experiência que deseja criar.</p><LocalLink className="primary-button link-button" to="/">Voltar à capa</LocalLink></section></PageShell>;
}

function SupportPage({ alternate = false }: { alternate?: boolean }) {
  return <InfoPage eyebrow={alternate ? "Variação de layout" : "Página de exemplo"} title={alternate ? "Uma página de apoio pronta para adaptar" : "Destaque uma iniciativa ou uma história importante"}><section className="support-layout"><article className="support-visual"><AmbientVisual variant={alternate ? "mint" : "violet"} /></article><article className="support-copy"><span className="number-chip">{alternate ? "02" : "01"}</span><h2>{alternate ? "Organize informações com leveza" : "Use imagens e blocos de apoio para criar contexto"}</h2><p>Esta tela é uma composição visual neutra. Ela não oferece doações, pagamentos, formulários ou mensagens para serviços externos.</p><div className="stat-row"><span><strong>100%</strong> local</span><span><strong>0</strong> integrações</span><span><strong>∞</strong> possibilidades</span></div></article></section></InfoPage>;
}

function LiveDemo() {
  const [slot, setSlot] = useState("");
  const [complete, setComplete] = useState(false);
  return <InfoPage eyebrow="Fluxo local" title="Demonstração de escolha de horário"><section className="schedule-card">{complete ? <div className="schedule-success"><span>✓</span><h2>Seleção visual concluída</h2><p>Nenhum horário foi reservado e nenhuma informação foi enviada.</p><button type="button" className="secondary-button" onClick={() => { setSlot(""); setComplete(false); }}>Escolher novamente</button></div> : <><p>Selecione um cartão para demonstrar um estado de agenda.</p><div className="slot-grid">{["09:00", "11:30", "14:00", "16:30"].map((item) => <button type="button" key={item} data-selected={slot === item} onClick={() => setSlot(item)}><span>Hoje</span><strong>{item}</strong></button>)}</div><button type="button" className="primary-button" disabled={!slot} onClick={() => setComplete(true)}>Confirmar visualmente</button></>}</section></InfoPage>;
}

function LegalPage({ terms = false }: { terms?: boolean }) {
  const title = terms ? "Termos de uso do template" : "Privacidade do template";
  return <InfoPage eyebrow="Documento demonstrativo" title={title}><article className="legal-card">{terms ? <><p>Este projeto é uma estrutura visual de demonstração. Quem o utilizar é responsável por adaptar conteúdo, identidade, avisos legais e comportamento às necessidades do próprio projeto.</p><p>O template não representa uma oferta, contrato, serviço profissional ou garantia. Antes de publicar uma versão personalizada, revise os textos com as pessoas responsáveis pelo seu negócio.</p></> : <><p>Esta versão demonstrativa não possui formulário de envio, ferramentas de medição, integrações ou armazenamento de dados no navegador.</p><p>Se você adicionar coleta, cookies, pagamentos, análises ou serviços de terceiros à sua versão, crie uma política de privacidade própria e compatível com a sua operação.</p></>}<LocalLink to="/" className="text-link">← Voltar à capa</LocalLink></article></InfoPage>;
}

function NotFound() {
  return <PageShell compact><section className="result-card standalone"><div className="result-icon">◇</div><p className="eyebrow">404</p><h1>Página não encontrada</h1><p>O endereço informado não faz parte deste template.</p><LocalLink className="primary-button link-button" to="/">Ir para a capa</LocalLink></section></PageShell>;
}

export function App() {
  const path = usePath();
  useEffect(() => { document.title = path === "/" ? "Experiência Guiada" : "Experiência Guiada | Template"; }, [path]);
  if (path === "/") return <Quiz />;
  if (path === "/como-funciona") return <HowItWorks />;
  if (path === "/escrever-carta") return <LetterEditor />;
  if (path === "/obrigado") return <Completion />;
  if (path === "/ajuda-milena") return <SupportPage />;
  if (path === "/apoio-milena") return <SupportPage alternate />;
  if (path === "/chamada-ao-vivo-milena") return <LiveDemo />;
  if (path === "/privacidade") return <LegalPage />;
  if (path === "/termos") return <LegalPage terms />;
  return <NotFound />;
}

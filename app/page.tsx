"use client";

import { FormEvent, lazy, Suspense, useEffect, useState } from "react";
import Noise from "../components/Noise";
import CountUp from "../components/CountUp";
import LogoLoop from "../components/LogoLoop";
import PageLoader from "../components/PageLoader";

const DotGrid = lazy(() => import("../components/DotGrid"));

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

function scheduleWhenIdle(callback: () => void, timeout = 1000) {
  const idleWindow = window as IdleWindow;
  if (idleWindow.requestIdleCallback) {
    const id = idleWindow.requestIdleCallback(callback, { timeout });
    return () => idleWindow.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(callback, Math.min(timeout, 350));
  return () => window.clearTimeout(id);
}

type MarketData = {
  dollar: {
    blue: { buy: number; sell: number } | null;
    official: { buy: number; sell: number } | null;
  };
  index: { symbol: string; value: number; changePercent: number } | null;
  stocks: Array<{ symbol: string; name: string; price: number; changePercent: number }>;
  updatedAt: string;
};

const clients = [
  { name: "SCR Industrial", logo: "/clients/scr.png" }, { name: "AFG Ingeniería", logo: "/clients/afg.png" },
  { name: "Ivanar", logo: "/clients/ivanar-clean.webp", style: "ivanar" }, { name: "Metalbo", logo: "/clients/metalbo.webp" },
  { name: "Fexa", logo: "/clients/fexa.svg" }, { name: "PREAR", logo: "/clients/prear.svg" },
  { name: "Socseme · SNT", logo: "/clients/socseme-mark.png", style: "socseme" }, { name: "Alfagro", logo: "/clients/alfagro.png" },
];

const creatingWords = ["conexiones", "soluciones", "oportunidades"];

type EventVisit = { title: string; role: string; text: string; photo?: string; thumbnail?: string; alt?: string; thumbnailWidth?: number; thumbnailHeight?: number };
const eventYears: { year: string; visits: EventVisit[] }[] = [
  { year: "2024", visits: [{ title: "Tecnofidta · Buenos Aires", role: "Comprador · Monthelado", text: "Mi primer gran evento industrial y el comienzo de una red profesional construida haciendo networking.", photo: "/events/tecnofidta-2024.webp", thumbnail: "/events/tecnofidta-2024-thumb.webp", thumbnailWidth: 240, thumbnailHeight: 178, alt: "Credencial de Tomás Vizzo en Tecnofidta 2024" }] },
  { year: "2025", visits: [{ title: "FIAR · Rosario", role: "Comprador · Monthelado", text: "Invitado por Durmar, especialista en implementación y soluciones a medida de bandas transportadoras." }] },
  { year: "2026", visits: [
    { title: "Autovisión", role: "Proveedor", text: "Repuestos industriales y automotrices; vínculos con talleres, marcas y empresas." },
    { title: "AgroActiva", role: "Proveedor", text: "Desarrollo de oportunidades y relaciones dentro del ecosistema agroindustrial.", photo: "/events/agroactiva-2026.webp", thumbnail: "/events/agroactiva-2026-thumb.webp", thumbnailWidth: 240, thumbnailHeight: 312, alt: "Visita de Tomás Vizzo a AgroActiva 2026" },
    { title: "Tecnofidta · Buenos Aires", role: "Proveedor", text: "Regreso al evento desde un nuevo rol, con foco en soluciones y relaciones B2B." },
  ] },
];

const Arrow = () => <span aria-hidden="true">↗</span>;

const ars = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const marketPrice = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

function Change({ value }: { value: number }) {
  const className = value > 0 ? "market-up" : value < 0 ? "market-down" : "market-flat";
  return <span className={className}>{value > 0 ? "+" : ""}{value.toFixed(1)}%</span>;
}

function MarketCard({ data, state }: { data: MarketData | null; state: "loading" | "ready" | "error" }) {
  return <article className="market-card" aria-live="polite">
    <div className="market-card-head">
      <div><span className="market-live" /> <b>PULSO ARGENTINO</b></div>
      <small>{data ? new Date(data.updatedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : "ACTUALIZANDO"}</small>
    </div>
    {state === "loading" && <div className="market-loading"><i /><i /><i /><i /></div>}
    {state === "error" && <div className="market-error"><b>Mercado en pausa</b><span>Las cotizaciones volverán a cargarse automáticamente.</span></div>}
    {state === "ready" && data && <>
      <div className="dollar-block">
        <span>DÓLAR BLUE · VENTA</span>
        <strong>{data.dollar.blue ? `$ ${ars.format(data.dollar.blue.sell)}` : "—"}</strong>
        <small>Oficial {data.dollar.official ? `$ ${ars.format(data.dollar.official.sell)}` : "—"}</small>
      </div>
      <div className="market-index">
        <span>S&amp;P MERVAL</span>
        <b>{data.index ? marketPrice.format(data.index.value) : "—"}</b>
        {data.index && <Change value={data.index.changePercent} />}
      </div>
      <div className="stock-list" aria-label="Acciones argentinas líderes">
        {data.stocks.map((stock) => <div className="stock-row" key={stock.symbol} title={stock.name}>
          <b>{stock.symbol}</b><span>$ {marketPrice.format(stock.price)}</span><Change value={stock.changePercent} />
        </div>)}
      </div>
      <p className="market-note">Datos orientativos · actualización automática</p>
    </>}
  </article>;
}

export default function Home() {
  const [formState, setFormState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [creatingWordIndex, setCreatingWordIndex] = useState(0);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [marketState, setMarketState] = useState<"loading" | "ready" | "error">("loading");
  const [ambientEffectsReady, setAmbientEffectsReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setCreatingWordIndex((value) => (value + 1) % creatingWords.length);
    }, 2400);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => scheduleWhenIdle(() => setAmbientEffectsReady(true), 1200), []);

  useEffect(() => {
    let active = true;
    let timer = 0;
    async function loadMarket() {
      try {
        const response = await fetch("/api/market", { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error();
        const nextData = await response.json() as MarketData;
        if (active) { setMarketData(nextData); setMarketState("ready"); }
      } catch {
        if (active) setMarketState((current) => current === "ready" ? "ready" : "error");
      }
    }
    const cancelScheduledLoad = scheduleWhenIdle(() => {
      loadMarket();
      timer = window.setInterval(loadMarket, 300_000);
    }, 900);
    return () => { active = false; cancelScheduledLoad(); window.clearInterval(timer); };
  }, []);

  function togglePhoto(photo: string | null) {
    const update = () => setExpandedPhoto(photo);
    const transitionDocument = document as Document & { startViewTransition?: (callback: () => void) => void };
    if (transitionDocument.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) transitionDocument.startViewTransition(update);
    else update();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; setFormState("sending");
    try {
      const response = await fetch("https://formsubmit.co/ajax/tomasvizzo.re@gmail.com", { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) });
      if (!response.ok) throw new Error(); form.reset(); setFormState("success");
    } catch { setFormState("error"); }
  }

  return <main className="portfolio-shell">
    <PageLoader />
    {ambientEffectsReady ? <Suspense fallback={<div className="site-dot-grid dot-grid-fallback" aria-hidden="true" />}>
      <DotGrid className="site-dot-grid" dotSize={3} gap={24} baseColor="#F7C59F" activeColor="#1A659E" proximity={160} speedTrigger={90} shockRadius={260} shockStrength={3} resistance={900} returnDuration={1.35} />
    </Suspense> : <div className="site-dot-grid dot-grid-fallback" aria-hidden="true" />}
    <header className="topbar"><nav className="frame nav" aria-label="Navegación principal">
      <a className="wordmark" href="#inicio"><i /> Tomás Vizzo</a>
      <div className="navlinks"><a href="#perfil">Perfil</a><a href="#trayectoria">Trayectoria</a><a href="#clientes">Clientes</a><a href="#eventos">Eventos</a><a href="#contacto">Contacto</a></div>
      <a className="pill" href="/files/CV_Tomas_Vizzo.pdf" target="_blank">CV <Arrow /></a>
    </nav></header>

    <section className="hero frame" id="inicio">
      <div className="hero-left">
        <article className="creating-card">
          <span className="creating-kicker">LO QUE IMPULSO</span>
          <div className="creating-phrase" aria-hidden="true">
            <strong>Crear</strong>
            <em key={creatingWords[creatingWordIndex]}>{creatingWords[creatingWordIndex]}</em>
          </div>
          <span className="creating-progress">0{creatingWordIndex + 1} / 03</span>
          <span className="sr-only">Crear conexiones, crear soluciones y crear oportunidades.</span>
        </article>
        <article className="mini-card number-card metric-card"><Noise patternSize={250} patternScaleX={1} patternScaleY={1} patternRefreshInterval={2} patternAlpha={15}/><b><CountUp from={0} to={35} duration={2} className="count-up-text" />M+</b><strong>Facturación gestionada</strong><small>en 10 meses</small></article>
        <MarketCard data={marketData} state={marketState} />
        <article className="mini-card network-card metric-card"><Noise patternSize={250} patternScaleX={1} patternScaleY={1} patternRefreshInterval={2} patternAlpha={11}/><span className="metric-eyebrow">RED COMERCIAL B2B</span><b><CountUp from={0} to={200} duration={2.4} className="count-up-text" />+</b><strong>Contactos profesionales</strong><small>Clientes, proveedores y compradores de distintos rubros.</small></article>
        <article className="personal-image-card">
          <img
            src="/hero/tomas-vizzo-card-960.webp"
            srcSet="/hero/tomas-vizzo-card-640.webp 640w, /hero/tomas-vizzo-card-960.webp 960w"
            sizes="(max-width: 700px) calc(100vw - 92px), (max-width: 1200px) 48vw, 365px"
            width={960}
            height={1198}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            alt="Retrato editorial de Tomás Vizzo"
          />
          <div className="photo-professional-tag">
            <strong>Asesor técnico comercial</strong>
            <span>Ventas B2B industriales</span>
            <small>Rosario · Santa Fe</small>
          </div>
        </article>
      </div>

      <div className="hero-copy">
        <span className="status"><i /> Disponible para nuevos desafíos</span>
        <h1>Conecto<br />soluciones que<br /><em>hacen avanzar.</em></h1>
        <p>Combino experiencia comercial, conocimiento técnico y gestión para transformar oportunidades en relaciones sostenibles.</p>
        <div className="hero-actions"><a className="black-button" href="#contacto">Conversemos <Arrow /></a><a className="text-button" href="#trayectoria">Ver trayectoria ↓</a></div>
        <div className="metric-row"><div><b>3</b><span>sectores<br />de experiencia</span></div><div><b>8</b><span>cuentas<br />desarrolladas</span></div></div>
      </div>
    </section>

    <section className="profile-section frame" id="perfil">
      <div className="profile-editorial-card">
        <header className="profile-card-head"><b>PERFIL PROFESIONAL</b><span>ROSARIO · 2026</span></header>
        <div className="profile-card-main">
          <div className="profile-card-copy"><span className="profile-index">01 / SOBRE MÍ</span><h2>Entender primero.<br /><em>Proponer después.</em></h2><p>Me interesa entender el negocio del cliente, detectar qué necesita y construir una relación que continúe después de la primera venta.</p><p>Combino Administración de Empresas con experiencia en ventas B2B, compras e inventarios industriales.</p></div>
        </div>
        <div className="profile-skill-grid">{["Ventas B2B","CRM","KPIs","Negociación","Compras","Excel avanzado"].map((x,i)=><span className={i % 2 ? "dark" : ""} key={x}>{x}</span>)}</div>
        <footer className="profile-card-foot"><p>PRESENTADO POR: <b>TOMÁS VIZZO</b></p><div><a href="https://www.linkedin.com/in/tomasvizzo/" target="_blank">LinkedIn ↗</a><a href="#contacto">Contacto ↘</a></div></footer>
      </div>
    </section>

    <section className="career-section" id="trayectoria"><div className="frame">
      <div className="section-kicker light"><span>02</span><p>TRAYECTORIA</p></div>
      <div className="career-title"><h2>Experiencia técnica.<br />Mirada comercial.</h2><a href="/files/CV_Tomas_Vizzo.pdf" target="_blank">Descargar CV <Arrow /></a></div>
      <div className="career-grid">
        <article><span>2025 — HOY</span><h3>Asesor Técnico Comercial</h3><b>Ledesma Rodamientos SRL</b><p>Ventas B2B, grandes cuentas, asesoramiento industrial, CRM, KPIs y desarrollo comercial.</p></article>
        <article><span>2024 — 2025</span><h3>Encargado de Compras y Pañol</h3><b>Monthelado</b><p>Compras e inventarios para ingeniería y mantenimiento, proveedores, logística y mejora de procesos.</p></article>
        <article><span>2023 — 2024</span><h3>Operario de Terminaciones</h3><b>Niccolo</b><p>Ensamblado, terminaciones complejas, preentrega y control de calidad en carrocerías.</p></article>
      </div>
    </div></section>

    <section className="clients-section frame" id="clientes">
      <div className="section-kicker"><span>03</span><p>RELACIONES COMERCIALES</p></div>
      <div className="section-head"><h2>Empresas con las que<br />construí vínculos.</h2></div>
      <LogoLoop
        logos={clients.map((client, index) => ({ ...client, src: client.logo, alt: `Logo de ${client.name}`, index }))}
        speed={105}
        direction="left"
        gap={14}
        hoverSpeed={0}
        fadeOut
        fadeOutColor="#FFFDF5"
        scaleOnHover
        ariaLabel="Empresas con las que Tomás Vizzo construyó vínculos comerciales"
        className="clients-logo-loop"
        renderItem={(item) => <article className={`client-card client-${item.style ?? String(item.name).toLowerCase().split(" ")[0]}`}><span>0{Number(item.index) + 1}</span><img src={String(item.src)} alt={String(item.alt)} loading="eager" decoding="async" /><b>{String(item.name)}</b></article>}
      />
    </section>

    <section className="events-section" id="eventos"><div className="frame">
      <div className="section-kicker"><span>04</span><h2 className="section-kicker-title">EVENTOS Y NETWORKING</h2></div>
      <div className="event-timeline">{eventYears.map((group)=><section className="event-year" key={group.year}>
        <b className="year-label">{group.year}</b>
        <div className="year-visits">{group.visits.map((visit)=><article className="event-visit" key={visit.title}>
          <div className="visit-heading">
            {visit.photo && <button className="event-thumb" onClick={()=>togglePhoto(visit.photo!)} aria-label={`Ampliar foto de ${visit.title}`}>{expandedPhoto!==visit.photo&&<img className="shared-event-photo" src={visit.thumbnail ?? visit.photo} width={visit.thumbnailWidth} height={visit.thumbnailHeight} loading="lazy" decoding="async" alt={visit.alt}/>}<span>＋</span></button>}
            <div><small>{visit.role}</small><h3>{visit.title}</h3></div>
          </div>
          <p>{visit.text}</p><Arrow />
        </article>)}</div>
      </section>)}</div>
    </div></section>

    {expandedPhoto && <button className="photo-lightbox" onClick={()=>togglePhoto(null)} aria-label="Cerrar foto ampliada"><img className="shared-event-photo" src={expandedPhoto} decoding="async" alt="Foto ampliada del evento"/><span>Tocá para cerrar</span></button>}

    <section className="contact-section frame" id="contacto">
      <div className="contact-intro"><div className="section-kicker"><span>05</span><p>CONTACTO</p></div><h2>¿Construimos<br />algo <em>juntos?</em></h2><p>Una oportunidad, un proyecto o una conversación. Escribime.</p><div className="socials"><a href="https://www.linkedin.com/in/tomasvizzo/" target="_blank">LinkedIn <Arrow /></a><a href="https://www.instagram.com/tomivzz_/" target="_blank">Instagram <Arrow /></a><a href="https://wa.me/5493412271426" target="_blank">WhatsApp <Arrow /></a></div></div>
      <form onSubmit={submit} className="contact-form-new"><input type="hidden" name="_subject" value="Nueva consulta desde tu portfolio"/><input type="hidden" name="_template" value="table"/><input className="honey" name="_honey" tabIndex={-1}/><label>Nombre<input name="name" required placeholder="Tu nombre"/></label><label>Correo<input name="email" type="email" required placeholder="tu@email.com"/></label><label>Empresa<input name="company" placeholder="Empresa (opcional)"/></label><label>Mensaje<textarea name="message" required rows={3} placeholder="Contame tu idea"/></label><button disabled={formState==="sending"}>{formState==="sending"?"Enviando...":<>Enviar mensaje <Arrow /></>}</button>{formState==="success"&&<p className="success">Mensaje enviado correctamente.</p>}{formState==="error"&&<p className="error">No se pudo enviar. Escribime por WhatsApp.</p>}</form>
    </section>

    <footer><div className="frame"><a className="wordmark" href="#inicio"><i /> Tomás Vizzo</a><p>Rosario, Santa Fe · 2026</p><a href="#inicio">Volver arriba ↑</a></div></footer>
  </main>;
}

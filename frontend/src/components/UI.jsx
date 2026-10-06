import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Mountain, ArrowUpRight } from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { dna, explorer } from "../services/intelligence";
export function Page({ eyebrow, title, description, children }) {
  return (
    <motion.section
      className="page section"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="page-heading">
        <div className="eyebrow">{eyebrow || "WILDROOT INTELLIGENCE"}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </motion.section>
  );
}
export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function ErrorBox({ error }) {
  return error ? (
    <div role="alert" className="error-box">
      {error}
    </div>
  ) : null;
}
export function Empty({
  title = "Nothing here yet.",
  description = "Your next adventure is waiting.",
  to = "/explore",
  action = "Explore trails",
}) {
  return (
    <div className="empty">
      <Mountain size={38} />
      <h3>{title}</h3>
      <p>{description}</p>
      <Link className="button" to={to}>
        {action}
        <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}
export function Disclaimer() {
  return null;
}
export function Dna({ profile }) {
  return (
    <div className="dna panel">
      <div className="eyebrow">
        <Sparkles size={14} /> ADVENTURE DNA
      </div>
      <h3>{explorer(profile)}</h3>
      <ResponsiveContainer width="100%" height={290}>
        <RadarChart data={dna(profile)} outerRadius="70%">
          <PolarGrid stroke="#cad7c0" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fontSize: 12, fill: "#64765a" }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke="#6f8e43"
            fill="#a5c36b"
            fillOpacity={0.45}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="dna-values">
        {dna(profile).map((x) => (
          <div key={x.metric}>
            <span>{x.metric}</span>
            <b>{x.value}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}
export function Ring({ score, label }) {
  return (
    <div className="ring" style={{ "--score": score }}>
      <div>
        <strong>{score}</strong>
        <span>/ 100</span>
        <small>{label}</small>
      </div>
    </div>
  );
}
